import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { createHash } from "node:crypto";
import { ActorType, OrderStatus, PaymentStatus, PieceStatus } from "@dadan/db";
import type { Locale, ShippingAddress } from "@dadan/types";
import { localizeDesign, pickLocalized } from "../common/i18n/localize";
import { AuditService } from "../audit/audit.service";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService, PaymentMethod } from "../payments/payments.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { VisibilityService } from "../visibility/visibility.service";

// Must outlive Tap's 3-D Secure window (30 minutes) so a cardholder who takes
// their time on the bank's OTP page does not lose the pieces mid-authentication.
const CHECKOUT_HOLD_MINUTES = 35;

export interface CheckoutPaidResult {
  status: "paid";
  orderId: string;
  orderStatus: OrderStatus;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  pieceSerials: string[];
}

/** The cardholder must complete 3-D Secure at `redirectUrl` before we capture. */
export interface CheckoutRedirectResult {
  status: "requires_action";
  orderId: string;
  redirectUrl: string;
}

export type CheckoutResult = CheckoutPaidResult | CheckoutRedirectResult;

export interface CheckoutConfirmation {
  /** `pending` means Tap has not settled yet; the webhook will finish the job. */
  status: "paid" | "pending" | "failed";
  orderId: string;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly orders: OrdersService,
    private readonly storage: StorageService,
    private readonly visibility: VisibilityService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async getCart(clientId: string, locale: Locale = "ar") {
    const dbItems = await this.prisma.db.cartItem.findMany({
      where: { clientId },
    });

    const pieceIds = dbItems.map((i) => i.pieceId);
    const pieces = pieceIds.length
      ? await this.prisma.db.piece.findMany({
          where: { id: { in: pieceIds } },
          include: { design: { include: { collection: true } } },
        })
      : [];
    const pieceMap = new Map(pieces.map((p) => [p.id, p]));

    const items = await Promise.all(
      dbItems.map(async (item) => {
        const piece = pieceMap.get(item.pieceId);
        if (!piece) {
          return {
            id: item.id,
            addedAt: item.addedAt,
            piece: null,
          };
        }

        const { collection, ...designFields } = piece.design;
        return {
          id: item.id,
          addedAt: item.addedAt,
          piece: {
            ...piece,
            design: {
              ...localizeDesign(designFields, locale),
              collection: {
                id: collection.id,
                name: pickLocalized(locale, collection.name, collection.nameAr),
                slug: collection.slug,
              },
              imageUrls: await this.storage.resolvePublicUrls(piece.design.imageUrls),
            },
          },
        };
      }),
    );

    const validPieces = pieces.filter((p) => pieceMap.has(p.id));
    const vatRate = this.config.get<number>("VAT_RATE") ?? 0.15;
    let subtotal = 0;
    let vatAmount = 0;
    for (const piece of validPieces) {
      const price = Number(piece.design.basePrice);
      const itemTax = Math.round(price * vatRate * 100) / 100;
      subtotal += price;
      vatAmount += itemTax;
    }
    subtotal = Math.round(subtotal * 100) / 100;
    vatAmount = Math.round(vatAmount * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;
    const currency = validPieces[0]?.design.currency ?? "SAR";

    return {
      items,
      summary: {
        subtotal: Math.round(subtotal * 100) / 100,
        vatRate,
        vatAmount,
        total,
        currency,
        itemCount: validPieces.length,
      },
    };
  }

  async addToCart(
    clientId: string,
    clientGroups: string[],
    pieceId: string,
    locale: Locale = "ar",
  ) {
    const piece = await this.prisma.db.piece.findUnique({
      where: { id: pieceId },
      include: { design: { include: { collection: true } } },
    });
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");
    // Respect catalog curation: a client must not be able to buy a piece
    // whose design/collection is hidden from them (same rules as getDesignBySlug).
    this.assertPieceVisible(piece, clientGroups);
    if (piece.status !== PieceStatus.AVAILABLE) {
      throw new BadRequestException("errors.PIECE_NOT_AVAILABLE");
    }
    if (piece.currentOwnerId) {
      throw new BadRequestException("errors.PIECE_ALREADY_OWNED");
    }

    await this.prisma.db.cartItem.upsert({
      where: { clientId_pieceId: { clientId, pieceId } },
      create: { clientId, pieceId },
      update: { addedAt: new Date() },
    });

    return this.getCart(clientId, locale);
  }

  async removeFromCart(clientId: string, pieceId: string) {
    await this.prisma.db.cartItem.deleteMany({
      where: { clientId, pieceId },
    });
    return { success: true };
  }

  async reserveForCheckout(clientId: string, clientGroups: string[]) {
    const cartItems = await this.prisma.db.cartItem.findMany({
      where: { clientId },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException("errors.CART_EMPTY");
    }

    const pieceIds = cartItems.map((i) => i.pieceId);

    const pieces = await this.prisma.db.piece.findMany({
      where: { id: { in: pieceIds } },
      include: { design: { include: { collection: true } } },
    });
    const pieceMap = new Map(pieces.map((p) => [p.id, p]));

    for (const item of cartItems) {
      const piece = pieceMap.get(item.pieceId);
      if (!piece || piece.status !== PieceStatus.AVAILABLE || piece.currentOwnerId) {
        throw new BadRequestException("errors.PIECE_NOT_AVAILABLE");
      }
      this.assertPieceVisible(piece, clientGroups);
    }

    const existingReservations = await this.prisma.db.checkoutReservation.findMany({
      where: { pieceId: { in: pieceIds } },
    });

    const now = new Date();
    for (const reservation of existingReservations) {
      if (reservation.clientId !== clientId && reservation.expiresAt > now) {
        throw new BadRequestException("errors.PIECE_RESERVED");
      }
    }

    const expiresAt = new Date(Date.now() + CHECKOUT_HOLD_MINUTES * 60 * 1000);

    await Promise.all(
      pieceIds.map((pieceId) =>
        this.prisma.db.checkoutReservation.upsert({
          where: { pieceId },
          create: { clientId, pieceId, expiresAt },
          update: { clientId, expiresAt, createdAt: now },
        }),
      ),
    );

    return { reserved: true, expiresAt };
  }

  async checkout(
    clientId: string,
    clientGroups: string[],
    data: {
      shippingAddress: ShippingAddress;
      paymentMethod: PaymentMethod;
      paymentToken: string;
    },
  ): Promise<CheckoutResult> {
    const cartItems = await this.prisma.db.cartItem.findMany({
      where: { clientId },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException("errors.CART_EMPTY");
    }

    // Verify all pieces still have an active reservation for this client
    const pieceIds = cartItems.map((i) => i.pieceId);
    const now = new Date();
    const reservations = await this.prisma.db.checkoutReservation.findMany({
      where: { pieceId: { in: pieceIds }, clientId, expiresAt: { gt: now } },
    });
    if (reservations.length !== pieceIds.length) {
      throw new BadRequestException("errors.RESERVATION_EXPIRED");
    }

    const client = await this.prisma.db.client.findUniqueOrThrow({
      where: { id: clientId },
      select: { displayName: true, email: true },
    });

    // Anchor idempotency to the reservation rather than the wall clock: retries
    // of the same checkout reuse the key, while a fresh reserve starts a new one.
    const reservationEpoch = Math.min(
      ...reservations.map((r) => r.createdAt.getTime()),
    );

    const pieces = await this.prisma.db.piece.findMany({
      where: { id: { in: pieceIds } },
      include: { design: { include: { collection: true } } },
    });
    const pieceMap = new Map(pieces.map((p) => [p.id, p]));

    for (const item of cartItems) {
      const piece = pieceMap.get(item.pieceId);
      if (!piece || piece.status !== PieceStatus.AVAILABLE) {
        throw new BadRequestException("errors.PIECE_NOT_AVAILABLE");
      }
      this.assertPieceVisible(piece, clientGroups);
    }

    const vatRate = this.config.get<number>("VAT_RATE") ?? 0.15;

    // Compute per-item tax to match order creation (avoids rounding mismatch)
    let subtotal = 0;
    let vatAmount = 0;
    for (const piece of pieces) {
      const price = Number(piece.design.basePrice);
      const itemTax = Math.round(price * vatRate * 100) / 100;
      subtotal += price;
      vatAmount += itemTax;
    }
    subtotal = Math.round(subtotal * 100) / 100;
    vatAmount = Math.round(vatAmount * 100) / 100;
    const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;
    const currency = pieces[0]!.design.currency;

    const sortedPieceIds = pieceIds.sort().join("|");
    const idempotencyKey = `checkout_${clientId}_${reservationEpoch}_${createHash("sha256").update(sortedPieceIds).digest("hex").slice(0, 16)}`;

    // The order exists before the charge so that a 3DS redirect (which returns
    // out-of-band, possibly via webhook) always has a row to reconcile against.
    const order = await this.orders.createPendingOrder({
      clientId,
      pieceIds,
      subtotalAmount: subtotal,
      taxAmount: vatAmount,
      taxRate: vatRate,
      totalAmount,
      currency,
      paymentProvider: this.payments.providerName,
      paymentMethod: data.paymentMethod,
      shippingAddress: data.shippingAddress,
      idempotencyKey,
    });

    const paidResult = (): CheckoutPaidResult => ({
      status: "paid",
      orderId: order.id,
      orderStatus: OrderStatus.PAID,
      subtotal,
      vatAmount,
      totalAmount,
      pieceSerials: pieces.map((p) => p.serialNumber),
    });

    // Idempotent replay: this reservation already produced an order.
    if (order.paymentStatus === PaymentStatus.PAID) {
      return paidResult();
    }
    if (order.paymentReference) {
      return this.resumeExistingCharge(order.id, order.paymentReference, paidResult);
    }

    const payment = await this.payments.charge({
      token: data.paymentToken,
      amount: totalAmount,
      currency,
      paymentMethod: data.paymentMethod,
      idempotencyKey,
      customer: { name: client.displayName, email: client.email },
      metadata: { clientId, orderId: order.id, pieceIds: pieceIds.join(",") },
    });

    if (payment.providerReference) {
      await this.orders.attachPaymentReference(order.id, payment.providerReference);
    }

    if (payment.status === "failed") {
      await this.orders.failOrderPayment(
        order.id,
        payment.failureCode ?? "PAYMENT_FAILED",
      );
      throw new BadRequestException(
        payment.failureMessage ?? "errors.PAYMENT_FAILED",
      );
    }

    if (payment.status === "requires_action") {
      return {
        status: "requires_action",
        orderId: order.id,
        redirectUrl: payment.redirectUrl!,
      };
    }

    await this.confirmOrCompensate(
      order.id,
      clientId,
      payment.providerReference!,
      totalAmount,
      currency,
    );

    return paidResult();
  }

  /**
   * Called when the cardholder returns from Tap's 3-D Secure page. The `tapId`
   * comes from the return URL and is therefore untrusted — the real status is
   * fetched from Tap, and the resulting order must belong to the caller.
   */
  async confirmCheckout(clientId: string, tapId: string): Promise<CheckoutConfirmation> {
    const charge = await this.payments.retrieveCharge(tapId);
    if (!charge) {
      throw new BadRequestException("errors.PAYMENT_FAILED");
    }

    const order = await this.orders.findOrderForCharge(
      charge.id,
      charge.metadata?.orderId,
    );
    if (!order || order.clientId !== clientId) {
      throw new NotFoundException("errors.ORDER_NOT_FOUND");
    }

    // Tap's webhook often lands before the cardholder's browser gets back here.
    // Trust our own settled state over the charge's (briefly stale) status.
    if (order.paymentStatus === PaymentStatus.PAID) {
      return { status: "paid", orderId: order.id };
    }

    const status = this.payments.classifyChargeStatus(charge);

    if (status === "captured") {
      await this.confirmOrCompensate(
        order.id,
        clientId,
        charge.id,
        Number(order.totalAmount),
        order.currency,
      );
      return { status: "paid", orderId: order.id };
    }

    if (status === "requires_action") {
      // The bank has not finished authenticating yet; the webhook will settle it.
      return { status: "pending", orderId: order.id };
    }

    await this.orders
      .failOrderPayment(order.id, charge.status)
      .catch(() => undefined);
    return { status: "failed", orderId: order.id };
  }

  /**
   * Settles an order whose charge already exists, refunding if the pieces were
   * lost to a concurrent buyer between authorisation and confirmation.
   */
  private async confirmOrCompensate(
    orderId: string,
    clientId: string,
    providerReference: string,
    totalAmount: number,
    currency: string,
  ) {
    try {
      await this.orders.confirmOrderPayment(orderId, {
        paymentReference: providerReference,
      });
    } catch (error) {
      await this.refundFailedCheckout(
        clientId,
        providerReference,
        totalAmount,
        currency,
        error,
      );
      await this.orders
        .failOrderPayment(orderId, "CONFIRMATION_FAILED")
        .catch(() => undefined);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException("errors.CHECKOUT_REFUNDED");
    }
  }

  /**
   * A retried checkout landed on an order that already has a charge. Ask Tap
   * what actually happened rather than charging the customer a second time.
   */
  private async resumeExistingCharge(
    orderId: string,
    providerReference: string,
    paidResult: () => CheckoutPaidResult,
  ): Promise<CheckoutResult> {
    const charge = await this.payments.retrieveCharge(providerReference);

    if (charge?.status === "CAPTURED") {
      await this.orders.confirmOrderPayment(orderId, { paymentReference: charge.id });
      return paidResult();
    }
    if (charge?.transaction?.url) {
      return {
        status: "requires_action",
        orderId,
        redirectUrl: charge.transaction.url,
      };
    }

    await this.orders.failOrderPayment(orderId, charge?.status ?? "CHARGE_UNKNOWN");
    throw new BadRequestException("errors.PAYMENT_FAILED");
  }

  private async refundFailedCheckout(
    clientId: string,
    providerReference: string,
    amount: number,
    currency: string,
    cause: unknown,
  ) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    try {
      const refund = await this.payments.refund(providerReference, amount, currency);
      await this.audit.log({
        actorType: ActorType.SYSTEM,
        actorId: "system",
        action: refund.success ? "CHECKOUT_REFUNDED" : "CHECKOUT_REFUND_FAILED",
        targetType: "Client",
        targetId: clientId,
        metadata: {
          providerReference,
          amount,
          refundReference: refund.providerReference ?? null,
          checkoutError: causeMessage,
          ...(refund.success ? {} : { refundError: refund.failureMessage ?? null }),
        },
      });
      if (!refund.success) {
        this.logger.error(
          `Refund failed for charge ${providerReference} (client ${clientId}): ${refund.failureMessage}`,
        );
        await this.persistFailedRefund(clientId, providerReference, amount, currency, causeMessage);
      }
    } catch (refundError) {
      const errorMessage = refundError instanceof Error ? refundError.message : String(refundError);
      this.logger.error(
        `Refund attempt threw for charge ${providerReference} (client ${clientId})`,
        refundError instanceof Error ? refundError.stack : String(refundError),
      );
      await this.persistFailedRefund(clientId, providerReference, amount, currency, errorMessage);
    }
  }

  private async persistFailedRefund(
    clientId: string,
    providerReference: string,
    amount: number,
    currency: string,
    reason: string,
  ) {
    try {
      await this.prisma.db.failedRefund.create({
        data: { clientId, providerReference, amount, currency, reason },
      });
    } catch (persistError) {
      this.logger.error(
        `Failed to persist refund record for ${providerReference}`,
        persistError instanceof Error ? persistError.stack : String(persistError),
      );
    }
  }

  async cleanupExpiredItems() {
    await this.prisma.db.checkoutReservation.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  }

  /**
   * Same catalog rules as add-to-cart. Re-checked at reserve/checkout so a
   * visibility-group revocation after the item was added cannot still buy it.
   */
  private assertPieceVisible(
    piece: {
      design: {
        isActive: boolean;
        visibilityGroups: string[];
        collection: { isVisible: boolean; visibilityGroups: string[] };
      };
    },
    clientGroups: string[],
  ): void {
    if (
      !piece.design.isActive ||
      !piece.design.collection.isVisible ||
      !this.visibility.canAccess(clientGroups, piece.design.visibilityGroups) ||
      !this.visibility.canAccess(clientGroups, piece.design.collection.visibilityGroups)
    ) {
      throw new NotFoundException("errors.PIECE_NOT_FOUND");
    }
  }
}

@Injectable()
export class CartCleanupService {
  private readonly logger = new Logger(CartCleanupService.name);

  constructor(
    private readonly cart: CartService,
    private readonly orders: OrdersService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleCleanup() {
    void this.cart.cleanupExpiredItems();
    // Releases pieces held by checkouts abandoned partway through 3-D Secure.
    void this.orders.expireStalePendingOrders().catch((error: unknown) => {
      this.logger.error(
        `Failed to expire stale pending orders: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }
}
