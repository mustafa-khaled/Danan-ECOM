import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActorType } from "@dadan/db";
import { normalizeVisibilityGroup } from "@dadan/utils";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { VisibilityService } from "../visibility/visibility.service";
import { paginationParams } from "../common/constants";

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
    private readonly visibility: VisibilityService,
  ) {}

  /** Never let the bcrypt House Key hash leave the API. */
  private stripHouseKey<T extends { houseKey: string }>(client: T): Omit<T, "houseKey"> {
    const { houseKey, ...safe } = client;
    void houseKey;
    return safe;
  }

  async getProfile(clientId: string) {
    const client = await this.prisma.db.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        locale: true,
        visibilityGroups: true,
        createdAt: true,
      },
    });
    if (!client) throw new NotFoundException("Client not found");
    return client;
  }

  async updateProfile(clientId: string, data: { phone?: string; locale?: string }) {
    return this.prisma.db.client.update({
      where: { id: clientId },
      data,
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        locale: true,
        visibilityGroups: true,
        createdAt: true,
      },
    });
  }

  async listClients(page?: number, limit?: number) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.db.client.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          displayName: true,
          email: true,
          houseKeyPrefix: true,
          isActive: true,
          visibilityGroups: true,
          _count: { select: { ownedPieces: true } },
        },
      }),
      this.prisma.db.client.count(),
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

  async createClient(
    adminId: string,
    data: {
      displayName: string;
      email: string;
      phone?: string;
      locale?: string;
      visibilityGroups?: string[];
    },
    ipAddress?: string,
  ) {
    const plainKey = this.auth.generateHouseKey();
    const hashed = await this.auth.hashHouseKey(plainKey);
    const groups = data.visibilityGroups
      ? this.visibility.normalizeGroups(data.visibilityGroups)
      : [];

    const client = await this.prisma.db.client.create({
      data: {
        houseKey: hashed,
        houseKeyPrefix: plainKey.slice(0, 4),
        displayName: data.displayName,
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        locale: data.locale ?? "ar",
        visibilityGroups: groups,
      },
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
      include: {
        ownedPieces: {
          include: {
            design: { include: { collection: true } },
          },
        },
        sentTransfers: {
          include: { piece: true, toClient: { select: { displayName: true } } },
          orderBy: { initiatedAt: "desc" },
        },
        receivedTransfers: {
          include: { piece: true, fromClient: { select: { displayName: true } } },
          orderBy: { initiatedAt: "desc" },
        },
      },
    });
    if (!client) throw new NotFoundException("Client not found");

    return this.stripHouseKey(client);
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
      visibilityGroups?: string[];
    },
    ipAddress?: string,
  ) {
    const updateData = {
      ...data,
      ...(data.email ? { email: data.email.toLowerCase().trim() } : {}),
      ...(data.visibilityGroups
        ? { visibilityGroups: this.visibility.normalizeGroups(data.visibilityGroups) }
        : {}),
    };

    const client = await this.prisma.db.client.update({
      where: { id },
      data: updateData,
    });

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

  async updateVisibilityGroups(
    adminId: string,
    id: string,
    add?: string[],
    remove?: string[],
    ipAddress?: string,
  ) {
    const client = await this.prisma.db.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException("Client not found");

    const groups = new Set(client.visibilityGroups.map(normalizeVisibilityGroup));
    add?.forEach((g) => groups.add(normalizeVisibilityGroup(g)));
    remove?.forEach((g) => groups.delete(normalizeVisibilityGroup(g)));

    const updated = await this.prisma.db.client.update({
      where: { id },
      data: { visibilityGroups: [...groups] },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "CLIENT_VISIBILITY_UPDATED",
      targetType: "Client",
      targetId: id,
      metadata: { add, remove },
      ipAddress,
    });

    return this.stripHouseKey(updated);
  }

  async rotateKey(adminId: string, id: string, ipAddress?: string) {
    const client = await this.prisma.db.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException("Client not found");

    const plainKey = this.auth.generateHouseKey();
    const hashed = await this.auth.hashHouseKey(plainKey);

    await this.prisma.db.client.update({
      where: { id },
      data: {
        houseKey: hashed,
        houseKeyPrefix: plainKey.slice(0, 4),
      },
    });

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
