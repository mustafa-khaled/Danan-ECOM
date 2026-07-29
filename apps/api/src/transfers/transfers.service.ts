import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  AcquisitionType,
  ActorType,
  PieceStatus,
  Prisma,
  TransferStatus,
  TransferType,
} from "@dadan/db";
import type { Locale } from "@dadan/types";
import { canTransitionTransfer, maskDisplayName } from "@dadan/utils";
import { localizeDesign, pickLocalized } from "../common/i18n/localize";
import { AuthService } from "../auth/auth.service";
import { AuditService } from "../audit/audit.service";
import { CERTIFICATE_QUEUE } from "../certificates/jobs/certificate-job.processor";
import type { GenerateCertificateJobData } from "../certificates/jobs/certificate-job.processor";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { StorageService } from "../storage/storage.service";
import {
  paginationParams,
  AUTH_FAILURE_MESSAGE,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
} from "../common/constants";

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    @InjectQueue(CERTIFICATE_QUEUE) private readonly certificateQueue: Queue<GenerateCertificateJobData>,
    private readonly notifications: NotificationsService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  async initiate(
    clientId: string,
    data: {
      pieceId: string;
      transferType: TransferType;
      recipientHouseKey: string;
    },
    ipAddress?: string,
    locale: Locale = "ar",
  ) {
    const rateLimitKey = `transfer:initiate:${clientId}`;
    const limited = await this.redis.isRateLimited(
      rateLimitKey,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_SECONDS,
    );
    if (limited) {
      throw new HttpException("errors.TOO_MANY_REQUESTS", HttpStatus.TOO_MANY_REQUESTS);
    }

    // Pre-check piece ownership (non-locking, for early rejection)
    const piece = await this.prisma.db.piece.findFirst({
      where: { id: data.pieceId, currentOwnerId: clientId },
      include: { design: true },
    });
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");

    const recipient = await this.auth.findClientByHouseKey(
      data.recipientHouseKey,
      clientId,
    );
    if (!recipient) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const transfer = await this.prisma.db.$transaction(
      async (tx) => {
        // CR-03: Lock the piece row to prevent concurrent transfer initiation
        const [lockedPiece] = await tx.$queryRaw<
          Array<{ id: string; status: string; currentOwnerId: string | null }>
        >`
          SELECT id, status, "currentOwnerId"
          FROM "Piece"
          WHERE id = ${data.pieceId}::uuid
          FOR UPDATE
        `;

        if (!lockedPiece) {
          throw new NotFoundException("errors.PIECE_NOT_FOUND");
        }

        if (lockedPiece.currentOwnerId !== clientId) {
          throw new BadRequestException("errors.NOT_PIECE_OWNER");
        }

        if (lockedPiece.status === PieceStatus.TRANSFER_PENDING) {
          throw new ConflictException("errors.TRANSFER_IN_PROGRESS");
        }

        if (lockedPiece.status !== PieceStatus.OWNED) {
          throw new BadRequestException("errors.PIECE_NOT_TRANSFERABLE");
        }

        // Double-check no active transfer exists (partial unique index is backup)
        const activeTransfer = await tx.transferRequest.findFirst({
          where: {
            pieceId: data.pieceId,
            status: { notIn: ["APPROVED", "REJECTED", "CANCELLED"] },
          },
        });
        if (activeTransfer) {
          throw new ConflictException("errors.TRANSFER_IN_PROGRESS");
        }

        await tx.piece.update({
          where: { id: data.pieceId },
          data: { status: PieceStatus.TRANSFER_PENDING },
        });

        return tx.transferRequest.create({
          data: {
            pieceId: data.pieceId,
            fromClientId: clientId,
            toClientId: recipient.id,
            transferType: data.transferType,
            status: TransferStatus.INITIATED,
          },
          include: {
            piece: { include: { design: true } },
            toClient: { select: { displayName: true, email: true } },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: clientId,
      action: "TRANSFER_INITIATED",
      targetType: "TransferRequest",
      targetId: transfer.id,
      ipAddress,
    });

    const sender = await this.prisma.db.client.findUnique({ where: { id: clientId } });
    if (sender) {
      this.notifications.sendTransferInitiatedEmail(sender.email, {
        transferId: transfer.id,
        locale: sender.locale,
      });
    }

    return {
      transferId: transfer.id,
      status: transfer.status,
      piece: {
        id: transfer.piece.id,
        serialNumber: transfer.piece.serialNumber,
        name: pickLocalized(
          locale,
          transfer.piece.design.name,
          transfer.piece.design.nameAr,
        ),
        image: await this.storage.resolvePublicUrl(transfer.piece.design.imageUrls[0]),
      },
      recipientDisplayName: maskDisplayName(transfer.toClient.displayName),
    };
  }

  async confirmSender(transferId: string, clientId: string, ipAddress?: string) {
    const updated = await this.prisma.db.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT id FROM "TransferRequest"
          WHERE id = ${transferId}::uuid
          FOR UPDATE
        `;

        const transfer = await tx.transferRequest.findFirst({
          where: { id: transferId, fromClientId: clientId },
        });
        if (!transfer) throw new NotFoundException("errors.TRANSFER_NOT_FOUND");
        this.assertTransition(transfer.status, TransferStatus.SENDER_CONFIRMED);

        return tx.transferRequest.update({
          where: { id: transferId },
          data: {
            status: TransferStatus.SENDER_CONFIRMED,
            senderConfirmedAt: new Date(),
          },
          include: { toClient: { select: { email: true, locale: true } } },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: clientId,
      action: "TRANSFER_SENDER_CONFIRMED",
      targetType: "TransferRequest",
      targetId: transferId,
      ipAddress,
    });

    this.notifications.sendTransferSenderConfirmedEmail(updated.toClient.email, {
      transferId,
      locale: updated.toClient.locale,
    });

    return updated;
  }

  async confirmRecipient(transferId: string, clientId: string, ipAddress?: string) {
    const updated = await this.prisma.db.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT id FROM "TransferRequest"
          WHERE id = ${transferId}::uuid
          FOR UPDATE
        `;

        const transfer = await tx.transferRequest.findFirst({
          where: { id: transferId, toClientId: clientId },
        });
        if (!transfer) throw new NotFoundException("errors.TRANSFER_NOT_FOUND");
        this.assertTransition(transfer.status, TransferStatus.RECIPIENT_CONFIRMED);
        this.assertTransition(TransferStatus.RECIPIENT_CONFIRMED, TransferStatus.DADAN_REVIEW);

        return tx.transferRequest.update({
          where: { id: transferId },
          data: {
            status: TransferStatus.DADAN_REVIEW,
            recipientConfirmedAt: new Date(),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: clientId,
      action: "TRANSFER_RECIPIENT_CONFIRMED",
      targetType: "TransferRequest",
      targetId: transferId,
      ipAddress,
    });

    await this.audit.log({
      actorType: ActorType.SYSTEM,
      actorId: "system",
      action: "TRANSFER_DADAN_REVIEW_TRIGGERED",
      targetType: "TransferRequest",
      targetId: transferId,
    });

    this.notifications.sendTransferDadanReviewEmail({ transferId });

    return updated;
  }

  async cancel(transferId: string, clientId: string, ipAddress?: string) {
    const transfer = await this.getTransferForSender(transferId, clientId);
    if (!["INITIATED", "SENDER_CONFIRMED"].includes(transfer.status)) {
      throw new BadRequestException("errors.TRANSFER_NOT_CANCELLABLE");
    }

    const updated = await this.prisma.db.$transaction(
      async (tx) => {
        // Lock transfer and piece for atomic cancellation
        const [lockedTransfer] = await tx.$queryRaw<
          Array<{ id: string; status: string; pieceId: string }>
        >`
          SELECT id, status, "pieceId"
          FROM "TransferRequest"
          WHERE id = ${transferId}::uuid
          FOR UPDATE
        `;

        if (
          !lockedTransfer ||
          !["INITIATED", "SENDER_CONFIRMED"].includes(lockedTransfer.status)
        ) {
          throw new ConflictException("errors.TRANSFER_NOT_CANCELLABLE");
        }

        await tx.$queryRaw`
          SELECT id FROM "Piece"
          WHERE id = ${transfer.pieceId}::uuid
          FOR UPDATE
        `;

        await tx.piece.update({
          where: { id: transfer.pieceId },
          data: { status: PieceStatus.OWNED },
        });

        return tx.transferRequest.update({
          where: { id: transferId },
          data: {
            status: TransferStatus.CANCELLED,
            completedAt: new Date(),
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await this.audit.log({
      actorType: ActorType.CLIENT,
      actorId: clientId,
      action: "TRANSFER_CANCELLED_BY_SENDER",
      targetType: "TransferRequest",
      targetId: transferId,
      ipAddress,
    });

    const sender = await this.prisma.db.client.findUnique({
      where: { id: clientId },
    });
    if (sender) {
      this.notifications.sendTransferCancelledEmail(sender.email, {
        transferId,
        locale: sender.locale,
      });
    }

    return updated;
  }

  async listClientTransfers(clientId: string, locale: Locale = "ar") {
    const transfers = await this.prisma.db.transferRequest.findMany({
      where: {
        OR: [{ fromClientId: clientId }, { toClientId: clientId }],
      },
      include: {
        piece: { include: { design: true } },
        fromClient: { select: { displayName: true } },
        toClient: { select: { displayName: true } },
      },
      orderBy: { initiatedAt: "desc" },
    });

    return transfers.map((t) => ({
      id: t.id,
      status: t.status,
      transferType: t.transferType,
      initiatedAt: t.initiatedAt,
      piece: {
        id: t.piece.id,
        serialNumber: t.piece.serialNumber,
        name: pickLocalized(locale, t.piece.design.name, t.piece.design.nameAr),
      },
      otherPartyDisplayName: maskDisplayName(
        t.fromClientId === clientId
          ? t.toClient.displayName
          : t.fromClient.displayName,
      ),
    }));
  }

  async getClientTransfer(
    transferId: string,
    clientId: string,
    locale: Locale = "ar",
  ) {
    const transfer = await this.prisma.db.transferRequest.findFirst({
      where: {
        id: transferId,
        OR: [{ fromClientId: clientId }, { toClientId: clientId }],
      },
      include: {
        piece: { include: { design: true } },
        fromClient: { select: { displayName: true } },
        toClient: { select: { displayName: true } },
      },
    });
    if (!transfer) throw new NotFoundException("errors.TRANSFER_NOT_FOUND");

    return {
      ...transfer,
      piece: {
        ...transfer.piece,
        design: {
          ...localizeDesign(transfer.piece.design, locale),
          imageUrls: await this.storage.resolvePublicUrls(transfer.piece.design.imageUrls),
        },
      },
    };
  }

  async listAdminTransfers(
    page?: number,
    limit?: number,
    status?: TransferStatus,
  ) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.db.transferRequest.findMany({
        where,
        skip,
        take,
        orderBy: { initiatedAt: "desc" },
        include: {
          piece: { include: { design: true } },
          fromClient: { select: { displayName: true, email: true } },
          toClient: { select: { displayName: true, email: true } },
        },
      }),
      this.prisma.db.transferRequest.count({ where }),
    ]);

    return {
      items: await Promise.all(
        items.map(async (t) => ({
          ...t,
          needsReview: t.status === TransferStatus.DADAN_REVIEW,
          piece: {
            ...t.piece,
            design: {
              ...t.piece.design,
              imageUrls: await this.storage.resolvePublicUrls(t.piece.design.imageUrls),
            },
          },
        })),
      ),
      total,
      page: p,
      limit: l,
    };
  }

  async getAdminTransfer(id: string) {
    // Select only safe client fields; never expose the houseKey bcrypt hash.
    const safeClientSelect = {
      id: true,
      displayName: true,
      email: true,
      phone: true,
      houseKeyPrefix: true,
      isActive: true,
    };
    const transfer = await this.prisma.db.transferRequest.findUnique({
      where: { id },
      include: {
        piece: { include: { design: true } },
        fromClient: { select: safeClientSelect },
        toClient: { select: safeClientSelect },
      },
    });
    if (!transfer) throw new NotFoundException("errors.TRANSFER_NOT_FOUND");
    return transfer;
  }

  async approve(
    adminId: string,
    id: string,
    notes?: string,
    ipAddress?: string,
  ) {
    const transfer = await this.prisma.db.transferRequest.findUnique({
      where: { id },
    });
    if (!transfer) throw new NotFoundException("errors.TRANSFER_NOT_FOUND");
    if (transfer.status !== TransferStatus.DADAN_REVIEW) {
      throw new BadRequestException("Transfer is not awaiting review");
    }

    await this.prisma.db.$transaction(
      async (tx) => {
        // CR-04: Lock both transfer and piece rows for atomic approval
        const [lockedTransfer] = await tx.$queryRaw<
          Array<{
            id: string;
            status: string;
            pieceId: string;
            fromClientId: string;
            toClientId: string;
            transferType: string;
          }>
        >`
          SELECT id, status, "pieceId", "fromClientId", "toClientId", "transferType"
          FROM "TransferRequest"
          WHERE id = ${id}::uuid
          FOR UPDATE
        `;

        if (!lockedTransfer) {
          throw new NotFoundException("errors.TRANSFER_NOT_FOUND");
        }

        if (lockedTransfer.status !== TransferStatus.DADAN_REVIEW) {
          throw new ConflictException("Transfer is no longer awaiting review");
        }

        // Lock the piece and verify the sender is still the current owner
        const [lockedPiece] = await tx.$queryRaw<
          Array<{ id: string; currentOwnerId: string | null; status: string }>
        >`
          SELECT id, "currentOwnerId", status
          FROM "Piece"
          WHERE id = ${transfer.pieceId}::uuid
          FOR UPDATE
        `;

        if (!lockedPiece) {
          throw new NotFoundException("errors.PIECE_NOT_FOUND");
        }

        // CR-04: Verify sender is still the current owner before approval
        if (lockedPiece.currentOwnerId !== transfer.fromClientId) {
          throw new ConflictException(
            "Ownership has changed since transfer was initiated",
          );
        }

        await tx.transferRequest.update({
          where: { id },
          data: {
            status: TransferStatus.APPROVED,
            dadanReviewedAt: new Date(),
            dadanReviewedBy: adminId,
            dadanNotes: notes,
            completedAt: new Date(),
          },
        });

        await tx.piece.update({
          where: { id: transfer.pieceId },
          data: {
            currentOwnerId: transfer.toClientId,
            status: PieceStatus.OWNED,
          },
        });

        await tx.ownershipRecord.updateMany({
          where: {
            pieceId: transfer.pieceId,
            clientId: transfer.fromClientId,
            transferredAt: null,
          },
          data: { transferredAt: new Date() },
        });

        await tx.ownershipRecord.create({
          data: {
            pieceId: transfer.pieceId,
            clientId: transfer.toClientId,
            acquisitionType: this.transferTypeToAcquisition(transfer.transferType),
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    this.certificateQueue.add(
      "regenerate-certificate",
      {
        pieceId: transfer.pieceId,
        clientId: transfer.toClientId,
        transferId: id,
        regenerate: true,
        adminId,
      },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    ).catch((err) => {
      this.logger.error(
        `Failed to enqueue cert regeneration for piece ${transfer.pieceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "TRANSFER_APPROVED",
      targetType: "TransferRequest",
      targetId: id,
      metadata: { notes },
      ipAddress,
    });

    const [sender, recipient] = await Promise.all([
      this.prisma.db.client.findUnique({ where: { id: transfer.fromClientId } }),
      this.prisma.db.client.findUnique({ where: { id: transfer.toClientId } }),
    ]);
    if (sender) {
      this.notifications.sendTransferApprovedEmail(sender.email, {
        transferId: id,
        locale: sender.locale,
      });
    }
    if (recipient) {
      this.notifications.sendTransferApprovedEmail(recipient.email, {
        transferId: id,
        locale: recipient.locale,
      });
    }

    return this.getAdminTransfer(id);
  }

  async reject(
    adminId: string,
    id: string,
    reason: string,
    ipAddress?: string,
  ) {
    const transfer = await this.prisma.db.transferRequest.findUnique({
      where: { id },
    });
    if (!transfer) throw new NotFoundException("errors.TRANSFER_NOT_FOUND");
    if (transfer.status !== TransferStatus.DADAN_REVIEW) {
      throw new BadRequestException("Transfer is not awaiting review");
    }

    await this.prisma.db.$transaction(
      async (tx) => {
        // Lock transfer and piece for atomic rejection
        const [lockedTransfer] = await tx.$queryRaw<
          Array<{ id: string; status: string; pieceId: string }>
        >`
          SELECT id, status, "pieceId"
          FROM "TransferRequest"
          WHERE id = ${id}::uuid
          FOR UPDATE
        `;

        if (!lockedTransfer || lockedTransfer.status !== TransferStatus.DADAN_REVIEW) {
          throw new ConflictException("Transfer is no longer awaiting review");
        }

        await tx.$queryRaw`
          SELECT id FROM "Piece"
          WHERE id = ${transfer.pieceId}::uuid
          FOR UPDATE
        `;

        await tx.transferRequest.update({
          where: { id },
          data: {
            status: TransferStatus.REJECTED,
            dadanReviewedAt: new Date(),
            dadanReviewedBy: adminId,
            dadanNotes: reason,
            completedAt: new Date(),
          },
        });

        await tx.piece.update({
          where: { id: transfer.pieceId },
          data: { status: PieceStatus.OWNED },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "TRANSFER_REJECTED",
      targetType: "TransferRequest",
      targetId: id,
      metadata: { reason },
      ipAddress,
    });

    const [sender, recipient] = await Promise.all([
      this.prisma.db.client.findUnique({ where: { id: transfer.fromClientId } }),
      this.prisma.db.client.findUnique({ where: { id: transfer.toClientId } }),
    ]);
    if (sender) {
      this.notifications.sendTransferRejectedEmail(sender.email, {
        transferId: id,
        reason,
        locale: sender.locale,
      });
    }
    if (recipient) {
      this.notifications.sendTransferRejectedEmail(recipient.email, {
        transferId: id,
        reason,
        locale: recipient.locale,
      });
    }

    return this.getAdminTransfer(id);
  }

  async logContact(
    adminId: string,
    id: string,
    party: "sender" | "recipient",
    ipAddress?: string,
  ) {
    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: party === "sender" ? "TRANSFER_CONTACT_SENDER" : "TRANSFER_CONTACT_RECIPIENT",
      targetType: "TransferRequest",
      targetId: id,
      ipAddress,
    });
    return { success: true };
  }

  private assertTransition(from: TransferStatus, to: TransferStatus) {
    if (!canTransitionTransfer(from, to)) {
      throw new BadRequestException(`Invalid transfer transition from ${from} to ${to}`);
    }
  }

  private async getTransferForSender(transferId: string, clientId: string) {
    const transfer = await this.prisma.db.transferRequest.findFirst({
      where: { id: transferId, fromClientId: clientId },
    });
    if (!transfer) throw new NotFoundException("errors.TRANSFER_NOT_FOUND");
    return transfer;
  }

  private async getTransferForRecipient(transferId: string, clientId: string) {
    const transfer = await this.prisma.db.transferRequest.findFirst({
      where: { id: transferId, toClientId: clientId },
    });
    if (!transfer) throw new NotFoundException("errors.TRANSFER_NOT_FOUND");
    return transfer;
  }

  private transferTypeToAcquisition(type: TransferType): AcquisitionType {
    switch (type) {
      case TransferType.SALE:
        return AcquisitionType.PURCHASE;
      case TransferType.GIFT:
        return AcquisitionType.GIFT;
      case TransferType.INHERITANCE:
        return AcquisitionType.INHERITANCE;
    }
  }
}
