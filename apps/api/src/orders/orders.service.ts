import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AcquisitionType, ActorType, OrderStatus, PieceStatus } from "@dadan/db";
import type { Locale, ShippingAddress } from "@dadan/types";
import { localizeDesign } from "../common/i18n/localize";
import { AuditService } from "../audit/audit.service";
import { CertificatesService } from "../certificates/certificates.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { paginationParams } from "../common/constants";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificates: CertificatesService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
  ) {}

  async createPaidOrder(params: {
    clientId: string;
    pieceIds: string[];
    totalAmount: number;
    currency: string;
    paymentProvider: string;
    paymentMethod?: string;
    paymentReference: string;
    shippingAddress: ShippingAddress;
  }) {
    const order = await this.prisma.db.$transaction(async (tx) => {
      const pieces = await tx.piece.findMany({
        where: { id: { in: params.pieceIds } },
        include: { design: true },
      });

      if (pieces.length !== params.pieceIds.length) {
        throw new BadRequestException("One or more pieces not found");
      }

      for (const piece of pieces) {
        if (piece.status !== PieceStatus.AVAILABLE) {
          throw new BadRequestException(`Piece ${piece.serialNumber} is not available`);
        }
      }

      const created = await tx.order.create({
        data: {
          clientId: params.clientId,
          status: OrderStatus.PAID,
          totalAmount: params.totalAmount,
          currency: params.currency,
          paymentProvider: params.paymentProvider,
          paymentMethod: params.paymentMethod,
          paymentReference: params.paymentReference,
          shippingAddress: params.shippingAddress as object,
          items: {
            create: pieces.map((p) => ({
              pieceId: p.id,
              designId: p.designId,
              priceAtPurchase: p.design.basePrice,
            })),
          },
        },
        include: { items: true },
      });

      for (const piece of pieces) {
        await tx.piece.update({
          where: { id: piece.id },
          data: {
            status: PieceStatus.OWNED,
            currentOwnerId: params.clientId,
          },
        });

        await tx.ownershipRecord.create({
          data: {
            pieceId: piece.id,
            clientId: params.clientId,
            acquisitionType: AcquisitionType.PURCHASE,
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { clientId: params.clientId } });

      return created;
    });

    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: params.clientId,
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
        metadata: { orderId: order.id, clientId: params.clientId },
      });

      this.generateCertificateWithRetry(item.pieceId, params.clientId, order.id);
    }

    const client = await this.prisma.db.client.findUnique({
      where: { id: params.clientId },
    });
    if (client) {
      this.notifications.sendOrderPlacedEmail(client.email, {
        orderId: order.id,
        locale: client.locale,
      });
    }

    return order;
  }

  private async generateCertificateWithRetry(
    pieceId: string,
    clientId: string,
    orderId: string,
    attempt = 1,
  ): Promise<void> {
    const maxAttempts = 3;
    try {
      await this.certificates.generateCertificate(pieceId, clientId);
      await this.audit.log({
        actorType: ActorType.SYSTEM,
        actorId: "system",
        action: "CERTIFICATE_GENERATED",
        targetType: "Piece",
        targetId: pieceId,
        metadata: { orderId, clientId },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => {
          this.generateCertificateWithRetry(pieceId, clientId, orderId, attempt + 1);
        }, delay);
      } else {
        await this.audit.log({
          actorType: ActorType.SYSTEM,
          actorId: "system",
          action: "CERTIFICATE_GENERATION_FAILED",
          targetType: "Piece",
          targetId: pieceId,
          metadata: { orderId, clientId, error: errorMessage, attempts: maxAttempts },
        });
      }
    }
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
            include: { piece: true, design: true },
          },
        },
      }),
      this.prisma.db.order.count({ where: { clientId } }),
    ]);

    return {
      items: await Promise.all(
        items.map(async (order) => ({
          ...order,
          items: await Promise.all(
            order.items.map(async (item) => ({
              ...item,
              design: {
                ...localizeDesign(item.design, locale),
                imageUrls: await this.storage.resolvePublicUrls(item.design.imageUrls),
              },
            })),
          ),
        })),
      ),
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
          include: { piece: true, design: true },
        },
      },
    });
    if (!order) throw new NotFoundException("errors.ORDER_NOT_FOUND");

    return {
      ...order,
      items: await Promise.all(
        order.items.map(async (item) => ({
          ...item,
          design: {
            ...localizeDesign(item.design, locale),
            imageUrls: await this.storage.resolvePublicUrls(item.design.imageUrls),
          },
        })),
      ),
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
    status?: OrderStatus,
    clientId?: string,
  ) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const where = {
      ...(status ? { status } : {}),
      ...(clientId ? { clientId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.db.order.findMany({
        where,
        skip,
        take,
        orderBy: { placedAt: "desc" },
        include: {
          client: { select: { displayName: true, email: true } },
          items: { include: { piece: true } },
        },
      }),
      this.prisma.db.order.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  }

  async getAdminOrder(id: string) {
    const order = await this.prisma.db.order.findUnique({
      where: { id },
      include: {
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
        items: { include: { piece: true, design: true } },
      },
    });
    if (!order) throw new NotFoundException("errors.ORDER_NOT_FOUND");
    return order;
  }

  async updateOrderStatus(
    adminId: string,
    id: string,
    status: OrderStatus,
    ipAddress?: string,
  ) {
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
      metadata: { status },
      ipAddress,
    });

    return order;
  }
}
