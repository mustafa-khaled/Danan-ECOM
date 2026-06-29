import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PieceStatus } from "@dadan/db";
import type { ShippingAddress } from "@dadan/types";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService } from "../payments/payments.service";
import { PrismaService } from "../prisma/prisma.service";

const CART_HOLD_MINUTES = 30;

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly orders: OrdersService,
  ) {}

  async getCart(clientId: string) {
    await this.cleanupExpiredItems();

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

    return items.map((item) => ({
      id: item.id,
      addedAt: item.addedAt,
      expiresAt: item.expiresAt,
      piece: pieceMap.get(item.pieceId) ?? null,
    }));
  }

  async addToCart(clientId: string, pieceId: string) {
    await this.cleanupExpiredItems();

    const piece = await this.prisma.db.piece.findUnique({ where: { id: pieceId } });
    if (!piece) throw new NotFoundException("Piece not found");
    if (piece.status !== PieceStatus.AVAILABLE) {
      throw new BadRequestException("Piece is not available");
    }
    if (piece.currentOwnerId) {
      throw new BadRequestException("Piece is already owned");
    }

    const existingCart = await this.prisma.db.cartItem.findUnique({
      where: { pieceId },
    });
    if (existingCart && existingCart.clientId !== clientId) {
      if (existingCart.expiresAt > new Date()) {
        throw new BadRequestException("Piece is reserved in another cart");
      }
      await this.prisma.db.cartItem.delete({ where: { id: existingCart.id } });
    }

    const expiresAt = new Date(Date.now() + CART_HOLD_MINUTES * 60 * 1000);

    await this.prisma.db.cartItem.upsert({
      where: { pieceId },
      create: { clientId, pieceId, expiresAt },
      update: { clientId, expiresAt, addedAt: new Date() },
    });

    return this.getCart(clientId);
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
      paymentMethod: string;
      paymentToken: string;
    },
  ) {
    await this.cleanupExpiredItems();

    const cartItems = await this.prisma.db.cartItem.findMany({
      where: { clientId, expiresAt: { gt: new Date() } },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    const pieces = await this.prisma.db.piece.findMany({
      where: { id: { in: cartItems.map((i) => i.pieceId) } },
      include: { design: true },
    });
    const pieceMap = new Map(pieces.map((p) => [p.id, p]));

    for (const item of cartItems) {
      const piece = pieceMap.get(item.pieceId);
      if (!piece || piece.status !== PieceStatus.AVAILABLE) {
        throw new BadRequestException(
          `Piece ${piece?.serialNumber ?? item.pieceId} is no longer available`,
        );
      }
    }

    const totalAmount = pieces.reduce(
      (sum, piece) => sum + Number(piece.design.basePrice),
      0,
    );
    const currency = pieces[0]!.design.currency;

    const payment = await this.payments.charge(
      data.paymentToken,
      totalAmount,
      currency,
      { clientId, pieceIds: cartItems.map((i) => i.pieceId).join(",") },
    );

    if (!payment.success) {
      throw new BadRequestException(
        payment.failureMessage ?? "Payment failed",
      );
    }

    const order = await this.orders.createPaidOrder({
      clientId,
      pieceIds: cartItems.map((i) => i.pieceId),
      totalAmount,
      currency,
      paymentProvider: "mock",
      paymentReference: payment.providerReference!,
      shippingAddress: data.shippingAddress,
    });

    return {
      orderId: order.id,
      orderStatus: order.status,
      pieceSerials: pieces.map((p) => p.serialNumber),
    };
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
