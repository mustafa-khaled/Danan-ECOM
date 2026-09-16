import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AdminRole,
  ActorType,
  Prisma,
  StaffRequestStatus,
  StaffRequestType,
  TransferStatus,
} from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { ClientsService } from "../clients/clients.service";
import { paginationParams } from "../common/constants";
import { PrismaService } from "../prisma/prisma.service";

type OperationType =
  | "ACCESS_REQUEST"
  | "PIECE_TRANSFER"
  | "MEMBERSHIP_UPGRADE"
  | "KEY_ISSUANCE";
type OperationStatus = "PENDING" | "COMPLETED" | "UNDER_REVIEW" | "REJECTED";

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
    private readonly audit: AuditService,
  ) {}

  async list(
    page?: number,
    limit?: number,
    filters?: { q?: string; type?: OperationType; status?: OperationStatus },
  ) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);

    // The list is a union of two tables ordered by date, so the requested window
    // can only contain rows from the first `skip + take` of each source. Fetching
    // exactly that instead of a fixed 200-row cap keeps deep pages correct.
    const window = skip + take;
    const includeTransfers =
      !filters?.type || filters.type === "PIECE_TRANSFER";
    const includeStaff = filters?.type !== "PIECE_TRANSFER";

    const [transfers, staff, transferTotal, staffTotal] = await Promise.all([
      includeTransfers ? this.loadTransfers(filters, window) : [],
      includeStaff ? this.loadStaff(filters, window) : [],
      includeTransfers ? this.countTransfers(filters) : 0,
      includeStaff ? this.countStaff(filters) : 0,
    ]);

    const items = [...transfers, ...staff]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(skip, window);

    return { items, total: transferTotal + staffTotal, page: p, limit: l };
  }

  async stats() {
    const [pendingStaff, pendingTransfers, access, completedStaff, completedTransfers] =
      await Promise.all([
        this.prisma.db.staffRequest.count({
          where: { status: { in: [StaffRequestStatus.PENDING, StaffRequestStatus.UNDER_REVIEW] } },
        }),
        this.prisma.db.transferRequest.count({
          where: {
            status: {
              in: [
                TransferStatus.INITIATED,
                TransferStatus.SENDER_CONFIRMED,
                TransferStatus.RECIPIENT_CONFIRMED,
                TransferStatus.DADAN_REVIEW,
              ],
            },
          },
        }),
        this.prisma.db.staffRequest.count({
          where: { type: StaffRequestType.ACCESS_REQUEST },
        }),
        this.prisma.db.staffRequest.count({
          where: { status: StaffRequestStatus.COMPLETED },
        }),
        this.prisma.db.transferRequest.count({
          where: { status: TransferStatus.APPROVED },
        }),
      ]);

    return {
      pending: pendingStaff + pendingTransfers,
      transfers: pendingTransfers,
      access,
      completed: completedStaff + completedTransfers,
    };
  }

  async getOne(id: string, kind?: "transfer" | "staff") {
    if (kind !== "staff") {
      const transfer = await this.prisma.db.transferRequest.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          transferType: true,
          initiatedAt: true,
          dadanNotes: true,
          piece: {
            select: {
              id: true,
              name: true,
              serialNumber: true,
              currentOwnerId: true,
            },
          },
          fromClient: {
            select: { id: true, displayName: true, email: true, isActive: true },
          },
          toClient: {
            select: { id: true, displayName: true, email: true, isActive: true },
          },
          senderConfirmedAt: true,
          recipientConfirmedAt: true,
        },
      });
      if (transfer) {
        return { kind: "transfer" as const, ...transfer };
      }
      if (kind === "transfer") throw new NotFoundException("errors.TRANSFER_NOT_FOUND");
    }

    const request = await this.prisma.db.staffRequest.findUnique({
      where: { id },
      select: {
        id: true,
        requestNumber: true,
        type: true,
        status: true,
        notes: true,
        reviewNotes: true,
        createdAt: true,
        targetClassId: true,
        client: { select: { id: true, displayName: true, email: true, classId: true } },
        collection: { select: { id: true, name: true, nameAr: true } },
      },
    });
    if (!request) throw new NotFoundException("errors.STAFF_REQUEST_NOT_FOUND");
    return { kind: "staff" as const, ...request };
  }

  async create(adminId: string, data: {
    type: StaffRequestType;
    clientId: string;
    targetClassId?: string;
    collectionId?: string;
    notes?: string;
  }, ipAddress?: string) {
    const client = await this.prisma.db.client.findUnique({
      where: { id: data.clientId },
      select: { id: true },
    });
    if (!client) throw new NotFoundException("errors.CLIENT_NOT_FOUND");

    // The counter row is locked by the allocation until this transaction commits,
    // so two concurrent creates get consecutive numbers. Deriving the sequence
    // from `COUNT(*)` instead gave them both the same number, and one lost to the
    // unique index on `requestNumber`.
    const created = await this.prisma.db.$transaction(async (tx) => {
      const year = new Date().getUTCFullYear();
      const rows = await tx.$queryRaw<Array<{ lastSequence: number }>>`
        INSERT INTO "SerialCounter" ("scope", "lastSequence", "updatedAt")
        VALUES (${`staff-request:${year}`}::text, 1, now())
        ON CONFLICT ("scope") DO UPDATE
          SET "lastSequence" = "SerialCounter"."lastSequence" + 1,
              "updatedAt" = now()
        RETURNING "lastSequence"
      `;

      const sequence = rows[0]?.lastSequence;
      if (sequence === undefined) {
        throw new Error("Request number allocation returned no row");
      }

      return tx.staffRequest.create({
        data: {
          requestNumber: `REQ-${year}-${String(sequence).padStart(3, "0")}`,
          type: data.type,
          clientId: data.clientId,
          targetClassId: data.targetClassId,
          collectionId: data.collectionId,
          notes: data.notes,
        },
      });
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "STAFF_REQUEST_CREATED",
      targetType: "StaffRequest",
      targetId: created.id,
      ipAddress,
    });

    return created;
  }

  async approve(
    adminId: string,
    id: string,
    notes?: string,
    ipAddress?: string,
    role?: AdminRole,
  ) {
    const request = await this.prisma.db.staffRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException("errors.STAFF_REQUEST_NOT_FOUND");
    if (
      request.status === StaffRequestStatus.COMPLETED ||
      request.status === StaffRequestStatus.REJECTED
    ) {
      throw new BadRequestException("errors.STAFF_REQUEST_NOT_ACTIONABLE");
    }
    if (request.type === StaffRequestType.KEY_ISSUANCE && role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException("Insufficient permissions");
    }

    let houseKey: string | undefined;

    await this.prisma.db.$transaction(async (tx) => {
      if (request.type === StaffRequestType.MEMBERSHIP_UPGRADE && request.targetClassId) {
        await tx.client.update({
          where: { id: request.clientId },
          data: { classId: request.targetClassId },
        });
      }

      if (request.type === StaffRequestType.ACCESS_REQUEST && request.collectionId) {
        const client = await tx.client.findUnique({
          where: { id: request.clientId },
          select: { classId: true },
        });
        if (client) {
          await tx.collectionClass.upsert({
            where: {
              collectionId_classId: {
                collectionId: request.collectionId,
                classId: client.classId,
              },
            },
            create: {
              collectionId: request.collectionId,
              classId: client.classId,
            },
            update: {},
          });
        }
      }

      await tx.staffRequest.update({
        where: { id },
        data: {
          status: StaffRequestStatus.COMPLETED,
          reviewNotes: notes,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
    });

    if (request.type === StaffRequestType.KEY_ISSUANCE) {
      const rotated = await this.clients.rotateKey(adminId, request.clientId, ipAddress);
      houseKey = rotated.houseKey;
    }

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "STAFF_REQUEST_APPROVED",
      targetType: "StaffRequest",
      targetId: id,
      ipAddress,
    });

    return { success: true, houseKey };
  }

  async reject(adminId: string, id: string, notes?: string, ipAddress?: string) {
    const request = await this.prisma.db.staffRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException("errors.STAFF_REQUEST_NOT_FOUND");
    if (
      request.status === StaffRequestStatus.COMPLETED ||
      request.status === StaffRequestStatus.REJECTED
    ) {
      throw new BadRequestException("errors.STAFF_REQUEST_NOT_ACTIONABLE");
    }

    const updated = await this.prisma.db.staffRequest.update({
      where: { id },
      data: {
        status: StaffRequestStatus.REJECTED,
        reviewNotes: notes,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "STAFF_REQUEST_REJECTED",
      targetType: "StaffRequest",
      targetId: id,
      ipAddress,
    });

    return updated;
  }

  private transferStatusFilter(status?: OperationStatus) {
    if (!status) return undefined;
    if (status === "PENDING") {
      return { in: [TransferStatus.INITIATED] as TransferStatus[] };
    }
    if (status === "UNDER_REVIEW") {
      return {
        in: [
          TransferStatus.SENDER_CONFIRMED,
          TransferStatus.RECIPIENT_CONFIRMED,
          TransferStatus.DADAN_REVIEW,
        ] as TransferStatus[],
      };
    }
    if (status === "COMPLETED") {
      return { in: [TransferStatus.APPROVED, TransferStatus.CANCELLED] as TransferStatus[] };
    }
    return TransferStatus.REJECTED;
  }

  private staffStatusFilter(status?: OperationStatus) {
    if (!status) return undefined;
    return status as StaffRequestStatus;
  }

  /** Shared by `loadTransfers` and `countTransfers` so the two cannot drift apart. */
  private transferWhere(filters?: {
    q?: string;
    status?: OperationStatus;
  }): Prisma.TransferRequestWhereInput {
    const q = filters?.q?.trim();
    const status = this.transferStatusFilter(filters?.status);
    return {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { piece: { name: { contains: q, mode: "insensitive" as const } } },
              { piece: { nameAr: { contains: q, mode: "insensitive" as const } } },
              { fromClient: { displayName: { contains: q, mode: "insensitive" as const } } },
              { toClient: { displayName: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };
  }

  /** Shared by `loadStaff` and `countStaff` so the two cannot drift apart. */
  private staffWhere(filters?: {
    q?: string;
    type?: OperationType;
    status?: OperationStatus;
  }): Prisma.StaffRequestWhereInput {
    const q = filters?.q?.trim();
    const status = this.staffStatusFilter(filters?.status);
    return {
      ...(filters?.type && filters.type !== "PIECE_TRANSFER"
        ? { type: filters.type as StaffRequestType }
        : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { requestNumber: { contains: q, mode: "insensitive" as const } },
              { client: { displayName: { contains: q, mode: "insensitive" as const } } },
              { client: { email: { contains: q.toLowerCase() } } },
            ],
          }
        : {}),
    };
  }

  private async loadTransfers(
    filters: { q?: string; status?: OperationStatus } | undefined,
    take: number,
  ) {
    const items = await this.prisma.db.transferRequest.findMany({
      where: this.transferWhere(filters),
      orderBy: { initiatedAt: "desc" },
      take,
      select: {
        id: true,
        status: true,
        initiatedAt: true,
        piece: { select: { name: true, nameAr: true } },
        fromClient: { select: { displayName: true, email: true } },
      },
    });

    return items.map((item) => ({
      id: item.id,
      kind: "transfer" as const,
      requestNumber: `TRF-${item.id.slice(0, 8).toUpperCase()}`,
      title: `${item.piece.name} Transfer`,
      type: "PIECE_TRANSFER" as const,
      transferType: "INCOMING" as const,
      memberName: item.fromClient.displayName,
      memberEmail: item.fromClient.email,
      date: item.initiatedAt.toISOString(),
      status: this.mapTransferStatus(item.status),
      pieceName: item.piece.name,
      pieceNameAr: item.piece.nameAr,
    }));
  }

  private async loadStaff(
    filters:
      | { q?: string; type?: OperationType; status?: OperationStatus }
      | undefined,
    take: number,
  ) {
    const items = await this.prisma.db.staffRequest.findMany({
      where: this.staffWhere(filters),
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        requestNumber: true,
        type: true,
        status: true,
        createdAt: true,
        client: { select: { displayName: true, email: true } },
        collection: { select: { name: true, nameAr: true } },
      },
    });

    return items.map((item) => ({
      id: item.id,
      kind: "staff" as const,
      requestNumber: item.requestNumber,
      title: item.type.replace(/_/g, " "),
      type: item.type as OperationType,
      transferType: "INTERNAL" as const,
      memberName: item.client.displayName,
      memberEmail: item.client.email,
      date: item.createdAt.toISOString(),
      status: item.status as OperationStatus,
      pieceName: item.collection?.name,
      pieceNameAr: item.collection?.nameAr,
    }));
  }

  private countTransfers(filters?: { q?: string; status?: OperationStatus }) {
    return this.prisma.db.transferRequest.count({
      where: this.transferWhere(filters),
    });
  }

  private countStaff(filters?: {
    q?: string;
    type?: OperationType;
    status?: OperationStatus;
  }) {
    return this.prisma.db.staffRequest.count({
      where: this.staffWhere(filters),
    });
  }

  private mapTransferStatus(status: TransferStatus): OperationStatus {
    if (status === TransferStatus.REJECTED) return "REJECTED";
    if (status === TransferStatus.APPROVED || status === TransferStatus.CANCELLED) {
      return "COMPLETED";
    }
    if (status === TransferStatus.INITIATED) return "PENDING";
    return "UNDER_REVIEW";
  }
}
