import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  AcquisitionType,
  ActorType,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  PieceStatus,
  Prisma,
} from "@dadan/db";
import type { Locale, ShippingAddress } from "@dadan/types";
import { localizePiece } from "../common/i18n/localize";
import { AuditService } from "../audit/audit.service";
import { CERTIFICATE_QUEUE } from "../certificates/jobs/certificate-job.processor";
import type { GenerateCertificateJobData } from "../certificates/jobs/certificate-job.processor";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { paginationParams } from "../common/constants";

export interface CreateOrderParams {
  clientId: string;
  pieceIds: string[];
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

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CERTIFICATE_QUEUE) private readonly certificateQueue: Queue<GenerateCertificateJobData>,
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

    return this.prisma.db.$transaction(
      async (tx) => {
        // CR-02: Lock piece rows with FOR UPDATE to prevent double-sale
        // This ensures no concurrent transaction can modify these pieces
        const lockedPieces = await tx.$queryRaw<
          Array<{
            id: string;
            serialNumber: string;
            status: string;
            name: string;
            price: string;
            collectionId: string;
          }>
        >`
          SELECT id, "serialNumber", status, name, price, "collectionId"
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

        const collections = await tx.collection.findMany({
          where: { id: { in: lockedPieces.map((p) => p.collectionId) } },
          select: { id: true, name: true },
        });
        const collectionMap = new Map(collections.map((c) => [c.id, c]));

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
            items: {
              create: lockedPieces.map((p) => {
                const priceAtPurchase = Number(p.price);
                const itemTaxAmount =
                  Math.round(priceAtPurchase * params.taxRate * 100) / 100;
                const lineTotal =
                  Math.round((priceAtPurchase + itemTaxAmount) * 100) / 100;
                return {
                  pieceId: p.id,
                  priceAtPurchase,
                  taxRate: params.taxRate,
                  taxAmount: itemTaxAmount,
                  lineTotal,
                  currency: params.currency,
                  nameSnapshot: p.name,
                  collectionNameSnapshot:
                    collectionMap.get(p.collectionId)?.name ?? null,
                };
              }),
            },
          },
          include: { items: true },
        });
      },
      {
        // Use serializable isolation for maximum safety
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
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
    const { order, alreadyConfirmed } = await this.prisma.db.$transaction(
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

        await tx.cartItem.deleteMany({ where: { clientId: existing.clientId } });
        await tx.checkoutReservation.deleteMany({
          where: { clientId: existing.clientId },
        });
        await tx.savedPiece.deleteMany({
          where: { pieceId: { in: pieceIds } },
        });

        return { order: updated, alreadyConfirmed: false };
      },
      {
        // Use serializable isolation for maximum safety
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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

    for (const item of order.items) {
      await this.audit.log({
        actorType: ActorType.SYSTEM,
        actorId: "system",
        action: "PIECE_OWNERSHIP_TRANSFERRED",
        targetType: "Piece",
        targetId: item.pieceId,
        metadata: { orderId: order.id, clientId: order.clientId },
      });

      this.generateCertificateWithRetry(item.pieceId, order.clientId, order.id);
    }

    const client = await this.prisma.db.client.findUnique({
      where: { id: order.clientId },
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
   * Marks a PENDING order as failed and releases the pieces it was holding.
   * Safe to call repeatedly — an already-cancelled order is left untouched.
   */
  async failOrderPayment(orderId: string, reason: string) {
    const existing = await this.prisma.db.order.findUnique({
      where: { id: orderId },
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

    await this.prisma.db.checkoutReservation.deleteMany({
      where: { clientId: existing.clientId },
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

    // Tap's webhook signature does not cover `metadata`, so this id is
    // attacker-controllable on an otherwise valid charge. Only orders that are
    // not yet bound to a different charge may be resolved this way; callers
    // must still verify the amount before settling.
    return this.prisma.db.order.findFirst({
      where: {
        id: metadataOrderId,
        OR: [{ paymentReference: null }, { paymentReference: chargeId }],
      },
    });
  }

  /**
   * Releases pieces held by orders whose cardholder never came back from 3DS.
   * Without this an abandoned checkout would hold its pieces indefinitely.
   */
  async expireStalePendingOrders(): Promise<number> {
    const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);
    const stale = await this.prisma.db.order.findMany({
      where: { status: OrderStatus.PENDING, placedAt: { lt: cutoff } },
      select: { id: true },
    });

    let expired = 0;
    for (const order of stale) {
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

  private generateCertificateWithRetry(
    pieceId: string,
    clientId: string,
    orderId: string,
  ): void {
    this.certificateQueue.add(
      "generate-certificate",
      { pieceId, clientId, orderId },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    ).catch((err) => {
      this.logger.error(
        `Failed to enqueue certificate job for piece ${pieceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
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
        include: {
          items: {
            include: { piece: { include: { collection: true } } },
          },
        },
      }),
      this.prisma.db.order.count({ where: { clientId } }),
    ]);

    // Collect all unique image URLs across all order items for batched resolution
    const allImageUrls: (string | null | undefined)[] = [];
    for (const order of items) {
      for (const item of order.items) {
        allImageUrls.push(...item.piece.imageUrls);
      }
    }

    // Resolve all URLs in a single batch
    const urlMap = await this.storage.resolvePublicUrlsBatch(allImageUrls);

    return {
      items: items.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          piece: {
            ...localizePiece(item.piece, locale),
            imageUrls: item.piece.imageUrls
              .map((url) => urlMap.get(url))
              .filter((url): url is string => url !== undefined),
          },
        })),
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
      include: {
        items: {
          include: { piece: { include: { collection: true } } },
        },
      },
    });
    if (!order) throw new NotFoundException("errors.ORDER_NOT_FOUND");

    // Collect all image URLs for batched resolution
    const allImageUrls: (string | null | undefined)[] = [];
    for (const item of order.items) {
      allImageUrls.push(...item.piece.imageUrls);
    }
    const urlMap = await this.storage.resolvePublicUrlsBatch(allImageUrls);

    return {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        piece: {
          ...localizePiece(item.piece, locale),
          imageUrls: item.piece.imageUrls
            .map((url) => urlMap.get(url))
            .filter((url): url is string => url !== undefined),
        },
      })),
    };
  }

  async cancelOrder(clientId: string, orderId: string) {
    const order = await this.prisma.db.order.findFirst({
      where: { id: orderId, clientId },
    });
    if (!order) throw new NotFoundException("errors.ORDER_NOT_FOUND");
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException("errors.ORDER_NOT_CANCELLABLE");
    }

    return this.prisma.db.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
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
              piece: { select: { serialNumber: true } },
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
                collection: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!order) throw new NotFoundException("errors.ORDER_NOT_FOUND");
    return order;
  }

  private static readonly ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.FULFILLED, OrderStatus.CANCELLED],
    [OrderStatus.FULFILLED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  async updateOrderStatus(
    adminId: string,
    id: string,
    status: OrderStatus,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.db.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("errors.ORDER_NOT_FOUND");

    const allowedTransitions = OrdersService.ORDER_TRANSITIONS[existing.status];
    if (!allowedTransitions.includes(status)) {
      throw new BadRequestException(
        `Invalid order status transition from ${existing.status} to ${status}`,
      );
    }

    const order = await this.prisma.db.order.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "ORDER_STATUS_UPDATED",
      targetType: "Order",
      targetId: id,
      metadata: { from: existing.status, to: status },
      ipAddress,
    });

    return order;
  }
}
