import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { randomUUID } from "node:crypto";
import { ActorType, PieceStatus, Prisma } from "@dadan/db";
import {
  collectionCoverKey,
  collectionStoryImageKey,
  extFromMime,
} from "@dadan/storage";
import type { Locale } from "@dadan/types";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { ImageProcessingService } from "../storage/image-processing.service";
import { VisibilityService } from "../visibility/visibility.service";
import { MAX_CATALOG_ROWS, paginationParams } from "../common/constants";
import { localizeSpecifications, pickLocalized } from "../common/i18n/localize";

const PIECE_FILE_RETENTION_DAYS = 30;

const CLASS_SELECT = {
  id: true,
  name: true,
  nameAr: true,
  slug: true,
} as const;

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly imageProcessing: ImageProcessingService,
  ) {}

  async getVisibleCollections(classId: string, locale: Locale = "ar") {
    const collections = await this.prisma.db.collection.findMany({
      where: this.visibility.prismaFilter(classId),
      orderBy: { sortOrder: "asc" },
      take: MAX_CATALOG_ROWS,
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        description: true,
        descriptionAr: true,
        coverImageUrl: true,
        coverImageLqip: true,
        sortOrder: true,
        _count: {
          select: {
            pieces: {
              where: {
                isActive: true,
                status: PieceStatus.AVAILABLE,
                currentOwnerId: null,
              },
            },
          },
        },
      },
    });

    return Promise.all(
      collections.map(async (c) => ({
        id: c.id,
        name: pickLocalized(locale, c.name, c.nameAr),
        slug: c.slug,
        description: pickLocalized(locale, c.description, c.descriptionAr),
        coverImageUrl: await this.storage.resolvePublicUrl(c.coverImageUrl),
        coverImageLqip: c.coverImageLqip ?? null,
        sortOrder: c.sortOrder,
        pieceCount: c._count.pieces,
      })),
    );
  }

  async getCollectionBySlug(
    slug: string,
    classId: string,
    page?: number,
    limit?: number,
    locale: Locale = "ar",
  ) {
    const collection = await this.prisma.db.collection.findUnique({
      where: { slug },
      include: { classes: { select: { classId: true } } },
    });

    if (!collection || !this.visibility.canAccessCollection(classId, collection)) {
      throw new NotFoundException("errors.COLLECTION_NOT_FOUND");
    }

    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const pieceWhere = {
      collectionId: collection.id,
      isActive: true,
      status: PieceStatus.AVAILABLE,
      currentOwnerId: null,
    };
    void this.prisma.db.collection.update({
      where: { id: collection.id },
      data: { viewCount: { increment: 1 } },
    });

    const [paginated, total] = await Promise.all([
      this.prisma.db.piece.findMany({
        where: pieceWhere,
        orderBy: { name: "asc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          nameAr: true,
          slug: true,
          serialNumber: true,
          status: true,
          material: true,
          materialAr: true,
          price: true,
          currency: true,
          imageUrls: true,
          imageLqips: true,
        },
      }),
      this.prisma.db.piece.count({ where: pieceWhere }),
    ]);

    const urlMap = await this.storage.resolvePublicUrlsBatch(
      paginated.flatMap((piece) => piece.imageUrls),
    );

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
      coverImageLqip: collection.coverImageLqip ?? null,
      pieces: paginated.map((piece) => ({
        id: piece.id,
        name: pickLocalized(locale, piece.name, piece.nameAr),
        slug: piece.slug,
        serialNumber: piece.serialNumber,
        status: piece.status,
        material: pickLocalized(locale, piece.material, piece.materialAr),
        price: piece.price,
        currency: piece.currency,
        imageUrls: piece.imageUrls
          .map((key) => urlMap.get(key))
          .filter((url): url is string => !!url),
        imageLqips: piece.imageLqips ?? [],
      })),
      total,
      page: p,
      limit: l,
    };
  }

  async getPieceBySlug(
    slug: string,
    classId: string,
    locale: Locale = "ar",
    clientId?: string,
  ) {
    const piece = await this.prisma.db.piece.findUnique({
      where: { slug },
      include: {
        collection: { include: { classes: { select: { classId: true } } } },
        specifications: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!piece || !this.visibility.canAccessPiece(classId, piece)) {
      throw new NotFoundException("errors.PIECE_NOT_FOUND");
    }

    let isSaved = false;
    if (clientId) {
      const saved = await this.prisma.db.savedPiece.findUnique({
        where: { clientId_pieceId: { clientId, pieceId: piece.id } },
        select: { pieceId: true },
      });
      isSaved = Boolean(saved);
    }

    return {
      id: piece.id,
      name: pickLocalized(locale, piece.name, piece.nameAr),
      slug: piece.slug,
      serialNumber: piece.serialNumber,
      status: piece.status,
      story: pickLocalized(locale, piece.story, piece.storyAr),
      material: pickLocalized(locale, piece.material, piece.materialAr),
      weight: piece.weight,
      dimensions: pickLocalized(locale, piece.dimensions, piece.dimensionsAr),
      imageUrls: await this.storage.resolvePublicUrls(piece.imageUrls),
      imageLqips: piece.imageLqips ?? [],
      price: piece.price,
      currency: piece.currency,
      isSaved,
      collection: {
        id: piece.collection.id,
        name: pickLocalized(
          locale,
          piece.collection.name,
          piece.collection.nameAr,
        ),
        slug: piece.collection.slug,
      },
      specifications: localizeSpecifications(piece.specifications, locale),
    };
  }

  async listCollectionsAdmin(
    page?: number,
    limit?: number,
    filters?: {
      q?: string;
      isVisible?: boolean;
      classId?: string;
      sortBy?: "updatedAt" | "sortOrder" | "name";
      sortOrder?: "asc" | "desc";
    },
  ) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const q = filters?.q?.trim();
    const where = {
      ...(filters?.isVisible !== undefined ? { isVisible: filters.isVisible } : {}),
      ...(filters?.classId ? { classes: { some: { classId: filters.classId } } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { nameAr: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const sortBy = filters?.sortBy ?? "sortOrder";
    const sortOrder = filters?.sortOrder ?? (sortBy === "sortOrder" ? "asc" : "desc");

    const [items, total] = await Promise.all([
      this.prisma.db.collection.findMany({
        skip,
        take,
        where,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          nameAr: true,
          slug: true,
          description: true,
          descriptionAr: true,
          coverImageUrl: true,
          isVisible: true,
          sortOrder: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          classes: { select: { class: { select: CLASS_SELECT } } },
          _count: { select: { pieces: true } },
        },
      }),
      this.prisma.db.collection.count({ where }),
    ]);

    const ownerCounts = await this.ownerCountsByCollection(items.map((c) => c.id));

    return {
      items: await Promise.all(
        items.map(async ({ _count, classes, ...c }) => ({
          ...c,
          coverImageUrl: await this.storage.resolvePublicUrl(c.coverImageUrl),
          pieceCount: _count.pieces,
          ownerCount: ownerCounts.get(c.id) ?? 0,
          classes: classes.map((row) => row.class),
        })),
      ),
      total,
      page: p,
      limit: l,
    };
  }

  async getCollectionStats() {
    const [members, collections, hidden, pieces, pendingTransfers] = await Promise.all([
      this.prisma.db.client.count(),
      this.prisma.db.collection.count(),
      this.prisma.db.collection.count({ where: { isVisible: false } }),
      this.prisma.db.piece.count(),
      this.prisma.db.transferRequest.count({ where: { status: "DADAN_REVIEW" } }),
    ]);
    return { members, collections, hidden, pieces, pendingTransfers };
  }

  async getCollectionAdmin(id: string) {
    const collection = await this.prisma.db.collection.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        description: true,
        descriptionAr: true,
        coverImageUrl: true,
        isVisible: true,
        sortOrder: true,
        viewCount: true,
        origin: true,
        originAr: true,
        meaning: true,
        meaningAr: true,
        inspiration: true,
        inspirationAr: true,
        storyContent: true,
        storyContentAr: true,
        storyImageUrls: true,
        createdAt: true,
        updatedAt: true,
        classes: { select: { class: { select: CLASS_SELECT } } },
      },
    });
    if (!collection) throw new NotFoundException("errors.COLLECTION_NOT_FOUND");

    const [pieceCount, ownerCounts, transferCount] = await Promise.all([
      this.prisma.db.piece.count({ where: { collectionId: id } }),
      this.ownerCountsByCollection([id]),
      this.prisma.db.transferRequest.count({
        where: { piece: { collectionId: id } },
      }),
    ]);

    const { classes, storyImageUrls, ...rest } = collection;
    const hasStory = Boolean(
      collection.origin || collection.meaning || collection.inspiration || collection.storyContent,
    );

    return {
      ...rest,
      coverImageUrl: await this.storage.resolvePublicUrl(collection.coverImageUrl),
      storyImageUrls: await this.storage.resolvePublicUrls(storyImageUrls),
      classes: classes.map((row) => row.class),
      stats: {
        pieceCount,
        ownerCount: ownerCounts.get(id) ?? 0,
        transferCount,
      },
      health: {
        hasStory,
        hasCover: Boolean(collection.coverImageUrl),
        hasPieces: pieceCount > 0,
        hasAccessRules: classes.length > 0,
      },
    };
  }

  private async ownerCountsByCollection(collectionIds: string[]) {
    const counts = new Map<string, number>();
    if (collectionIds.length === 0) return counts;
    const rows = await this.prisma.db.$queryRaw<
      Array<{ collectionId: string; ownerCount: number }>
    >`
      SELECT "collectionId", COUNT(DISTINCT "currentOwnerId")::int AS "ownerCount"
      FROM "Piece"
      WHERE "collectionId" IN (${Prisma.join(collectionIds)})
        AND "currentOwnerId" IS NOT NULL
      GROUP BY "collectionId"
    `;
    for (const row of rows) {
      counts.set(row.collectionId, row.ownerCount);
    }
    return counts;
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
      classIds?: string[];
    },
    ipAddress?: string,
  ) {
    const { classIds, ...fields } = data;
    const collection = await this.prisma.db.$transaction(async (tx) => {
      await this.assertClassIds(tx, classIds);
      return tx.collection.create({
        data: {
          ...fields,
          classes: classIds?.length
            ? { create: classIds.map((classId) => ({ classId })) }
            : undefined,
        },
        include: { classes: { include: { class: { select: CLASS_SELECT } } } },
      });
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "COLLECTION_CREATED",
      targetType: "Collection",
      targetId: collection.id,
      ipAddress,
    });

    return {
      ...collection,
      classes: collection.classes.map((row) => row.class),
    };
  }

  async updateCollection(
    adminId: string,
    id: string,
    data: {
      name?: string;
      nameAr?: string;
      slug?: string;
      description?: string;
      descriptionAr?: string;
      coverImageUrl?: string;
      isVisible?: boolean;
      sortOrder?: number;
      origin?: string;
      originAr?: string;
      meaning?: string;
      meaningAr?: string;
      inspiration?: string;
      inspirationAr?: string;
      storyContent?: string;
      storyContentAr?: string;
      classIds?: string[];
    },
    ipAddress?: string,
  ) {
    const existing = await this.prisma.db.collection.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("errors.COLLECTION_NOT_FOUND");

    const { classIds, ...fields } = data;
    const collection = await this.prisma.db.$transaction(async (tx) => {
      if (classIds) {
        await this.assertClassIds(tx, classIds);
        await tx.collectionClass.deleteMany({ where: { collectionId: id } });
        if (classIds.length) {
          await tx.collectionClass.createMany({
            data: classIds.map((classId) => ({ collectionId: id, classId })),
          });
        }
      }

      return tx.collection.update({
        where: { id },
        data: fields,
        include: { classes: { include: { class: { select: CLASS_SELECT } } } },
      });
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "COLLECTION_UPDATED",
      targetType: "Collection",
      targetId: id,
      ipAddress,
    });

    return {
      ...collection,
      classes: collection.classes.map((row) => row.class),
    };
  }

  async uploadCover(
    adminId: string,
    id: string,
    buffer: Buffer,
    contentType: string,
    ipAddress?: string,
  ) {
    const collection = await this.prisma.db.collection.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!collection) throw new NotFoundException("errors.COLLECTION_NOT_FOUND");

    const ext = extFromMime(contentType);
    const key = collectionCoverKey(id, ext);
    const variants = await this.imageProcessing.processAndUpload(buffer, key, contentType);

    const updated = await this.prisma.db.collection.update({
      where: { id },
      data: {
        coverImageUrl: variants.webp,
        coverImageLqip: variants.lqipDataUrl,
      },
      select: { id: true, coverImageUrl: true },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "COLLECTION_UPDATED",
      targetType: "Collection",
      targetId: id,
      metadata: { cover: variants.webp },
      ipAddress,
    });

    return {
      ...updated,
      coverImageUrl: await this.storage.resolvePublicUrl(updated.coverImageUrl),
    };
  }

  async uploadStoryImage(
    adminId: string,
    id: string,
    buffer: Buffer,
    contentType: string,
    ipAddress?: string,
  ) {
    const collection = await this.prisma.db.collection.findUnique({
      where: { id },
      select: { id: true, storyImageUrls: true },
    });
    if (!collection) throw new NotFoundException("errors.COLLECTION_NOT_FOUND");

    const fileId = randomUUID();
    const ext = extFromMime(contentType);
    const key = collectionStoryImageKey(id, fileId, ext);
    const variants = await this.imageProcessing.processAndUpload(buffer, key, contentType);

    const updated = await this.prisma.db.collection.update({
      where: { id },
      data: { storyImageUrls: { push: variants.webp } },
      select: { id: true, storyImageUrls: true },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "COLLECTION_UPDATED",
      targetType: "Collection",
      targetId: id,
      metadata: { storyImage: variants.webp },
      ipAddress,
    });

    return {
      id: updated.id,
      storyImageUrls: await this.storage.resolvePublicUrls(updated.storyImageUrls),
    };
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

  async deletePieceFiles(pieceId: string): Promise<{ deleted: number; errors: number }> {
    const piece = await this.prisma.db.piece.findUnique({
      where: { id: pieceId },
      select: { imageUrls: true },
    });

    if (!piece?.imageUrls?.length) {
      return { deleted: 0, errors: 0 };
    }

    let deleted = 0;
    let errors = 0;

    for (const key of piece.imageUrls) {
      try {
        const exists = await this.storage.exists(key);
        if (exists) {
          await this.storage.delete(key);
          deleted++;
        }
      } catch {
        errors++;
      }
    }

    return { deleted, errors };
  }

  private async assertClassIds(
    tx: { class: { count: (args: { where: { id: { in: string[] } } }) => Promise<number> } },
    classIds?: string[],
  ) {
    if (!classIds?.length) return;
    const unique = [...new Set(classIds)];
    const count = await tx.class.count({ where: { id: { in: unique } } });
    if (count !== unique.length) {
      throw new NotFoundException("errors.CLASS_NOT_FOUND");
    }
  }
}

@Injectable()
export class PieceCleanupService {
  private readonly logger = new Logger(PieceCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly collections: CollectionsService,
    private readonly audit: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOrphanedPieceFiles() {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - PIECE_FILE_RETENTION_DAYS);

    const inactivePieces = await this.prisma.db.piece.findMany({
      where: {
        isActive: false,
        updatedAt: { lte: retentionDate },
        imageUrls: { isEmpty: false },
      },
      select: { id: true },
    });

    if (inactivePieces.length === 0) {
      return;
    }

    this.logger.log(
      `Starting cleanup of ${inactivePieces.length} inactive pieces older than ${PIECE_FILE_RETENTION_DAYS} days`,
    );

    let totalDeleted = 0;
    let totalErrors = 0;

    for (const piece of inactivePieces) {
      const { deleted, errors } = await this.collections.deletePieceFiles(piece.id);
      totalDeleted += deleted;
      totalErrors += errors;

      if (deleted > 0) {
        await this.prisma.db.piece.update({
          where: { id: piece.id },
          data: { imageUrls: [], imageLqips: [] },
        });
      }
    }

    await this.audit.log({
      actorType: ActorType.SYSTEM,
      actorId: "system",
      action: "PIECE_FILES_CLEANUP",
      metadata: {
        piecesProcessed: inactivePieces.length,
        filesDeleted: totalDeleted,
        errors: totalErrors,
      },
    });

    this.logger.log(
      `Cleanup complete: ${totalDeleted} files deleted, ${totalErrors} errors`,
    );
  }
}
