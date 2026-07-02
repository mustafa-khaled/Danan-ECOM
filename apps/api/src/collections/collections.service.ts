import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActorType } from "@dadan/db";
import { randomUUID } from "node:crypto";
import { designImageKey, extFromMime } from "@dadan/storage";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { VisibilityService } from "../visibility/visibility.service";
import { paginationParams } from "../common/constants";

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  async getVisibleCollections(clientGroups: string[]) {
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
            name: c.name,
            slug: c.slug,
            description: c.description,
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
      throw new NotFoundException("Collection not found");
    }

    const visibleDesigns = collection.designs.filter((d) =>
      this.visibility.canAccess(clientGroups, d.visibilityGroups),
    );

    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const paginated = visibleDesigns.slice(skip, skip + take);

    return {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      coverImageUrl: await this.storage.resolvePublicUrl(collection.coverImageUrl),
      designs: await Promise.all(
        paginated.map(async (d) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          material: d.material,
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

  async getDesignBySlug(slug: string, clientGroups: string[]) {
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
      throw new NotFoundException("Design not found");
    }

    return {
      id: design.id,
      name: design.name,
      slug: design.slug,
      story: design.story,
      material: design.material,
      weight: design.weight,
      dimensions: design.dimensions,
      imageUrls: await this.storage.resolvePublicUrls(design.imageUrls),
      basePrice: design.basePrice,
      currency: design.currency,
      collection: {
        id: design.collection.id,
        name: design.collection.name,
        slug: design.collection.slug,
      },
      specifications: design.specifications,
      availablePieces: design.pieces.map((p) => ({
        id: p.id,
        serialNumber: p.serialNumber,
        status: p.status,
      })),
    };
  }

  async createCollection(
    adminId: string,
    data: {
      name: string;
      slug: string;
      description?: string;
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
      slug: string;
      collectionId: string;
      story: string;
      material: string;
      weight: number;
      dimensions: string;
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
    if (!design) throw new NotFoundException("Design not found");

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
    specs: { key: string; value: string; sortOrder?: number }[],
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
            data: { value: spec.value, sortOrder: spec.sortOrder ?? existing.sortOrder },
          });
        } else {
          await tx.designSpecification.create({
            data: {
              designId,
              key: spec.key,
              value: spec.value,
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
