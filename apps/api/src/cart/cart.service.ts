import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ActorType, PieceStatus } from "@dadan/db";
import type { Locale, ShippingAddress } from "@dadan/types";
import { localizeDesign, pickLocalized } from "../common/i18n/localize";
import { AuditService } from "../audit/audit.service";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService, PaymentMethod } from "../payments/payments.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { VisibilityService } from "../visibility/visibility.service";

const CART_HOLD_MINUTES = 30;

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
    const items = await this.prisma.db.cartItem.findMany({
      where: { clientId, expiresAt: { gt: new Date() } },
    });

    const pieceIds = items.map((i) => i.pieceId);
    const pieces = pieceIds.length
      ? await this.prisma.db.piece.findMany({
          where: { id: { in: pieceIds } },
          include: { design: { include: { collection: true } } },
        })
      : [];
    const pieceMap = new Map(pieces.map((p) => [p.id, p]));

    return Promise.all(
      items.map(async (item) => {
        const piece = pieceMap.get(item.pieceId);
        if (!piece) {
          return {
            id: item.id,
            addedAt: item.addedAt,
            expiresAt: item.expiresAt,
            piece: null,
          };
        }

        const { collection, ...designFields } = piece.design;
        return {
          id: item.id,
          addedAt: item.addedAt,
          expiresAt: item.expiresAt,
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
    if (
      !piece.design.isActive ||
      !piece.design.collection.isVisible ||
      !this.visibility.canAccess(clientGroups, piece.design.visibilityGroups) ||
      !this.visibility.canAccess(clientGroups, piece.design.collection.visibilityGroups)
    ) {
      throw new NotFoundException("errors.PIECE_NOT_FOUND");
    }
    if (piece.status !== PieceStatus.AVAILABLE) {
      throw new BadRequestException("errors.PIECE_NOT_AVAILABLE");
    }
    if (piece.currentOwnerId) {
      throw new BadRequestException("errors.PIECE_ALREADY_OWNED");
    }

    const existingCart = await this.prisma.db.cartItem.findUnique({
      where: { pieceId },
    });
    if (existingCart && existingCart.clientId !== clientId) {
      if (existingCart.expiresAt > new Date()) {
        throw new BadRequestException("errors.PIECE_RESERVED");
      }
      await this.prisma.db.cartItem.delete({ where: { id: existingCart.id } });
    }

    const expiresAt = new Date(Date.now() + CART_HOLD_MINUTES * 60 * 1000);

    await this.prisma.db.cartItem.upsert({
      where: { pieceId },
      create: { clientId, pieceId, expiresAt },
      update: { clientId, expiresAt, addedAt: new Date() },
    });

    return this.getCart(clientId, locale);
  }

  async removeFromCart(clientId: string, pieceId: string) {
    await this.prisma.db.cartItem.deleteMany({
      where: { clientId, pieceId },
    });
    return { success: true };
  }

  async checkout(
    clientId: string,
    data: {
      shippingAddress: ShippingAddress;
      paymentMethod: PaymentMethod;
      paymentToken: string;
    },
  ) {
    const cartItems = await this.prisma.db.cartItem.findMany({
      where: { clientId, expiresAt: { gt: new Date() } },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException("errors.CART_EMPTY");
    }

    const client = await this.prisma.db.client.findUniqueOrThrow({
      where: { id: clientId },
      select: { displayName: true, email: true },
    });

    const pieces = await this.prisma.db.piece.findMany({
      where: { id: { in: cartItems.map((i) => i.pieceId) } },
      include: { design: true },
    });
    const pieceMap = new Map(pieces.map((p) => [p.id, p]));

    for (const item of cartItems) {
      const piece = pieceMap.get(item.pieceId);
      if (!piece || piece.status !== PieceStatus.AVAILABLE) {
        throw new BadRequestException("errors.PIECE_NOT_AVAILABLE");
      }
    }

    const subtotal = pieces.reduce(
      (sum, piece) => sum + Number(piece.design.basePrice),
      0,
    );
    // Charge the VAT-inclusive total so the amount billed matches what the
    // checkout UI displays.
    const vatRate = this.config.get<number>("VAT_RATE") ?? 0.15;
    const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
    const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;
    const currency = pieces[0]!.design.currency;

    const payment = await this.payments.charge({
      token: data.paymentToken,
      amount: totalAmount,
      currency,
      paymentMethod: data.paymentMethod,
      customer: { name: client.displayName, email: client.email },
      metadata: { clientId, pieceIds: cartItems.map((i) => i.pieceId).join(",") },
    });

    if (!payment.success) {
      throw new BadRequestException(
        payment.failureMessage ?? "errors.PAYMENT_FAILED",
      );
    }

    let order;
    try {
      order = await this.orders.createPaidOrder({
        clientId,
        pieceIds: cartItems.map((i) => i.pieceId),
        totalAmount,
        currency,
        paymentProvider: this.payments.providerName,
        paymentMethod: data.paymentMethod,
        paymentReference: payment.providerReference!,
        shippingAddress: data.shippingAddress,
      });
    } catch (error) {
      // The charge succeeded but the order could not be created (e.g. a piece
      // was sold concurrently). Refund so the client is never charged for an
      // order that does not exist.
      await this.refundFailedCheckout(
        clientId,
        payment.providerReference!,
        totalAmount,
        currency,
        error,
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException("errors.CHECKOUT_REFUNDED");
    }

    return {
      orderId: order.id,
      orderStatus: order.status,
      subtotal,
      vatAmount,
      totalAmount,
      pieceSerials: pieces.map((p) => p.serialNumber),
    };
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
      }
    } catch (refundError) {
      // Never mask the original checkout failure; log for manual reconciliation.
      this.logger.error(
        `Refund attempt threw for charge ${providerReference} (client ${clientId})`,
        refundError instanceof Error ? refundError.stack : String(refundError),
      );
    }
  }

  async cleanupExpiredItems() {
    await this.prisma.db.cartItem.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  }
}

@Injectable()
export class CartCleanupService {
  constructor(private readonly cart: CartService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleCleanup() {
    void this.cart.cleanupExpiredItems();
  }
}
