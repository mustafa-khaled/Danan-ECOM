import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  AcquisitionType,
  ActorType,
  PieceStatus,
  TransferStatus,
  TransferType,
} from "@dadan/db";
import type { Locale } from "@dadan/types";
import { canTransitionTransfer, maskDisplayName } from "@dadan/utils";
import { localizePiece, pickLocalized } from "../common/i18n/localize";
import { AuditService } from "../audit/audit.service";
import { CertificateOutboxService } from "../certificates/certificate-outbox.service";
import { ClientsService } from "../clients/clients.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { StorageService } from "../storage/storage.service";
import {
  paginationParams,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
} from "../common/constants";
import { runSerializable } from "../common/db/serializable";

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
    private readonly audit: AuditService,
    private readonly outbox: CertificateOutboxService,
    private readonly notifications: NotificationsService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  async initiate(
    clientId: string,
    data: {
      pieceId: string;
      transferType: TransferType;
      recipientHouseId: string;
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
    });
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");

    // Find recipient by their shareable house ID (NOT the login credential)
    const recipient = await this.clients.findClientByHouseId(data.recipientHouseId);
    if (!recipient) {
      throw new NotFoundException("errors.RECIPIENT_NOT_FOUND");
    }
    if (!recipient.isActive) {
      throw new BadRequestException("errors.RECIPIENT_INACTIVE");
    }
    if (recipient.id === clientId) {
      throw new BadRequestException("errors.CANNOT_TRANSFER_TO_SELF");
    }

    const transfer = await runSerializable(
      this.prisma.db,
      async (tx) => {
        // CR-03: Lock the piece row to prevent concurrent transfer initiation
        const [lockedPiece] = await tx.$queryRaw<
          Array<{ id: string; status: string; currentOwnerId: string | null }>
        >`
          SELECT id, status, "currentOwnerId"
          FROM "Piece"
          WHERE id = ${data.pieceId}::text
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
            piece: true,
            toClient: { select: { displayName: true, email: true } },
          },
        });
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
          transfer.piece.name,
          transfer.piece.nameAr,
        ),
        image: await this.storage.resolvePublicUrl(transfer.piece.mainImageUrl),
      },
      recipientDisplayName: maskDisplayName(transfer.toClient.displayName),
    };
  }

  async confirmSender(transferId: string, clientId: string, ipAddress?: string) {
    const updated = await runSerializable(
      this.prisma.db,
      async (tx) => {
        await tx.$queryRaw`
          SELECT id FROM "TransferRequest"
          WHERE id = ${transferId}::text
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
    const updated = await runSerializable(
      this.prisma.db,
      async (tx) => {
        await tx.$queryRaw`
          SELECT id FROM "TransferRequest"
          WHERE id = ${transferId}::text
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

    const updated = await runSerializable(
      this.prisma.db,
      async (tx) => {
        // Lock transfer and piece for atomic cancellation
        const [lockedTransfer] = await tx.$queryRaw<
          Array<{ id: string; status: string; pieceId: string }>
        >`
          SELECT id, status, "pieceId"
          FROM "TransferRequest"
          WHERE id = ${transferId}::text
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
          WHERE id = ${transfer.pieceId}::text
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

  async listClientTransfers(
    clientId: string,
    locale: Locale = "ar",
    status?: TransferStatus,
  ) {
    // L-05: Limit result set to prevent unbounded response sizes
    const transfers = await this.prisma.db.transferRequest.findMany({
      where: {
        OR: [{ fromClientId: clientId }, { toClientId: clientId }],
        ...(status ? { status } : {}),
      },
      include: {
        piece: {
          select: { id: true, serialNumber: true, name: true, nameAr: true },
        },
        fromClient: { select: { displayName: true } },
        toClient: { select: { displayName: true } },
      },
      orderBy: { initiatedAt: "desc" },
      take: 100,
    });

    return transfers.map((t) => ({
      id: t.id,
      status: t.status,
      transferType: t.transferType,
      initiatedAt: t.initiatedAt,
      piece: {
        id: t.piece.id,
        serialNumber: t.piece.serialNumber,
        name: pickLocalized(locale, t.piece.name, t.piece.nameAr),
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
        piece: true,
        fromClient: { select: { displayName: true } },
        toClient: { select: { displayName: true } },
      },
    });
    if (!transfer) throw new NotFoundException("errors.TRANSFER_NOT_FOUND");

    return {
      id: transfer.id,
      status: transfer.status,
      transferType: transfer.transferType,
      initiatedAt: transfer.initiatedAt,
      senderConfirmedAt: transfer.senderConfirmedAt,
      recipientConfirmedAt: transfer.recipientConfirmedAt,
      fromClientId: transfer.fromClientId,
      toClientId: transfer.toClientId,
      piece: {
        ...localizePiece(transfer.piece, locale),
        mainImageUrl: await this.storage.resolvePublicUrl(transfer.piece.mainImageUrl),
        mainImageLqip: transfer.piece.mainImageLqip ?? null,
        imageUrls: await this.storage.resolvePublicUrls(transfer.piece.imageUrls),
      },
      fromClient: { displayName: transfer.fromClient.displayName },
      toClient: { displayName: transfer.toClient.displayName },
    };
  }

  async listAdminTransfers(
    page?: number,
    limit?: number,
    filters?: {
      status?: TransferStatus;
      pieceId?: string;
      fromClientId?: string;
      q?: string;
    },
  ) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const q = filters?.q?.trim();
    const where = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.pieceId ? { pieceId: filters.pieceId } : {}),
      ...(filters?.fromClientId ? { fromClientId: filters.fromClientId } : {}),
      ...(q
        ? {
            OR: [
              { piece: { name: { contains: q, mode: "insensitive" as const } } },
              { piece: { serialNumber: { contains: q.toUpperCase() } } },
              { fromClient: { displayName: { contains: q, mode: "insensitive" as const } } },
              { toClient: { displayName: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.db.transferRequest.findMany({
        where,
        skip,
        take,
        orderBy: { initiatedAt: "desc" },
        select: {
          id: true,
          status: true,
          transferType: true,
          initiatedAt: true,
          piece: {
            select: { id: true, name: true, nameAr: true, serialNumber: true, mainImageUrl: true },
          },
          fromClient: { select: { id: true, displayName: true, email: true } },
          toClient: { select: { id: true, displayName: true, email: true } },
        },
      }),
      this.prisma.db.transferRequest.count({ where }),
    ]);

    const urlMap = await this.storage.resolvePublicUrlsBatch(
      items.map((t) => t.piece.mainImageUrl).filter(Boolean) as string[],
    );

    return {
      items: items.map((t) => ({
        ...t,
        needsReview: t.status === TransferStatus.DADAN_REVIEW,
        piece: {
          ...t.piece,
          mainImageUrl: t.piece.mainImageUrl
            ? (urlMap.get(t.piece.mainImageUrl) ?? null)
            : null,
        },
      })),
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
        piece: true,
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

    await runSerializable(
      this.prisma.db,
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
          WHERE id = ${id}::text
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
          WHERE id = ${transfer.pieceId}::text
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

        await tx.savedPiece.deleteMany({
          where: { pieceId: transfer.pieceId },
        });

        // The outgoing certificate names the sender as owner, so it must stop
        // being authoritative the moment ownership moves. Leaving that to the
        // regeneration job opened a window — unbounded if the job was lost — in
        // which the piece belonged to the recipient while a valid certificate
        // still attested that the sender owned it.
        await tx.certificate.updateMany({
          where: { pieceId: transfer.pieceId, isActive: true },
          data: { isActive: false },
        });

        // Recorded in this transaction so the recipient's certificate cannot be
        // lost to a Redis outage in the gap between commit and enqueue.
        await this.outbox.record(tx, {
          pieceId: transfer.pieceId,
          clientId: transfer.toClientId,
          transferId: id,
          regenerate: true,
          adminId,
        });
      },
    );

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

    await runSerializable(
      this.prisma.db,
      async (tx) => {
        // Lock transfer and piece for atomic rejection
        const [lockedTransfer] = await tx.$queryRaw<
          Array<{ id: string; status: string; pieceId: string }>
        >`
          SELECT id, status, "pieceId"
          FROM "TransferRequest"
          WHERE id = ${id}::text
          FOR UPDATE
        `;

        if (!lockedTransfer || lockedTransfer.status !== TransferStatus.DADAN_REVIEW) {
          throw new ConflictException("Transfer is no longer awaiting review");
        }

        await tx.$queryRaw`
          SELECT id FROM "Piece"
          WHERE id = ${transfer.pieceId}::text
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
