import { randomInt } from "node:crypto";
import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ActorType,
  Prisma,
  StaffRequestStatus,
  StaffRequestType,
} from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { ClassesService } from "../classes/classes.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { paginationParams } from "../common/constants";
import { CollectionAccessSyncService } from "../collections/collection-access-sync.service";

const CLASS_SELECT = { id: true, slug: true, name: true, nameAr: true } as const;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
    private readonly classes: ClassesService,
    private readonly storage: StorageService,
    private readonly accessSync: CollectionAccessSyncService,
  ) {}

  /** Never let the bcrypt House Key hash leave the API. */
  private stripHouseKey<T extends { houseKey: string }>(client: T): Omit<T, "houseKey"> {
    const { houseKey, ...safe } = client;
    void houseKey;
    return safe;
  }

  /**
   * Generate a 6-character alphanumeric house ID for sharing in transfers.
   * Excludes confusing characters: 0, O, 1, I, L
   */
  generateHouseId(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      // M-10: Use crypto-secure RNG instead of Math.random()
      result += chars.charAt(randomInt(chars.length));
    }
    return result;
  }

  /**
   * Generate a unique house ID, retrying if collision occurs.
   */
  private async generateUniqueHouseId(): Promise<string> {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const houseId = this.generateHouseId();
      const existing = await this.prisma.db.client.findUnique({
        where: { houseId },
        select: { id: true },
      });
      if (!existing) {
        return houseId;
      }
    }
    throw new Error("Failed to generate unique house ID after maximum attempts");
  }

  async getProfile(clientId: string) {
    const client = await this.prisma.db.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        houseId: true,
        displayName: true,
        email: true,
        phone: true,
        locale: true,
        class: { select: CLASS_SELECT },
        createdAt: true,
      },
    });
    if (!client) throw new NotFoundException("errors.CLIENT_NOT_FOUND");
    return client;
  }

  /**
   * Get profile summary with aggregated counts for dashboard display.
   * Single optimized query instead of multiple frontend fetches.
   */
  async getProfileSummary(clientId: string) {
    const client = await this.prisma.db.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        houseId: true,
        displayName: true,
        createdAt: true,
        _count: {
          select: {
            ownedPieces: true,
            certificates: true,
          },
        },
      },
    });
    if (!client) throw new NotFoundException("errors.CLIENT_NOT_FOUND");

    const pendingTransfersCount = await this.prisma.db.transferRequest.count({
      where: {
        OR: [
          { fromClientId: clientId },
          { toClientId: clientId },
        ],
        status: {
          notIn: ["APPROVED", "REJECTED", "CANCELLED"],
        },
      },
    });

    return {
      id: client.id,
      houseId: client.houseId,
      displayName: client.displayName,
      memberSince: client.createdAt,
      ownedPiecesCount: client._count.ownedPieces,
      certificatesCount: client._count.certificates,
      pendingTransfersCount,
    };
  }

  async updateProfile(clientId: string, data: { phone?: string; locale?: string }) {
    return this.prisma.db.client.update({
      where: { id: clientId },
      data,
      select: {
        id: true,
        houseId: true,
        displayName: true,
        email: true,
        phone: true,
        locale: true,
        class: { select: CLASS_SELECT },
        createdAt: true,
      },
    });
  }

  async listClients(
    page?: number,
    limit?: number,
    filters?: {
      q?: string;
      classId?: string;
      collectionId?: string;
      isActive?: boolean;
    },
  ) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const q = filters?.q?.trim();
    const collectionId = filters?.collectionId;

    // Each filter is an independent condition so none can overwrite another's
    // `OR` — the collection scope and the search both need one.
    const conditions: Prisma.ClientWhereInput[] = [];
    let accessClassIds: string[] = [];

    if (filters?.classId) {
      conditions.push({ classId: filters.classId });
    }

    if (collectionId) {
      const rows = await this.prisma.db.collectionClass.findMany({
        where: { collectionId },
        select: { classId: true },
      });
      accessClassIds = rows.map((row) => row.classId);

      // Scoped to a collection the caller wants the access roster: members whose
      // class already has access, plus members still waiting on a request.
      // Without the second group the Access column could only ever say "granted".
      conditions.push({
        OR: [
          ...(accessClassIds.length > 0
            ? [{ classId: { in: accessClassIds } }]
            : []),
          { staffRequests: { some: this.openAccessRequestWhere(collectionId) } },
        ],
      });
    }

    if (filters?.isActive !== undefined) {
      conditions.push({ isActive: filters.isActive });
    }

    if (q) {
      conditions.push({
        OR: [
          { displayName: { startsWith: q, mode: "insensitive" as const } },
          { email: { startsWith: q.toLowerCase() } },
          { houseId: { startsWith: q.toUpperCase() } },
          { houseKeyPrefix: { startsWith: q } },
        ],
      });
    }

    const where: Prisma.ClientWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const [items, total] = await Promise.all([
      this.prisma.db.client.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          houseId: true,
          displayName: true,
          email: true,
          phone: true,
          houseKeyPrefix: true,
          isActive: true,
          classId: true,
          createdAt: true,
          lastSeenAt: true,
          class: { select: CLASS_SELECT },
          _count: { select: { ownedPieces: true } },
        },
      }),
      this.prisma.db.client.count({ where }),
    ]);

    const pendingClientIds = collectionId
      ? await this.findPendingAccessClientIds(
          collectionId,
          items.map((client) => client.id),
        )
      : new Set<string>();

    return {
      // H-08: Mask houseKeyPrefix in API responses — it's only needed internally
      items: items.map(
        ({ _count, houseKeyPrefix: _houseKeyPrefix, classId, ...c }) => ({
          ...c,
          houseKeyPrefix: "****",
          pieceCount: _count.ownedPieces,
          ...(collectionId
            ? {
                accessStatus: this.resolveAccessStatus({
                  isActive: c.isActive,
                  hasClassAccess: accessClassIds.includes(classId),
                  hasPendingRequest: pendingClientIds.has(c.id),
                }),
              }
            : {}),
        }),
      ),
      total,
      page: p,
      limit: l,
    };
  }

  private openAccessRequestWhere(
    collectionId: string,
  ): Prisma.StaffRequestWhereInput {
    return {
      collectionId,
      type: StaffRequestType.ACCESS_REQUEST,
      status: {
        in: [StaffRequestStatus.PENDING, StaffRequestStatus.UNDER_REVIEW],
      },
    };
  }

  /** One query for the whole page — never per row. */
  private async findPendingAccessClientIds(
    collectionId: string,
    clientIds: string[],
  ): Promise<Set<string>> {
    if (clientIds.length === 0) return new Set();
    const rows = await this.prisma.db.staffRequest.findMany({
      where: {
        ...this.openAccessRequestWhere(collectionId),
        clientId: { in: clientIds },
      },
      select: { clientId: true },
    });
    return new Set(rows.map((row) => row.clientId));
  }

  /**
   * A live class grant always wins: once the class can see the collection the
   * member has access, so a stale request must not present as pending.
   */
  private resolveAccessStatus(state: {
    isActive: boolean;
    hasClassAccess: boolean;
    hasPendingRequest: boolean;
  }): "GRANTED" | "PENDING" | "REVOKED" {
    if (state.hasClassAccess) return state.isActive ? "GRANTED" : "REVOKED";
    if (state.hasPendingRequest) return "PENDING";
    return "REVOKED";
  }

  async getClientStats() {
    const [total, byClass] = await Promise.all([
      this.prisma.db.client.count(),
      this.prisma.db.client.groupBy({
        by: ["classId"],
        _count: { _all: true },
      }),
    ]);
    const classes = await this.prisma.db.class.findMany({
      where: { id: { in: byClass.map((row) => row.classId) } },
      select: { id: true, name: true, slug: true },
    });
    const classMap = new Map(classes.map((cls) => [cls.id, cls]));

    return {
      total,
      byClass: byClass.map((row) => ({
        classId: row.classId,
        name: classMap.get(row.classId)?.name ?? row.classId,
        slug: classMap.get(row.classId)?.slug ?? null,
        count: row._count._all,
      })),
    };
  }

  async createClient(
    adminId: string,
    data: {
      displayName: string;
      email: string;
      phone?: string;
      locale?: string;
      classId?: string;
    },
    ipAddress?: string,
  ) {
    const plainKey = this.auth.generateHouseKey();
    const hashed = await this.auth.hashHouseKey(plainKey);
    const houseId = await this.generateUniqueHouseId();
    const classId = data.classId ?? (await this.classes.getDefaultId());

    const client = await this.prisma.db.client.create({
      data: {
        houseId,
        houseKey: hashed,
        houseKeyPrefix: plainKey.slice(0, 4),
        displayName: data.displayName,
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        locale: data.locale ?? "ar",
        classId,
      },
      include: { class: { select: CLASS_SELECT } },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "CLIENT_CREATED",
      targetType: "Client",
      targetId: client.id,
      ipAddress,
    });

    return { client: this.stripHouseKey(client), houseKey: plainKey };
  }

  async getClientById(id: string) {
    const client = await this.prisma.db.client.findUnique({
      where: { id },
      select: {
        id: true,
        houseId: true,
        displayName: true,
        email: true,
        phone: true,
        locale: true,
        houseKeyPrefix: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
        class: { select: CLASS_SELECT },
        ownedPieces: {
          take: 20,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            nameAr: true,
            serialNumber: true,
            status: true,
            mainImageUrl: true,
            collection: { select: { id: true, name: true, nameAr: true } },
          },
        },
        _count: { select: { ownedPieces: true } },
        sentTransfers: {
          take: 10,
          orderBy: { initiatedAt: "desc" },
          select: {
            id: true,
            status: true,
            initiatedAt: true,
            piece: { select: { id: true, name: true, nameAr: true, serialNumber: true } },
            toClient: { select: { displayName: true } },
          },
        },
        receivedTransfers: {
          take: 10,
          orderBy: { initiatedAt: "desc" },
          select: {
            id: true,
            status: true,
            initiatedAt: true,
            piece: { select: { id: true, name: true, nameAr: true, serialNumber: true } },
            fromClient: { select: { displayName: true } },
          },
        },
      },
    });
    if (!client) throw new NotFoundException("errors.CLIENT_NOT_FOUND");

    // H-08: Mask houseKeyPrefix in API responses
    const { _count, ownedPieces, houseKeyPrefix: _houseKeyPrefix, ...rest } = client;

    const urlMap = await this.storage.resolvePublicUrlsBatch(
      ownedPieces.map((piece) => piece.mainImageUrl),
    );

    return {
      ...rest,
      houseKeyPrefix: "****",
      pieceCount: _count.ownedPieces,
      ownedPieces: ownedPieces.map((piece) => ({
        ...piece,
        mainImageUrl: piece.mainImageUrl
          ? (urlMap.get(piece.mainImageUrl) ?? null)
          : null,
      })),
    };
  }

  /**
   * Find a client by their shareable house ID (used for transfers).
   * Returns only the necessary fields for transfer recipient identification.
   */
  async findClientByHouseId(houseId: string) {
    const client = await this.prisma.db.client.findUnique({
      where: { houseId: houseId.toUpperCase() },
      select: {
        id: true,
        houseId: true,
        displayName: true,
        isActive: true,
      },
    });
    return client;
  }

  async updateClient(
    adminId: string,
    id: string,
    data: {
      displayName?: string;
      email?: string;
      phone?: string;
      locale?: string;
      isActive?: boolean;
      classId?: string;
    },
    ipAddress?: string,
  ) {
    const updateData = {
      ...data,
      ...(data.email ? { email: data.email.toLowerCase().trim() } : {}),
    };

    const client = await this.prisma.db.$transaction(async (tx) => {
      const updated = await tx.client.update({
        where: { id },
        data: updateData,
        include: { class: { select: CLASS_SELECT } },
      });

      // Moving a member into a class that already has access must close their
      // open access requests for those collections.
      if (data.classId) {
        await this.accessSync.syncForClientClass(tx, id, data.classId, adminId);
      }

      return updated;
    });

    // H-02: Revoke sessions when classId changes so JWT reflects the new class
    if (data.isActive === false || data.classId) {
      await this.auth.revokeAllClientSessions(id);
    }

    // L-01: Only audit specific fields, never the full DTO
    const { displayName, email, phone, locale, isActive, classId } = data;
    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "CLIENT_UPDATED",
      targetType: "Client",
      targetId: id,
      metadata: { displayName, email, phone, locale, isActive, classId },
      ipAddress,
    });

    return this.stripHouseKey(client);
  }

  async rotateKey(adminId: string, id: string, ipAddress?: string) {
    // Existence check only — never load the hash we are about to replace.
    const client = await this.prisma.db.client.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!client) throw new NotFoundException("errors.CLIENT_NOT_FOUND");

    const plainKey = this.auth.generateHouseKey();
    const hashed = await this.auth.hashHouseKey(plainKey);

    await this.prisma.db.client.update({
      where: { id },
      data: {
        houseKey: hashed,
        houseKeyPrefix: plainKey.slice(0, 4),
      },
    });

    await this.auth.revokeAllClientSessions(id);

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "HOUSE_KEY_ROTATED",
      targetType: "Client",
      targetId: id,
      ipAddress,
    });

    return { houseKey: plainKey };
  }
}
