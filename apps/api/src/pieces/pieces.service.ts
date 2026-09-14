import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { AcquisitionType, ActorType, PieceStatus } from "@dadan/db";
import type { Locale } from "@dadan/types";
import { randomUUID } from "node:crypto";
import { extFromMime, pieceImageKey } from "@dadan/storage";
import { AuditService } from "../audit/audit.service";
import { CERTIFICATE_QUEUE } from "../certificates/jobs/certificate-job.processor";
import type { GenerateCertificateJobData } from "../certificates/jobs/certificate-job.processor";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { ImageProcessingService } from "../storage/image-processing.service";
import { VisibilityService } from "../visibility/visibility.service";
import { SerialNumberService } from "./serial-number.service";
import { MAX_CATALOG_ROWS, paginationParams } from "../common/constants";
import {
  localizePiece,
  localizeSpecifications,
  pickLocalized,
} from "../common/i18n/localize";

@Injectable()
export class PiecesService {
  private static readonly PIECE_TRANSITIONS: Record<PieceStatus, PieceStatus[]> = {
    [PieceStatus.AVAILABLE]: [PieceStatus.RETIRED],
    [PieceStatus.OWNED]: [],
    [PieceStatus.TRANSFER_PENDING]: [],
    [PieceStatus.RETIRED]: [PieceStatus.AVAILABLE],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly serialNumbers: SerialNumberService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly imageProcessing: ImageProcessingService,
    private readonly visibility: VisibilityService,
    @InjectQueue(CERTIFICATE_QUEUE)
    private readonly certificateQueue: Queue<GenerateCertificateJobData>,
  ) {}

  private enqueueCertificate(
    pieceId: string,
    clientId: string,
    adminId: string,
  ): Promise<unknown> {
    return this.certificateQueue.add(
      "generate-certificate",
      { pieceId, clientId, adminId },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 50,
        jobId: `generate:${pieceId}:${clientId}`,
      },
    );
  }

  async getWardrobe(clientId: string, locale: Locale = "ar", limit?: number) {
    const take =
      limit && limit > 0 ? Math.min(limit, MAX_CATALOG_ROWS) : MAX_CATALOG_ROWS;

    const records = await this.prisma.db.ownershipRecord.findMany({
      where: { clientId, transferredAt: null },
      orderBy: { acquiredAt: "desc" },
      take,
      select: { pieceId: true, acquiredAt: true },
    });
    if (records.length === 0) return [];

    const order = new Map(records.map((row, index) => [row.pieceId, index]));
    const pieces = await this.prisma.db.piece.findMany({
      where: {
        id: { in: records.map((row) => row.pieceId) },
        currentOwnerId: clientId,
      },
      include: {
        collection: true,
        specifications: { orderBy: { sortOrder: "asc" } },
        certificates: { where: { isActive: true }, take: 1 },
        ownershipRecords: {
          where: { clientId },
          orderBy: { acquiredAt: "desc" },
          take: 1,
        },
      },
    });
    pieces.sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    );

    const urlMap = await this.storage.resolvePublicUrlsBatch(
      pieces.flatMap((piece) => piece.imageUrls),
    );

    return pieces.map((p) => ({
      id: p.id,
      serialNumber: p.serialNumber,
      status: p.status,
      name: pickLocalized(locale, p.name, p.nameAr),
      slug: p.slug,
      images: p.imageUrls
        .map((key) => urlMap.get(key))
        .filter((url): url is string => !!url),
      specifications: localizeSpecifications(p.specifications, locale),
      collection: pickLocalized(locale, p.collection.name, p.collection.nameAr),
      certificate: p.certificates[0] ?? null,
      acquiredAt: p.ownershipRecords[0]?.acquiredAt ?? p.registeredAt,
    }));
  }

  async getOwnershipHistory(clientId: string, locale: Locale = "ar") {
    const records = await this.prisma.db.ownershipRecord.findMany({
      where: { clientId },
      orderBy: { acquiredAt: "desc" },
      take: 100,
      select: {
        id: true,
        acquiredAt: true,
        acquisitionType: true,
        piece: { select: { id: true, name: true, nameAr: true } },
      },
    });

    return records.map((record) => ({
      id: record.id,
      pieceId: record.piece.id,
      pieceName: pickLocalized(locale, record.piece.name, record.piece.nameAr),
      date: record.acquiredAt.toISOString(),
      type: record.acquisitionType,
    }));
  }

  async getWardrobePiece(
    clientId: string,
    pieceId: string,
    locale: Locale = "ar",
  ) {
    const piece = await this.prisma.db.piece.findFirst({
      where: { id: pieceId, currentOwnerId: clientId },
      include: {
        collection: true,
        specifications: { orderBy: { sortOrder: "asc" } },
        ownershipRecords: { orderBy: { acquiredAt: "asc" } },
        certificates: { where: { isActive: true }, take: 1 },
        transferRequests: {
          where: {
            status: {
              notIn: ["APPROVED", "REJECTED", "CANCELLED"],
            },
          },
          take: 1,
        },
      },
    });

    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");

    const { specifications, collection, ...pieceFields } = piece;
    const signedImageUrls = await this.storage.resolvePublicUrls(piece.imageUrls);

    return {
      ...localizePiece(pieceFields, locale),
      specifications: localizeSpecifications(specifications, locale),
      imageUrls: signedImageUrls,
      collection: {
        id: collection.id,
        name: pickLocalized(locale, collection.name, collection.nameAr),
        slug: collection.slug,
      },
      ownershipHistory: piece.ownershipRecords.map((r) => ({
        acquiredAt: r.acquiredAt,
        transferredAt: r.transferredAt,
        acquisitionType: r.acquisitionType,
      })),
      certificate: piece.certificates[0] ?? null,
      activeTransfer: piece.transferRequests[0] ?? null,
    };
  }

  async getSavedPieces(clientId: string, locale: Locale = "ar") {
    const saved = await this.prisma.db.savedPiece.findMany({
      where: { clientId },
      include: {
        piece: { include: { collection: true } },
      },
      orderBy: { savedAt: "desc" },
    });

    const urlMap = await this.storage.resolvePublicUrlsBatch(
      saved.flatMap((s) => s.piece.imageUrls),
    );

    return saved.map((s) => {
      const { collection, ...pieceFields } = s.piece;
      return {
        savedAt: s.savedAt,
        piece: {
          ...localizePiece(pieceFields, locale),
          collection: {
            id: collection.id,
            name: pickLocalized(locale, collection.name, collection.nameAr),
            slug: collection.slug,
          },
          imageUrls: s.piece.imageUrls
            .map((key) => urlMap.get(key))
            .filter((url): url is string => !!url),
        },
      };
    });
  }

  async getMyCollection(clientId: string, locale: Locale = "ar") {
    const [owned, saved] = await Promise.all([
      this.getWardrobe(clientId, locale),
      this.getSavedPieces(clientId, locale),
    ]);

    return {
      owned: owned.map((p) => ({
        id: p.id,
        serialNumber: p.serialNumber,
        name: p.name,
        slug: p.slug,
        imageUrl: p.images[0] ?? null,
        acquiredAt: p.acquiredAt,
        collection: p.collection,
      })),
      saved: saved.map((s) => ({
        id: s.piece.id,
        serialNumber: s.piece.serialNumber,
        name: s.piece.name,
        slug: s.piece.slug,
        imageUrl: s.piece.imageUrls[0] ?? null,
        savedAt: s.savedAt,
        collection: s.piece.collection.name,
        price: s.piece.price,
        currency: s.piece.currency,
      })),
    };
  }

  async savePiece(clientId: string, classId: string, pieceId: string) {
    const piece = await this.prisma.db.piece.findUnique({
      where: { id: pieceId },
      include: { collection: { include: { classes: { select: { classId: true } } } } },
    });
    if (!piece || !this.visibility.canAccessPiece(classId, piece)) {
      throw new NotFoundException("errors.PIECE_NOT_FOUND");
    }

    await this.prisma.db.savedPiece.upsert({
      where: { clientId_pieceId: { clientId, pieceId } },
      create: { clientId, pieceId },
      update: {},
    });
    return { success: true };
  }

  async unsavePiece(clientId: string, pieceId: string) {
    await this.prisma.db.savedPiece.deleteMany({
      where: { clientId, pieceId },
    });
    return { success: true };
  }

  async registerPiece(
    adminId: string,
    data: {
      collectionId: string;
      name: string;
      nameAr: string;
      slug: string;
      story: string;
      storyAr: string;
      material: string;
      materialAr?: string;
      weight: number;
      dimensions: string;
      dimensionsAr?: string;
      price: number;
      currency?: string;
      notes?: string;
      initialClientId?: string;
    },
    ipAddress?: string,
  ) {
    const serialNumber = await this.serialNumbers.generateForCollection(
      data.collectionId,
    );

    const piece = await this.prisma.db.$transaction(async (tx) => {
      const created = await tx.piece.create({
        data: {
          serialNumber,
          collectionId: data.collectionId,
          name: data.name,
          nameAr: data.nameAr,
          slug: data.slug,
          story: data.story,
          storyAr: data.storyAr,
          material: data.material,
          materialAr: data.materialAr,
          weight: data.weight,
          dimensions: data.dimensions,
          dimensionsAr: data.dimensionsAr,
          price: data.price,
          currency: data.currency ?? "SAR",
          notes: data.notes,
          imageUrls: [],
          status: data.initialClientId ? PieceStatus.OWNED : PieceStatus.AVAILABLE,
          currentOwnerId: data.initialClientId ?? null,
        },
      });

      if (data.initialClientId) {
        await tx.ownershipRecord.create({
          data: {
            pieceId: created.id,
            clientId: data.initialClientId,
            acquisitionType: AcquisitionType.ADMIN_ASSIGNMENT,
            notes: data.notes,
          },
        });
      }

      return created;
    });

    if (data.initialClientId) {
      await this.enqueueCertificate(piece.id, data.initialClientId, adminId);
    }

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "PIECE_REGISTERED",
      targetType: "Piece",
      targetId: piece.id,
      ipAddress,
    });

    return piece;
  }

  async listPieces(
    page?: number,
    limit?: number,
    filters?: {
      collectionId?: string;
      status?: PieceStatus;
      isActive?: boolean;
      q?: string;
    },
  ) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const q = filters?.q?.trim();
    const where = {
      ...(filters?.collectionId ? { collectionId: filters.collectionId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { serialNumber: { contains: q.toUpperCase() } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.db.piece.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          serialNumber: true,
          name: true,
          slug: true,
          material: true,
          status: true,
          isActive: true,
          price: true,
          updatedAt: true,
          createdAt: true,
          collection: { select: { id: true, name: true, slug: true } },
          currentOwner: { select: { displayName: true } },
        },
      }),
      this.prisma.db.piece.count({ where }),
    ]);

    return {
      items: items.map((row) => ({
        id: row.id,
        serialNumber: row.serialNumber,
        name: row.name,
        slug: row.slug,
        material: row.material,
        collection: row.collection.name,
        collectionId: row.collection.id,
        currentOwner: row.currentOwner?.displayName ?? null,
        status: row.status,
        isActive: row.isActive,
        price: row.price,
        updatedAt: row.updatedAt,
        createdAt: row.createdAt,
      })),
      total,
      page: p,
      limit: l,
    };
  }

  async getPieceStats(collectionId?: string) {
    const where = collectionId ? { collectionId } : {};
    const [published, drafts, archived, total] = await Promise.all([
      this.prisma.db.piece.count({
        where: { ...where, isActive: true, status: { not: PieceStatus.RETIRED } },
      }),
      this.prisma.db.piece.count({ where: { ...where, isActive: false } }),
      this.prisma.db.piece.count({
        where: { ...where, status: PieceStatus.RETIRED },
      }),
      this.prisma.db.piece.count({ where }),
    ]);
    return { total, published, drafts, archived };
  }

  async getPieceById(id: string) {
    const piece = await this.prisma.db.piece.findUnique({
      where: { id },
      include: {
        collection: true,
        specifications: { orderBy: { sortOrder: "asc" } },
        currentOwner: {
          select: {
            id: true,
            displayName: true,
            email: true,
            houseKeyPrefix: true,
            isActive: true,
          },
        },
        ownershipRecords: {
          include: { client: { select: { displayName: true, id: true } } },
          orderBy: { acquiredAt: "asc" },
        },
        certificates: { orderBy: { issuedAt: "desc" } },
        transferRequests: { orderBy: { initiatedAt: "desc" } },
      },
    });
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");
    return {
      ...piece,
      imageUrls: await this.storage.resolvePublicUrls(piece.imageUrls),
    };
  }

  async updatePiece(
    adminId: string,
    id: string,
    data: {
      status?: PieceStatus;
      isActive?: boolean;
      name?: string;
      nameAr?: string;
      slug?: string;
      collectionId?: string;
      story?: string;
      storyAr?: string;
      material?: string;
      materialAr?: string;
      weight?: number;
      dimensions?: string;
      dimensionsAr?: string;
      price?: number;
      currency?: string;
      notes?: string;
    },
    ipAddress?: string,
  ) {
    const piece = await this.prisma.db.piece.findUnique({ where: { id } });
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");

    if (data.status === PieceStatus.OWNED && !piece.currentOwnerId) {
      throw new BadRequestException("Cannot set OWNED without an owner");
    }

    if (data.status) {
      const allowed = PiecesService.PIECE_TRANSITIONS[piece.status];
      if (!allowed.includes(data.status)) {
        throw new BadRequestException(
          `Invalid piece status transition from ${piece.status} to ${data.status}`,
        );
      }
    }

    const updated = await this.prisma.db.piece.update({
      where: { id },
      data,
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "PIECE_UPDATED",
      targetType: "Piece",
      targetId: id,
      metadata: data,
      ipAddress,
    });

    return updated;
  }

  async assignPiece(
    adminId: string,
    id: string,
    data: { clientId: string; acquisitionType?: AcquisitionType; notes?: string },
    ipAddress?: string,
  ) {
    const piece = await this.prisma.db.piece.findUnique({ where: { id } });
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");
    if (piece.status !== PieceStatus.AVAILABLE) {
      throw new BadRequestException("Piece is not available for assignment");
    }

    await this.prisma.db.$transaction(async (tx) => {
      await tx.piece.update({
        where: { id },
        data: {
          status: PieceStatus.OWNED,
          currentOwnerId: data.clientId,
        },
      });

      await tx.ownershipRecord.create({
        data: {
          pieceId: id,
          clientId: data.clientId,
          acquisitionType: data.acquisitionType ?? AcquisitionType.ADMIN_ASSIGNMENT,
          notes: data.notes,
        },
      });

      await tx.savedPiece.deleteMany({ where: { pieceId: id } });
    });

    await this.enqueueCertificate(id, data.clientId, adminId);

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "PIECE_ASSIGNED",
      targetType: "Piece",
      targetId: id,
      metadata: { clientId: data.clientId },
      ipAddress,
    });

    return this.getPieceById(id);
  }

  async uploadPieceImage(
    adminId: string,
    pieceId: string,
    buffer: Buffer,
    contentType: string,
    ipAddress?: string,
  ) {
    const piece = await this.prisma.db.piece.findUnique({ where: { id: pieceId } });
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");

    const fileId = randomUUID();
    const ext = extFromMime(contentType);
    const key = pieceImageKey(pieceId, fileId, ext);
    const variants = await this.imageProcessing.processAndUpload(buffer, key, contentType);

    const updated = await this.prisma.db.piece.update({
      where: { id: pieceId },
      data: {
        imageUrls: { push: variants.webp },
        imageLqips: { push: variants.lqipDataUrl },
      },
    });

    await this.audit.log({
      actorType: ActorType.ADMIN,
      actorId: adminId,
      action: "PIECE_IMAGE_UPLOADED",
      targetType: "Piece",
      targetId: pieceId,
      metadata: { key: variants.webp, lqip: variants.lqip },
      ipAddress,
    });

    return updated;
  }

  async upsertSpecifications(
    adminId: string,
    pieceId: string,
    specs: {
      key: string;
      keyAr?: string;
      value: string;
      valueAr?: string;
      sortOrder?: number;
    }[],
    ipAddress?: string,
  ) {
    const piece = await this.prisma.db.piece.findUnique({
      where: { id: pieceId },
      select: { id: true },
    });
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");

    await this.prisma.db.$transaction(async (tx) => {
      for (const spec of specs) {
        const existing = await tx.pieceSpecification.findFirst({
          where: { pieceId, key: spec.key },
        });
        if (existing) {
          await tx.pieceSpecification.update({
            where: { id: existing.id },
            data: {
              value: spec.value,
              keyAr: spec.keyAr ?? existing.keyAr,
              valueAr: spec.valueAr ?? existing.valueAr,
              sortOrder: spec.sortOrder ?? existing.sortOrder,
            },
          });
        } else {
          await tx.pieceSpecification.create({
            data: {
              pieceId,
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
      action: "PIECE_SPECS_UPDATED",
      targetType: "Piece",
      targetId: pieceId,
      ipAddress,
    });

    return this.prisma.db.pieceSpecification.findMany({
      where: { pieceId },
      orderBy: { sortOrder: "asc" },
    });
  }
}
