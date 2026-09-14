import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActorType } from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { ClassesService } from "../classes/classes.service";
import { PrismaService } from "../prisma/prisma.service";
import { paginationParams } from "../common/constants";

const CLASS_SELECT = { id: true, slug: true, name: true, nameAr: true } as const;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
    private readonly classes: ClassesService,
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
      result += chars.charAt(Math.floor(Math.random() * chars.length));
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
    let classIds = filters?.classId ? [filters.classId] : undefined;

    if (filters?.collectionId) {
      const rows = await this.prisma.db.collectionClass.findMany({
        where: { collectionId: filters.collectionId },
        select: { classId: true },
      });
      const accessClassIds = rows.map((row) => row.classId);
      classIds = classIds
        ? classIds.filter((id) => accessClassIds.includes(id))
        : accessClassIds;
      if (classIds.length === 0) {
        return { items: [], total: 0, page: p, limit: l };
      }
    }

    const where = {
      ...(classIds ? { classId: { in: classIds } } : {}),
      ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(q
        ? {
            OR: [
              { displayName: { startsWith: q, mode: "insensitive" as const } },
              { email: { startsWith: q.toLowerCase() } },
              { houseId: { startsWith: q.toUpperCase() } },
              { houseKeyPrefix: { startsWith: q } },
            ],
          }
        : {}),
    };

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
          createdAt: true,
          lastSeenAt: true,
          class: { select: CLASS_SELECT },
          _count: { select: { ownedPieces: true } },
        },
      }),
      this.prisma.db.client.count({ where }),
    ]);

    return {
      items: items.map(({ _count, ...c }) => ({
        ...c,
        pieceCount: _count.ownedPieces,
      })),
      total,
      page: p,
      limit: l,
    };
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
            serialNumber: true,
            status: true,
            imageUrls: true,
            collection: { select: { id: true, name: true } },
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
            piece: { select: { id: true, name: true, serialNumber: true } },
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
            piece: { select: { id: true, name: true, serialNumber: true } },
            fromClient: { select: { displayName: true } },
          },
        },
      },
    });
    if (!client) throw new NotFoundException("errors.CLIENT_NOT_FOUND");

    const { _count, ownedPieces, ...rest } = client;
    return {
      ...rest,
      pieceCount: _count.ownedPieces,
      ownedPieces: ownedPieces.map((piece) => ({
        ...piece,
        imageUrls: piece.imageUrls.slice(0, 1),
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

    const client = await this.prisma.db.client.update({
      where: { id },
      data: updateData,
      include: { class: { select: CLASS_SELECT } },
    });

    if (data.isActive === false) {
      await this.auth.revokeAllClientSessions(id);
    }

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "CLIENT_UPDATED",
      targetType: "Client",
      targetId: id,
      metadata: data,
      ipAddress,
    });

    return this.stripHouseKey(client);
  }

  async rotateKey(adminId: string, id: string, ipAddress?: string) {
    const client = await this.prisma.db.client.findUnique({ where: { id } });
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
