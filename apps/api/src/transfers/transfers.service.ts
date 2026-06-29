import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  AcquisitionType,
  ActorType,
  PieceStatus,
  TransferStatus,
  TransferType,
} from "@dadan/db";
import { canTransitionTransfer, maskDisplayName } from "@dadan/utils";
import { AuthService } from "../auth/auth.service";
import { AuditService } from "../audit/audit.service";
import { CertificatesService } from "../certificates/certificates.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { paginationParams } from "../common/constants";
import { AUTH_FAILURE_MESSAGE } from "../common/constants";

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly certificates: CertificatesService,
    private readonly notifications: NotificationsService,
  ) {}

  async initiate(
    clientId: string,
    data: {
      pieceId: string;
      transferType: TransferType;
      recipientHouseKey: string;
    },
    ipAddress?: string,
  ) {
    const piece = await this.prisma.db.piece.findFirst({
      where: { id: data.pieceId, currentOwnerId: clientId },
      include: { design: true },
    });
    if (!piece) throw new NotFoundException("Piece not found");
    if (piece.status === PieceStatus.TRANSFER_PENDING) {
      throw new BadRequestException("Transfer already in progress");
    }

    const activeTransfer = await this.prisma.db.transferRequest.findFirst({
      where: {
        pieceId: data.pieceId,
        status: { notIn: ["APPROVED", "REJECTED", "CANCELLED"] },
      },
    });
    if (activeTransfer) {
      throw new BadRequestException("An active transfer already exists");
    }

    const recipient = await this.auth.findClientByHouseKey(
      data.recipientHouseKey,
      clientId,
    );
    if (!recipient) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const transfer = await this.prisma.db.$transaction(async (tx) => {
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
    });

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
      });
    }

    return {
      transferId: transfer.id,
      status: transfer.status,
      piece: {
        id: transfer.piece.id,
        serialNumber: transfer.piece.serialNumber,
        name: transfer.piece.design.name,
        image: transfer.piece.design.imageUrls[0] ?? null,
      },
      recipientDisplayName: maskDisplayName(transfer.toClient.displayName),
    };
  }

  async confirmSender(transferId: string, clientId: string, ipAddress?: string) {
    const transfer = await this.getTransferForSender(transferId, clientId);
    this.assertTransition(transfer.status, TransferStatus.SENDER_CONFIRMED);

    const updated = await this.prisma.db.transferRequest.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.SENDER_CONFIRMED,
        senderConfirmedAt: new Date(),
      },
      include: { toClient: { select: { email: true } } },
    });

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
    });

    return updated;
  }

  async confirmRecipient(transferId: string, clientId: string, ipAddress?: string) {
    const transfer = await this.getTransferForRecipient(transferId, clientId);
    this.assertTransition(transfer.status, TransferStatus.RECIPIENT_CONFIRMED);

    const updated = await this.prisma.db.transferRequest.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.DADAN_REVIEW,
        recipientConfirmedAt: new Date(),
      },
    });

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
      throw new BadRequestException("Transfer cannot be cancelled at this stage");
    }

    const updated = await this.prisma.db.$transaction(async (tx) => {
      await tx.piece.update({
        where: { id: transfer.pieceId },
        data: { status: PieceStatus.OWNED },
      });

      return tx.transferRequest.update({
        where: { id: transferId },
        data: { status: TransferStatus.CANCELLED },
      });
    });

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
      this.notifications.sendTransferCancelledEmail(sender.email, { transferId });
    }

    return updated;
  }

  async listClientTransfers(clientId: string) {
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
        name: t.piece.design.name,
      },
      otherPartyDisplayName: maskDisplayName(
        t.fromClientId === clientId
          ? t.toClient.displayName
          : t.fromClient.displayName,
      ),
    }));
  }

  async getClientTransfer(transferId: string, clientId: string) {
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
    if (!transfer) throw new NotFoundException("Transfer not found");
    return transfer;
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
      items: items.map((t) => ({
        ...t,
        needsReview: t.status === TransferStatus.DADAN_REVIEW,
      })),
      total,
      page: p,
      limit: l,
    };
  }

  async getAdminTransfer(id: string) {
    const transfer = await this.prisma.db.transferRequest.findUnique({
      where: { id },
      include: {
        piece: { include: { design: true } },
        fromClient: true,
        toClient: true,
      },
    });
    if (!transfer) throw new NotFoundException("Transfer not found");
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
    if (!transfer) throw new NotFoundException("Transfer not found");
    if (transfer.status !== TransferStatus.DADAN_REVIEW) {
      throw new BadRequestException("Transfer is not awaiting review");
    }

    await this.prisma.db.$transaction(async (tx) => {
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
    });

    void this.certificates.regenerateCertificate(
      transfer.pieceId,
      transfer.toClientId,
      adminId,
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
      this.notifications.sendTransferApprovedEmail(sender.email, { transferId: id });
    }
    if (recipient) {
      this.notifications.sendTransferApprovedEmail(recipient.email, { transferId: id });
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
    if (!transfer) throw new NotFoundException("Transfer not found");

    await this.prisma.db.$transaction(async (tx) => {
      await tx.transferRequest.update({
        where: { id },
        data: {
          status: TransferStatus.REJECTED,
          dadanReviewedAt: new Date(),
          dadanReviewedBy: adminId,
          dadanNotes: reason,
        },
      });

      await tx.piece.update({
        where: { id: transfer.pieceId },
        data: { status: PieceStatus.OWNED },
      });
    });

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
      this.notifications.sendTransferRejectedEmail(sender.email, { transferId: id, reason });
    }
    if (recipient) {
      this.notifications.sendTransferRejectedEmail(recipient.email, { transferId: id, reason });
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
    if (!transfer) throw new NotFoundException("Transfer not found");
    return transfer;
  }

  private async getTransferForRecipient(transferId: string, clientId: string) {
    const transfer = await this.prisma.db.transferRequest.findFirst({
      where: { id: transferId, toClientId: clientId },
    });
    if (!transfer) throw new NotFoundException("Transfer not found");
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
