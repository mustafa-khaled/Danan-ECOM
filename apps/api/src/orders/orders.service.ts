import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  AcquisitionType,
  ActorType,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  PieceStatus,
} from "@dadan/db";
import type { Locale, ShippingAddress } from "@dadan/types";
import { pickLocalized } from "../common/i18n/localize";
import { AuditService } from "../audit/audit.service";
import { CertificateOutboxService } from "../certificates/certificate-outbox.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { paginationParams } from "../common/constants";
import { runSerializable } from "../common/db/serializable";

export interface CreateOrderParams {
  clientId: string;
  pieceIds: string[];
  /**
   * The unit price, per piece id, that the totals below were computed from.
   *
   * The caller reads prices without a lock; this transaction then re-reads them
   * under `FOR UPDATE` and derives each `lineTotal` from the locked value. Without
   * this cross-check an admin price edit landing in that window produced an order
   * whose item line totals did not add up to its `totalAmount` — and it was the
   * stale `totalAmount` that got charged.
   */
  expectedUnitPrices: Record<string, number>;
  subtotalAmount: number;
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
  currency: string;
  paymentProvider: string;
  paymentMethod?: string;
  /** Gateway charge id. Unknown until the charge is created, so optional. */
  paymentReference?: string;
  shippingAddress: ShippingAddress;
  idempotencyKey?: string;
}

/** PENDING orders past this age are assumed abandoned mid-3DS and released. */
const PENDING_ORDER_TTL_MINUTES = 35;

/** Per-sweep cap; each order with a charge costs one gateway round trip. */
const STALE_ORDER_SWEEP_LIMIT = 50;

/** Money is stored as `Decimal(12,2)`, so two decimal places is the unit of truth. */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Compares amounts below the smallest representable difference. */
function sameMoney(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005;
}

/**
 * Client-facing order reads used to `include` the whole piece and its whole
 * collection. That pulled `story` plus the base64 `imageLqips` array for every
 * line of every order on the page — hundreds of kilobytes to render a list that
 * only shows a name and a thumbnail.
 */
const ORDER_ITEM_SELECT = {
  id: true,
  pieceId: true,
  priceAtPurchase: true,
  taxRate: true,
  taxAmount: true,
  discountAmount: true,
  lineTotal: true,
  currency: true,
  nameSnapshot: true,
  collectionNameSnapshot: true,
  piece: {
    select: {
      id: true,
      serialNumber: true,
      name: true,
      nameAr: true,
      mainImageUrl: true,
      mainImageLqip: true,
      collectionId: true,
    },
  },
} as const;

type OrderItemProjection = {
  piece: {
    name: string;
    nameAr: string | null;
    mainImageUrl: string | null;
    mainImageLqip: string | null;
  };
};

/** Resolves the thumbnail URL and collapses the piece name to one locale. */
function localizeOrderItem<T extends OrderItemProjection>(
  item: T,
  locale: Locale,
  urlMap: Map<string, string>,
) {
  const { nameAr, ...piece } = item.piece;
  return {
    ...item,
    piece: {
      ...piece,
      name: pickLocalized(locale, piece.name, nameAr),
      mainImageUrl: piece.mainImageUrl
        ? (urlMap.get(piece.mainImageUrl) ?? null)
        : null,
    },
  };
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: CertificateOutboxService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Reserves the pieces and records the order before any money moves. The order
   * stays PENDING until the payment is confirmed, which for 3-D Secure happens
   * only after the cardholder returns from the bank's authentication page.
   *
   * Deliberately does not transfer ownership, clear the cart, issue
   * certificates or email the client — all of that belongs to
   * `confirmOrderPayment`, so an abandoned 3DS flow leaves no side effects.
   */
  async createPendingOrder(params: CreateOrderParams) {
    // Check idempotency: if this payment was already processed, return existing order
    if (params.idempotencyKey) {
      const existingOrder = await this.prisma.db.order.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
        include: { items: true },
      });
      if (existingOrder) {
        return existingOrder;
      }
    }

    return runSerializable(this.prisma.db, async (tx) => {
      // CR-02: Lock piece rows with FOR UPDATE to prevent double-sale
      // This ensures no concurrent transaction can modify these pieces
      const lockedPieces = await tx.$queryRaw<
        Array<{
          id: string;
          serialNumber: string;
          status: string;
          name: string;
          price: string;
          currency: string;
          collectionId: string;
        }>
      >`
        SELECT id, "serialNumber", status, name, price, currency, "collectionId"
        FROM "Piece"
        WHERE id = ANY(${params.pieceIds}::text[])
        FOR UPDATE
      `;

      if (lockedPieces.length !== params.pieceIds.length) {
        throw new BadRequestException("One or more pieces not found");
      }

      for (const piece of lockedPieces) {
        if (piece.status !== PieceStatus.AVAILABLE) {
          throw new ConflictException(
            `Piece ${piece.serialNumber} is no longer available`,
          );
        }
      }

      // The pieces stay AVAILABLE until payment is confirmed, so the row lock
      // above only holds for the length of this transaction. `CheckoutReservation`
      // is what actually keeps two buyers off the same piece across the 3DS
      // window, which makes it a precondition for creating the order rather than
      // just a cart-level courtesy check.
      const heldByCaller = await tx.checkoutReservation.count({
        where: {
          pieceId: { in: params.pieceIds },
          clientId: params.clientId,
          expiresAt: { gt: new Date() },
        },
      });
      if (heldByCaller !== params.pieceIds.length) {
        throw new ConflictException("errors.RESERVATION_EXPIRED");
      }

      // Prices and currency must still be what the quoted totals were built from,
      // otherwise the amount charged and the amount itemised would disagree.
      for (const piece of lockedPieces) {
        const quoted = params.expectedUnitPrices[piece.id];
        if (
          quoted === undefined ||
          !sameMoney(Number(piece.price), quoted) ||
          piece.currency !== params.currency
        ) {
          throw new ConflictException("errors.PRICE_CHANGED");
        }
      }

      const collections = await tx.collection.findMany({
        where: { id: { in: lockedPieces.map((p) => p.collectionId) } },
        select: { id: true, name: true },
      });
      const collectionMap = new Map(collections.map((c) => [c.id, c]));

      const items = lockedPieces.map((p) => {
        const priceAtPurchase = Number(p.price);
        const itemTaxAmount = roundMoney(priceAtPurchase * params.taxRate);
        return {
          pieceId: p.id,
          priceAtPurchase,
          taxRate: params.taxRate,
          taxAmount: itemTaxAmount,
          lineTotal: roundMoney(priceAtPurchase + itemTaxAmount),
          currency: params.currency,
          nameSnapshot: p.name,
          collectionNameSnapshot: collectionMap.get(p.collectionId)?.name ?? null,
        };
      });

      // Belt and braces on the money maths: the line totals are what the customer
      // sees itemised and `totalAmount` is what the gateway charges, so a rounding
      // change in either place must not be allowed to silently split them.
      const lineTotalSum = roundMoney(
        items.reduce((sum, item) => sum + item.lineTotal, 0),
      );
      if (!sameMoney(lineTotalSum, params.totalAmount)) {
        this.logger.error(
          `Order totals disagree for client ${params.clientId}: line totals sum to ` +
            `${lineTotalSum} but the order totals ${params.totalAmount}`,
        );
        throw new ConflictException("errors.PRICE_CHANGED");
      }

      return tx.order.create({
        data: {
          clientId: params.clientId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          subtotalAmount: params.subtotalAmount,
          taxAmount: params.taxAmount,
          taxRate: params.taxRate,
          totalAmount: params.totalAmount,
          currency: params.currency,
          paymentProvider: params.paymentProvider,
          paymentMethod: params.paymentMethod,
          paymentReference: params.paymentReference,
          idempotencyKey: params.idempotencyKey,
          shippingAddress: params.shippingAddress as object,
          items: { create: items },
        },
        include: { items: true },
      });
    });
  }

  /** Records the gateway charge id so an inbound webhook can find this order. */
  async attachPaymentReference(orderId: string, paymentReference: string) {
    await this.prisma.db.order.update({
      where: { id: orderId },
      data: { paymentReference },
    });
  }

  /**
   * Promotes a PENDING order to PAID and runs every post-payment side effect.
   *
   * Idempotent by design: both the 3DS return call and Tap's webhook race to
   * confirm the same charge, so a second call must be a no-op rather than
   * transferring ownership or issuing certificates twice.
   */
  async confirmOrderPayment(
    orderId: string,
    options: { paymentReference?: string; paymentMethod?: string } = {},
  ) {
    const { order, alreadyConfirmed } = await runSerializable(
      this.prisma.db,
      async (tx) => {
        const existing = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (!existing) throw new NotFoundException("errors.ORDER_NOT_FOUND");

        if (existing.paymentStatus === PaymentStatus.PAID) {
          return { order: existing, alreadyConfirmed: true };
        }
        if (existing.status === OrderStatus.CANCELLED) {
          throw new BadRequestException("errors.ORDER_NOT_CANCELLABLE");
        }

        const pieceIds = existing.items.map((item) => item.pieceId);
        const lockedPieces = await tx.$queryRaw<
          Array<{ id: string; serialNumber: string; status: string; currentOwnerId: string | null }>
        >`
          SELECT id, "serialNumber", status, "currentOwnerId"
          FROM "Piece"
          WHERE id = ANY(${pieceIds}::text[])
          FOR UPDATE
        `;

        for (const piece of lockedPieces) {
          const ownedByThisClient =
            piece.status === PieceStatus.OWNED &&
            piece.currentOwnerId === existing.clientId;
          if (piece.status !== PieceStatus.AVAILABLE && !ownedByThisClient) {
            throw new ConflictException(
              `Piece ${piece.serialNumber} is no longer available`,
            );
          }
        }

        for (const piece of lockedPieces) {
          if (piece.status === PieceStatus.AVAILABLE) {
            await tx.piece.update({
              where: { id: piece.id },
              data: {
                status: PieceStatus.OWNED,
                currentOwnerId: existing.clientId,
              },
            });

            await tx.ownershipRecord.create({
              data: {
                pieceId: piece.id,
                clientId: existing.clientId,
                acquisitionType: AcquisitionType.PURCHASE,
              },
            });

            // Recorded in this transaction so a Redis outage between commit and
            // enqueue cannot leave a paid-for piece without a certificate.
            await this.outbox.record(tx, {
              pieceId: piece.id,
              clientId: existing.clientId,
              orderId: existing.id,
            });
          }
        }

        const updated = await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PAID,
            paymentStatus: PaymentStatus.PAID,
            ...(options.paymentReference
              ? { paymentReference: options.paymentReference }
              : {}),
            ...(options.paymentMethod ? { paymentMethod: options.paymentMethod } : {}),
          },
          include: { items: true },
        });

        // Scoped to this order's pieces: the client may have a second checkout
        // in flight, and items added during the 3DS window must survive.
        await tx.cartItem.deleteMany({
          where: { pieceId: { in: pieceIds } },
        });
        await tx.checkoutReservation.deleteMany({
          where: { pieceId: { in: pieceIds } },
        });
        await tx.savedPiece.deleteMany({
          where: { pieceId: { in: pieceIds } },
        });

        return { order: updated, alreadyConfirmed: false };
      },
    );

    if (alreadyConfirmed) {
      return order;
    }

    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: order.clientId,
      action: "ORDER_PLACED",
      targetType: "Order",
      targetId: order.id,
    });

    await this.audit.logMany(
      order.items.map((item) => ({
        actorType: ActorType.SYSTEM,
        actorId: "system",
        action: "PIECE_OWNERSHIP_TRANSFERRED",
        targetType: "Piece",
        targetId: item.pieceId,
        metadata: { orderId: order.id, clientId: order.clientId },
      })),
    );

    const client = await this.prisma.db.client.findUnique({
      where: { id: order.clientId },
      select: { email: true, locale: true },
    });
    if (client) {
      this.notifications.sendOrderPlacedEmail(client.email, {
        orderId: order.id,
        locale: client.locale,
      });
    }

    return order;
  }

  /**
   * Records that money was captured for an order that can no longer accept it
   * (typically CANCELLED before the webhook arrived). The row is picked up by
   * `RefundRecoveryService`, which retries the refund with a charge-keyed
   * idempotency reference and escalates to an admin once attempts are exhausted.
   *
   * Idempotent: repeated deliveries for the same charge reuse the open row
   * rather than queueing a second refund.
   */
  async recordUnmatchedCapture(
    order: { id: string; clientId: string; status: OrderStatus },
    charge: { id: string; amount: number; currency: string; status: string },
  ): Promise<void> {
    const existing = await this.prisma.db.failedRefund.findFirst({
      where: { providerReference: charge.id, resolvedAt: null },
      select: { id: true },
    });
    if (existing) return;

    await this.prisma.db.failedRefund.create({
      data: {
        clientId: order.clientId,
        providerReference: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        reason: `CAPTURED_WITHOUT_OPEN_ORDER:${order.status}:${order.id}`,
      },
    });
  }

  /**
   * Marks a PENDING order as failed and releases the pieces it was holding.
   * Safe to call repeatedly — an already-cancelled order is left untouched.
   */
  async failOrderPayment(orderId: string, reason: string) {
    const existing = await this.prisma.db.order.findUnique({
      where: { id: orderId },
      include: { items: { select: { pieceId: true } } },
    });
    if (!existing) throw new NotFoundException("errors.ORDER_NOT_FOUND");

    if (existing.status === OrderStatus.CANCELLED) {
      return existing;
    }
    if (existing.paymentStatus === PaymentStatus.PAID) {
      // Never unwind a settled order automatically; flag it for a human.
      this.logger.error(
        `Refusing to fail order ${orderId}: payment already captured (${reason})`,
      );
      throw new BadRequestException("errors.ORDER_NOT_CANCELLABLE");
    }

    const order = await this.prisma.db.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    // Only this order's holds: the client may have another checkout in flight.
    await this.prisma.db.checkoutReservation.deleteMany({
      where: {
        clientId: existing.clientId,
        pieceId: { in: existing.items.map((item) => item.pieceId) },
      },
    });

    await this.audit.log({
      actorType: ActorType.SYSTEM,
      actorId: "system",
      action: "ORDER_PAYMENT_FAILED",
      targetType: "Order",
      targetId: orderId,
      metadata: { reason },
    });

    return order;
  }

  /**
   * Creates and immediately settles an order. Used when the gateway captures
   * synchronously (no 3DS challenge) and by the mock provider.
   */
  async createPaidOrder(params: CreateOrderParams) {
    const pending = await this.createPendingOrder(params);

    if (pending.paymentStatus === PaymentStatus.PAID) {
      return pending;
    }

    return this.confirmOrderPayment(pending.id, {
      paymentReference: params.paymentReference,
      paymentMethod: params.paymentMethod,
    });
  }

  /**
   * Resolves the order behind a gateway charge. Prefers the stored reference,
   * falling back to the order id we stamp into the charge metadata — a webhook
   * can outrun `attachPaymentReference` when the charge settles instantly.
   */
  async findOrderForCharge(chargeId: string, metadataOrderId?: string) {
    const byReference = await this.prisma.db.order.findFirst({
      where: { paymentReference: chargeId },
    });
    if (byReference) return byReference;

    if (!metadataOrderId) return null;

    // M-07: Tap's webhook signature does not cover `metadata`, so this id is
    // attacker-controllable on an otherwise valid charge. Only PENDING orders
    // that are not yet bound to a different charge may be resolved this way;
    // callers must still verify the amount before settling.
    return this.prisma.db.order.findFirst({
      where: {
        id: metadataOrderId,
        status: OrderStatus.PENDING,
        OR: [{ paymentReference: null }, { paymentReference: chargeId }],
      },
    });
  }

  /**
   * Orders whose cardholder never came back from 3DS. Those carrying a
   * `paymentReference` may still have captured at the gateway, so the caller
   * must ask the provider before cancelling them — see
   * `PaymentsService.reconcileStalePendingOrders`.
   */
  findStalePendingOrders() {
    const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);
    return this.prisma.db.order.findMany({
      where: { status: OrderStatus.PENDING, placedAt: { lt: cutoff } },
      // Bounded so a backlog cannot serialise hundreds of 30s gateway lookups
      // into a single cron tick; the oldest are drained first and the rest wait
      // for the next sweep.
      take: STALE_ORDER_SWEEP_LIMIT,
      orderBy: { placedAt: "asc" },
      select: {
        id: true,
        paymentReference: true,
        totalAmount: true,
        currency: true,
        clientId: true,
      },
    });
  }

  /**
   * Releases pieces held by stale orders that never reached the gateway, so an
   * abandoned checkout cannot hold its pieces indefinitely. Orders that do have
   * a charge reference are deliberately left to the reconciliation sweep, which
   * checks with the provider first rather than cancelling a captured payment.
   */
  async expireStalePendingOrders(): Promise<number> {
    const stale = await this.findStalePendingOrders();

    let expired = 0;
    for (const order of stale) {
      if (order.paymentReference) continue;
      try {
        await this.failOrderPayment(order.id, "PENDING_ORDER_EXPIRED");
        expired += 1;
      } catch (error) {
        this.logger.error(
          `Failed to expire stale order ${order.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return expired;
  }

  async getClientOrders(
    clientId: string,
    page?: number,
    limit?: number,
    locale: Locale = "ar",
  ) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.db.order.findMany({
        where: { clientId },
        skip,
        take,
        orderBy: { placedAt: "desc" },
        include: { items: { select: ORDER_ITEM_SELECT } },
      }),
      this.prisma.db.order.count({ where: { clientId } }),
    ]);

    // Collect all main image keys for batched resolution
    const allMainImageUrls: string[] = [];
    for (const order of items) {
      for (const item of order.items) {
        if (item.piece.mainImageUrl) allMainImageUrls.push(item.piece.mainImageUrl);
      }
    }

    const urlMap = await this.storage.resolvePublicUrlsBatch(allMainImageUrls);

    return {
      items: items.map((order) => ({
        ...order,
        items: order.items.map((item) =>
          localizeOrderItem(item, locale, urlMap),
        ),
      })),
      total,
      page: p,
      limit: l,
    };
  }

  async getClientOrder(
    clientId: string,
    orderId: string,
    locale: Locale = "ar",
  ) {
    const order = await this.prisma.db.order.findFirst({
      where: { id: orderId, clientId },
      include: { items: { select: ORDER_ITEM_SELECT } },
    });
    if (!order) throw new NotFoundException("errors.ORDER_NOT_FOUND");

    const mainImageKeys = order.items
      .map((item) => item.piece.mainImageUrl)
      .filter(Boolean) as string[];
    const urlMap = await this.storage.resolvePublicUrlsBatch(mainImageKeys);

    return {
      ...order,
      items: order.items.map((item) => localizeOrderItem(item, locale, urlMap)),
    };
  }

  async cancelOrder(clientId: string, orderId: string) {
    const order = await this.prisma.db.order.findFirst({
      where: { id: orderId, clientId },
      include: { items: { select: { pieceId: true } } },
    });
    if (!order) throw new NotFoundException("errors.ORDER_NOT_FOUND");
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException("errors.ORDER_NOT_CANCELLABLE");
    }
    // A charge exists and may still capture (the cardholder could be mid-3DS).
    // Cancelling here would release the pieces while the money still lands,
    // so only the reconciliation sweep — which asks Tap for the authoritative
    // status first — may close this order.
    if (order.paymentReference) {
      throw new ConflictException("errors.ORDER_PAYMENT_IN_PROGRESS");
    }

    const pieceIds = order.items.map((item) => item.pieceId);

    const cancelled = await this.prisma.db.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    // H-07: Release this order's checkout reservations so the pieces become
    // available immediately, without touching holds for another in-flight order.
    await this.prisma.db.checkoutReservation.deleteMany({
      where: { clientId, pieceId: { in: pieceIds } },
    });

    return cancelled;
  }

  async listAdminOrders(
    page?: number,
    limit?: number,
    filters?: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      paymentMethod?: string;
      clientId?: string;
      q?: string;
    },
  ) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const q = filters?.q?.trim();
    const where = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
      ...(filters?.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
      ...(q
        ? {
            OR: [
              { paymentReference: { contains: q, mode: "insensitive" as const } },
              { client: { displayName: { contains: q, mode: "insensitive" as const } } },
              { client: { email: { contains: q.toLowerCase() } } },
              { items: { some: { piece: { serialNumber: { contains: q.toUpperCase() } } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.db.order.findMany({
        where,
        skip,
        take,
        orderBy: { placedAt: "desc" },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          totalAmount: true,
          currency: true,
          placedAt: true,
          client: { select: { id: true, displayName: true, email: true } },
          items: {
            select: {
              id: true,
              piece: { select: { serialNumber: true, name: true, nameAr: true } },
            },
          },
        },
      }),
      this.prisma.db.order.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  }

  async getOrderStats() {
    const groups = await this.prisma.db.order.groupBy({
      by: ["paymentStatus"],
      _sum: { totalAmount: true },
      _count: { _all: true },
    });
    const byStatus = Object.fromEntries(
      groups.map((row) => [
        row.paymentStatus,
        {
          count: row._count._all,
          total: row._sum.totalAmount ?? 0,
        },
      ]),
    );
    const totalRevenue = groups
      .filter((row) => row.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, row) => sum + Number(row._sum.totalAmount ?? 0), 0);
    const pending = groups.find((row) => row.paymentStatus === PaymentStatus.PENDING);
    const refunded = groups.filter((row) =>
      row.paymentStatus === PaymentStatus.REFUNDED ||
      row.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED,
    );
    return {
      totalRevenue,
      successful: totalRevenue,
      pending: Number(pending?._sum.totalAmount ?? 0),
      refunded: refunded.reduce((sum, row) => sum + Number(row._sum.totalAmount ?? 0), 0),
      byStatus,
    };
  }

  async getAdminOrder(id: string) {
    const order = await this.prisma.db.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        paymentMethod: true,
        paymentProvider: true,
        paymentReference: true,
        subtotalAmount: true,
        taxAmount: true,
        shippingAmount: true,
        discountAmount: true,
        totalAmount: true,
        currency: true,
        shippingAddress: true,
        placedAt: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            houseKeyPrefix: true,
            isActive: true,
          },
        },
        items: {
          select: {
            id: true,
            priceAtPurchase: true,
            lineTotal: true,
            nameSnapshot: true,
            collectionNameSnapshot: true,
            piece: {
              select: {
                id: true,
                serialNumber: true,
                name: true,
                nameAr: true,
                collection: { select: { id: true, name: true, nameAr: true } },
              },
            },
          },
        },
      },
    });
    if (!order) throw new NotFoundException("errors.ORDER_NOT_FOUND");
    return order;
  }

  /**
   * A settled order can no longer be cancelled by a status change: doing so
   * left the money captured, the pieces owned and the certificates valid while
   * the order read CANCELLED, and permanently wedged the order because both
   * `confirmOrderPayment` and `failOrderPayment` refuse to touch it afterwards.
   * Unwinding a paid order goes through `refundOrder`, which compensates.
   */
  private static readonly ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PROCESSING],
    [OrderStatus.PROCESSING]: [OrderStatus.FULFILLED],
    [OrderStatus.FULFILLED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  async updateOrderStatus(
    adminId: string,
    id: string,
    status: OrderStatus,
    ipAddress?: string,
  ) {
    // Read and write under one lock: two admins acting at once could otherwise
    // both pass the transition check against the same starting status.
    const { order, from } = await runSerializable(this.prisma.db, async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id}::text FOR UPDATE`;

      const existing = await tx.order.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!existing) throw new NotFoundException("errors.ORDER_NOT_FOUND");

      const allowedTransitions = OrdersService.ORDER_TRANSITIONS[existing.status];
      if (!allowedTransitions.includes(status)) {
        throw new BadRequestException(
          `Invalid order status transition from ${existing.status} to ${status}`,
        );
      }

      const updated = await tx.order.update({ where: { id }, data: { status } });
      return { order: updated, from: existing.status };
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "ORDER_STATUS_UPDATED",
      targetType: "Order",
      targetId: id,
      metadata: { from, to: status },
      ipAddress,
    });

    return order;
  }

  /**
   * Unwinds a settled order: releases the pieces, closes their ownership
   * records, revokes the certificates and queues the gateway refund.
   *
   * The gateway call is deliberately not made here. Recording a `FailedRefund`
   * hands it to `RefundRecoveryService`, which retries with a charge-keyed
   * idempotency reference and escalates to an admin when attempts run out — so
   * a gateway outage cannot leave the DB unwound but the money still captured.
   *
   * Pieces the client no longer owns (already transferred on, or mid-transfer)
   * are left alone and reported back for manual follow-up.
   */
  async refundOrder(
    adminId: string,
    id: string,
    reason: string,
    ipAddress?: string,
  ) {
    const result = await runSerializable(this.prisma.db, async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id}::text FOR UPDATE`;

      const existing = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          clientId: true,
          status: true,
          paymentStatus: true,
          paymentReference: true,
          totalAmount: true,
          currency: true,
          items: { select: { pieceId: true } },
        },
      });
      if (!existing) throw new NotFoundException("errors.ORDER_NOT_FOUND");

      if (existing.paymentStatus !== PaymentStatus.PAID) {
        throw new BadRequestException("errors.ORDER_NOT_REFUNDABLE");
      }

      const pieceIds = existing.items.map((item) => item.pieceId);
      const lockedPieces = await tx.$queryRaw<
        Array<{ id: string; status: string; currentOwnerId: string | null }>
      >`
        SELECT id, status, "currentOwnerId"
        FROM "Piece"
        WHERE id = ANY(${pieceIds}::text[])
        FOR UPDATE
      `;

      const releasable = lockedPieces.filter(
        (piece) =>
          piece.status === PieceStatus.OWNED &&
          piece.currentOwnerId === existing.clientId,
      );
      const skipped = lockedPieces
        .filter((piece) => !releasable.some((r) => r.id === piece.id))
        .map((piece) => piece.id);

      const now = new Date();
      const releasableIds = releasable.map((piece) => piece.id);

      if (releasableIds.length > 0) {
        await tx.piece.updateMany({
          where: { id: { in: releasableIds } },
          data: { status: PieceStatus.AVAILABLE, currentOwnerId: null },
        });

        // Append-only history: close the record rather than deleting it.
        await tx.ownershipRecord.updateMany({
          where: {
            pieceId: { in: releasableIds },
            clientId: existing.clientId,
            transferredAt: null,
          },
          data: { transferredAt: now },
        });

        await tx.certificate.updateMany({
          where: { pieceId: { in: releasableIds }, isActive: true },
          data: { isActive: false },
        });
      }

      const order = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.REFUNDED,
          fulfillmentStatus: FulfillmentStatus.RETURNED,
        },
      });

      if (existing.paymentReference) {
        const pending = await tx.failedRefund.findFirst({
          where: { providerReference: existing.paymentReference, resolvedAt: null },
          select: { id: true },
        });
        if (!pending) {
          await tx.failedRefund.create({
            data: {
              clientId: existing.clientId,
              providerReference: existing.paymentReference,
              amount: existing.totalAmount,
              currency: existing.currency,
              reason: `ADMIN_REFUND:${id}:${reason}`,
            },
          });
        }
      }

      return { order, released: releasableIds, skipped };
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "ORDER_REFUNDED",
      targetType: "Order",
      targetId: id,
      metadata: {
        reason,
        releasedPieces: result.released,
        skippedPieces: result.skipped,
      },
      ipAddress,
    });

    if (result.skipped.length > 0) {
      this.logger.error(
        `Order ${id} refunded but ${result.skipped.length} piece(s) could not be ` +
          `released (no longer owned by the buyer): ${result.skipped.join(", ")}`,
      );
    }

    return result.order;
  }
}
