import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActorType } from "@dadan/db";
import type { Locale } from "@dadan/types";
import { randomUUID } from "node:crypto";
import { designImageKey, extFromMime } from "@dadan/storage";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { VisibilityService } from "../visibility/visibility.service";
import { paginationParams } from "../common/constants";
import {
  localizeSpecifications,
  pickLocalized,
} from "../common/i18n/localize";

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  async getVisibleCollections(clientGroups: string[], locale: Locale = "ar") {
    const collections = await this.prisma.db.collection.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      include: {
        designs: {
          where: { isActive: true },
          include: { pieces: true },
        },
      },
    });

    return Promise.all(
      collections
        .filter((c) => this.visibility.canAccess(clientGroups, c.visibilityGroups))
        .map(async (c) => {
          const visibleDesigns = c.designs.filter((d) =>
            this.visibility.canAccess(clientGroups, d.visibilityGroups),
          );
          const pieceCount = visibleDesigns.reduce(
            (sum, d) =>
              sum +
              d.pieces.filter((_p) =>
                this.visibility.canAccess(clientGroups, d.visibilityGroups),
              ).length,
            0,
          );
          return {
            id: c.id,
            name: pickLocalized(locale, c.name, c.nameAr),
            slug: c.slug,
            description: pickLocalized(locale, c.description, c.descriptionAr),
            coverImageUrl: await this.storage.resolvePublicUrl(c.coverImageUrl),
            sortOrder: c.sortOrder,
            pieceCount,
          };
        }),
    );
  }

  async getCollectionBySlug(
    slug: string,
    clientGroups: string[],
    page?: number,
    limit?: number,
    locale: Locale = "ar",
  ) {
    const collection = await this.prisma.db.collection.findUnique({
      where: { slug },
      include: {
        designs: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (
      !collection ||
      !collection.isVisible ||
      !this.visibility.canAccess(clientGroups, collection.visibilityGroups)
    ) {
      throw new NotFoundException("errors.COLLECTION_NOT_FOUND");
    }

    const visibleDesigns = collection.designs.filter((d) =>
      this.visibility.canAccess(clientGroups, d.visibilityGroups),
    );

    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const paginated = visibleDesigns.slice(skip, skip + take);

    return {
      id: collection.id,
      name: pickLocalized(locale, collection.name, collection.nameAr),
      slug: collection.slug,
      description: pickLocalized(
        locale,
        collection.description,
        collection.descriptionAr,
      ),
      coverImageUrl: await this.storage.resolvePublicUrl(collection.coverImageUrl),
      designs: await Promise.all(
        paginated.map(async (d) => ({
          id: d.id,
          name: pickLocalized(locale, d.name, d.nameAr),
          slug: d.slug,
          material: pickLocalized(locale, d.material, d.materialAr),
          basePrice: d.basePrice,
          currency: d.currency,
          imageUrls: await this.storage.resolvePublicUrls(d.imageUrls),
        })),
      ),
      total: visibleDesigns.length,
      page: p,
      limit: l,
    };
  }

  async getDesignBySlug(
    slug: string,
    clientGroups: string[],
    locale: Locale = "ar",
  ) {
    const design = await this.prisma.db.design.findUnique({
      where: { slug },
      include: {
        collection: true,
        specifications: { orderBy: { sortOrder: "asc" } },
        pieces: { where: { status: "AVAILABLE" } },
      },
    });

    if (
      !design ||
      !design.isActive ||
      !design.collection.isVisible ||
      !this.visibility.canAccess(clientGroups, design.visibilityGroups) ||
      !this.visibility.canAccess(clientGroups, design.collection.visibilityGroups)
    ) {
      throw new NotFoundException("errors.DESIGN_NOT_FOUND");
    }

    return {
      id: design.id,
      name: pickLocalized(locale, design.name, design.nameAr),
      slug: design.slug,
      story: pickLocalized(locale, design.story, design.storyAr),
      material: pickLocalized(locale, design.material, design.materialAr),
      weight: design.weight,
      dimensions: pickLocalized(locale, design.dimensions, design.dimensionsAr),
      imageUrls: await this.storage.resolvePublicUrls(design.imageUrls),
      basePrice: design.basePrice,
      currency: design.currency,
      collection: {
        id: design.collection.id,
        name: pickLocalized(
          locale,
          design.collection.name,
          design.collection.nameAr,
        ),
        slug: design.collection.slug,
      },
      specifications: localizeSpecifications(design.specifications, locale),
      availablePieces: design.pieces.map((p) => ({
        id: p.id,
        serialNumber: p.serialNumber,
        status: p.status,
      })),
    };
  }

  async listCollectionsAdmin(page?: number, limit?: number) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.db.collection.findMany({
        skip,
        take,
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { designs: true } } },
      }),
      this.prisma.db.collection.count(),
    ]);

    return {
      items: await Promise.all(
        items.map(async ({ _count, ...c }) => ({
          ...c,
          coverImageUrl: await this.storage.resolvePublicUrl(c.coverImageUrl),
          designCount: _count.designs,
        })),
      ),
      total,
      page: p,
      limit: l,
    };
  }

  async getCollectionAdmin(id: string) {
    const collection = await this.prisma.db.collection.findUnique({
      where: { id },
      include: {
        designs: {
          orderBy: { name: "asc" },
          include: { _count: { select: { pieces: true } } },
        },
      },
    });
    if (!collection) throw new NotFoundException("errors.COLLECTION_NOT_FOUND");

    return {
      ...collection,
      coverImageUrl: await this.storage.resolvePublicUrl(collection.coverImageUrl),
      designs: await Promise.all(
        collection.designs.map(async ({ _count, ...d }) => ({
          ...d,
          imageUrls: await this.storage.resolvePublicUrls(d.imageUrls),
          pieceCount: _count.pieces,
        })),
      ),
    };
  }

  async listDesignsAdmin(page?: number, limit?: number, collectionId?: string) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const where = collectionId ? { collectionId } : {};
    const [items, total] = await Promise.all([
      this.prisma.db.design.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: {
          collection: { select: { id: true, name: true, nameAr: true, slug: true } },
          _count: { select: { pieces: true } },
        },
      }),
      this.prisma.db.design.count({ where }),
    ]);

    return {
      items: await Promise.all(
        items.map(async ({ _count, ...d }) => ({
          ...d,
          imageUrls: await this.storage.resolvePublicUrls(d.imageUrls),
          pieceCount: _count.pieces,
        })),
      ),
      total,
      page: p,
      limit: l,
    };
  }

  async getDesignAdmin(id: string) {
    const design = await this.prisma.db.design.findUnique({
      where: { id },
      include: {
        collection: true,
        specifications: { orderBy: { sortOrder: "asc" } },
        pieces: {
          orderBy: { createdAt: "desc" },
          include: { currentOwner: { select: { id: true, displayName: true } } },
        },
      },
    });
    if (!design) throw new NotFoundException("errors.DESIGN_NOT_FOUND");

    return {
      ...design,
      imageUrls: await this.storage.resolvePublicUrls(design.imageUrls),
    };
  }

  async createCollection(
    adminId: string,
    data: {
      name: string;
      nameAr: string;
      slug: string;
      description?: string;
      descriptionAr?: string;
      coverImageUrl?: string;
      isVisible?: boolean;
      sortOrder?: number;
      visibilityGroups?: string[];
    },
    ipAddress?: string,
  ) {
    const collection = await this.prisma.db.collection.create({
      data: {
        ...data,
        visibilityGroups: data.visibilityGroups
          ? this.visibility.normalizeGroups(data.visibilityGroups)
          : [],
      },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "COLLECTION_CREATED",
      targetType: "Collection",
      targetId: collection.id,
      ipAddress,
    });

    return collection;
  }

  async updateCollection(
    adminId: string,
    id: string,
    data: Record<string, unknown>,
    ipAddress?: string,
  ) {
    const updateData = {
      ...data,
      ...(Array.isArray(data.visibilityGroups)
        ? { visibilityGroups: this.visibility.normalizeGroups(data.visibilityGroups as string[]) }
        : {}),
    };

    const collection = await this.prisma.db.collection.update({
      where: { id },
      data: updateData,
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "COLLECTION_UPDATED",
      targetType: "Collection",
      targetId: id,
      ipAddress,
    });

    return collection;
  }

  async deleteCollection(adminId: string, id: string, ipAddress?: string) {
    const collection = await this.prisma.db.collection.update({
      where: { id },
      data: { isVisible: false },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "COLLECTION_SOFT_DELETED",
      targetType: "Collection",
      targetId: id,
      ipAddress,
    });

    return collection;
  }

  async createDesign(
    adminId: string,
    data: {
      name: string;
      nameAr: string;
      slug: string;
      collectionId: string;
      story: string;
      storyAr: string;
      material: string;
      materialAr?: string;
      weight: number;
      dimensions: string;
      dimensionsAr?: string;
      basePrice: number;
      currency?: string;
      visibilityGroups?: string[];
    },
    ipAddress?: string,
  ) {
    const design = await this.prisma.db.design.create({
      data: {
        ...data,
        weight: data.weight,
        basePrice: data.basePrice,
        currency: data.currency ?? "SAR",
        imageUrls: [],
        visibilityGroups: data.visibilityGroups
          ? this.visibility.normalizeGroups(data.visibilityGroups)
          : [],
      },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "DESIGN_CREATED",
      targetType: "Design",
      targetId: design.id,
      ipAddress,
    });

    return design;
  }

  async updateDesign(
    adminId: string,
    id: string,
    data: Record<string, unknown>,
    ipAddress?: string,
  ) {
    const updateData = {
      ...data,
      ...(Array.isArray(data.visibilityGroups)
        ? { visibilityGroups: this.visibility.normalizeGroups(data.visibilityGroups as string[]) }
        : {}),
    };

    const design = await this.prisma.db.design.update({
      where: { id },
      data: updateData,
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "DESIGN_UPDATED",
      targetType: "Design",
      targetId: id,
      ipAddress,
    });

    return design;
  }

  async deleteDesign(adminId: string, id: string, ipAddress?: string) {
    const design = await this.prisma.db.design.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "DESIGN_SOFT_DELETED",
      targetType: "Design",
      targetId: id,
      ipAddress,
    });

    return design;
  }

  async uploadDesignImage(
    adminId: string,
    designId: string,
    buffer: Buffer,
    contentType: string,
    ipAddress?: string,
  ) {
    const design = await this.prisma.db.design.findUnique({ where: { id: designId } });
    if (!design) throw new NotFoundException("errors.DESIGN_NOT_FOUND");

    const fileId = randomUUID();
    const ext = extFromMime(contentType);
    const key = designImageKey(designId, fileId, ext);
    await this.storage.upload(key, buffer, { contentType });

    const updated = await this.prisma.db.design.update({
      where: { id: designId },
      data: { imageUrls: { push: key } },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "DESIGN_IMAGE_UPLOADED",
      targetType: "Design",
      targetId: designId,
      metadata: { key },
      ipAddress,
    });

    return updated;
  }

  async upsertSpecifications(
    adminId: string,
    designId: string,
    specs: {
      key: string;
      keyAr?: string;
      value: string;
      valueAr?: string;
      sortOrder?: number;
    }[],
    ipAddress?: string,
  ) {
    await this.prisma.db.$transaction(async (tx) => {
      for (const spec of specs) {
        const existing = await tx.designSpecification.findFirst({
          where: { designId, key: spec.key },
        });
        if (existing) {
          await tx.designSpecification.update({
            where: { id: existing.id },
            data: {
              value: spec.value,
              keyAr: spec.keyAr ?? existing.keyAr,
              valueAr: spec.valueAr ?? existing.valueAr,
              sortOrder: spec.sortOrder ?? existing.sortOrder,
            },
          });
        } else {
          await tx.designSpecification.create({
            data: {
              designId,
              key: spec.key,
              keyAr: spec.keyAr,
              value: spec.value,
              valueAr: spec.valueAr,
              sortOrder: spec.sortOrder ?? 0,
            },
          });
        }
      }
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "DESIGN_SPECS_UPDATED",
      targetType: "Design",
      targetId: designId,
      ipAddress,
    });

    return this.prisma.db.designSpecification.findMany({
      where: { designId },
      orderBy: { sortOrder: "asc" },
    });
  }
}
