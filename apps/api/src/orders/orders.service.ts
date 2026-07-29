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
import { localizeDesign } from "../common/i18n/localize";
import { AuditService } from "../audit/audit.service";
import { CERTIFICATE_QUEUE } from "../certificates/jobs/certificate-job.processor";
import type { GenerateCertificateJobData } from "../certificates/jobs/certificate-job.processor";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { paginationParams } from "../common/constants";

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

  async createPaidOrder(params: {
    clientId: string;
    pieceIds: string[];
    subtotalAmount: number;
    taxAmount: number;
    taxRate: number;
    totalAmount: number;
    currency: string;
    paymentProvider: string;
    paymentMethod?: string;
    paymentReference: string;
    shippingAddress: ShippingAddress;
    idempotencyKey?: string;
  }) {
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

    const order = await this.prisma.db.$transaction(
      async (tx) => {
        // CR-02: Lock piece rows with FOR UPDATE to prevent double-sale
        // This ensures no concurrent transaction can modify these pieces
        const lockedPieces = await tx.$queryRaw<
          Array<{
            id: string;
            serialNumber: string;
            status: string;
            designId: string;
          }>
        >`
          SELECT id, "serialNumber", status, "designId"
          FROM "Piece"
          WHERE id = ANY(${params.pieceIds}::uuid[])
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

        // Get design info for the locked pieces
        const designs = await tx.design.findMany({
          where: { id: { in: lockedPieces.map((p) => p.designId) } },
        });
        const designMap = new Map(designs.map((d) => [d.id, d]));

        const created = await tx.order.create({
          data: {
            clientId: params.clientId,
            status: OrderStatus.PAID,
            paymentStatus: PaymentStatus.PAID,
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
                const design = designMap.get(p.designId)!;
                const priceAtPurchase = Number(design.basePrice);
                const itemTaxAmount =
                  Math.round(priceAtPurchase * params.taxRate * 100) / 100;
                const lineTotal =
                  Math.round((priceAtPurchase + itemTaxAmount) * 100) / 100;
                return {
                  pieceId: p.id,
                  designId: p.designId,
                  priceAtPurchase: design.basePrice,
                  taxRate: params.taxRate,
                  taxAmount: itemTaxAmount,
                  lineTotal,
                  currency: params.currency,
                };
              }),
            },
          },
          include: { items: true },
        });

        // Update pieces and create ownership records
        for (const piece of lockedPieces) {
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
      },
      {
        // Use serializable isolation for maximum safety
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

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
