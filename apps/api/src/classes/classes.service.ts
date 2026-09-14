import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActorType } from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/\s+/g, "-");
}

const CLASS_SELECT = {
  id: true,
  name: true,
  nameAr: true,
  slug: true,
  description: true,
  sortOrder: true,
  isDefault: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const items = await this.prisma.db.class.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        ...CLASS_SELECT,
        _count: { select: { clients: true, collections: true } },
      },
    });

    return items.map(({ _count, ...row }) => ({
      ...row,
      clientCount: _count.clients,
      collectionCount: _count.collections,
    }));
  }

  async getById(id: string) {
    const row = await this.prisma.db.class.findUnique({
      where: { id },
      select: {
        ...CLASS_SELECT,
        _count: { select: { clients: true, collections: true } },
      },
    });
    if (!row) throw new NotFoundException("errors.CLASS_NOT_FOUND");

    const { _count, ...cls } = row;
    return {
      ...cls,
      clientCount: _count.clients,
      collectionCount: _count.collections,
    };
  }

  async getDefaultId(): Promise<string> {
    const fallback = await this.prisma.db.class.findFirst({
      where: { isDefault: true, isActive: true },
      select: { id: true },
    });
    if (!fallback) {
      throw new BadRequestException("errors.CLASS_DEFAULT_MISSING");
    }
    return fallback.id;
  }

  async create(
    adminId: string,
    data: {
      name: string;
      nameAr?: string;
      slug: string;
      description?: string;
      sortOrder?: number;
      isDefault?: boolean;
      isActive?: boolean;
    },
    ipAddress?: string,
  ) {
    const slug = normalizeSlug(data.slug);
    const created = await this.prisma.db.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.class.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.class.create({
        data: {
          name: data.name,
          nameAr: data.nameAr,
          slug,
          description: data.description,
          sortOrder: data.sortOrder ?? 0,
          isDefault: data.isDefault ?? false,
          isActive: data.isActive ?? true,
        },
        select: CLASS_SELECT,
      });
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "CLASS_CREATED",
      targetType: "Class",
      targetId: created.id,
      ipAddress,
    });

    return created;
  }

  async update(
    adminId: string,
    id: string,
    data: {
      name?: string;
      nameAr?: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
      isDefault?: boolean;
      isActive?: boolean;
    },
    ipAddress?: string,
  ) {
    const existing = await this.prisma.db.class.findUnique({
      where: { id },
      select: { id: true, isDefault: true },
    });
    if (!existing) throw new NotFoundException("errors.CLASS_NOT_FOUND");

    if (existing.isDefault && data.isDefault === false) {
      throw new BadRequestException("errors.CLASS_DEFAULT_REQUIRED");
    }

    const updated = await this.prisma.db.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.class.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.class.update({
        where: { id },
        data: {
          ...data,
          ...(data.slug ? { slug: normalizeSlug(data.slug) } : {}),
        },
        select: CLASS_SELECT,
      });
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "CLASS_UPDATED",
      targetType: "Class",
      targetId: id,
      ipAddress,
    });

    return updated;
  }

  async delete(adminId: string, id: string, ipAddress?: string) {
    const existing = await this.prisma.db.class.findUnique({
      where: { id },
      select: {
        id: true,
        isDefault: true,
        _count: { select: { clients: true } },
      },
    });
    if (!existing) throw new NotFoundException("errors.CLASS_NOT_FOUND");
    if (existing.isDefault) {
      throw new BadRequestException("errors.CLASS_DEFAULT_CANNOT_DELETE");
    }
    if (existing._count.clients > 0) {
      throw new ConflictException("errors.CLASS_HAS_CLIENTS");
    }

    const updated = await this.prisma.db.class.update({
      where: { id },
      data: { isActive: false },
      select: CLASS_SELECT,
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "CLASS_SOFT_DELETED",
      targetType: "Class",
      targetId: id,
      ipAddress,
    });

    return updated;
  }
}
