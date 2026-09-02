import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { AcquisitionType, ActorType, PieceStatus } from "@dadan/db";
import type { Locale } from "@dadan/types";
import { AuditService } from "../audit/audit.service";
import { CERTIFICATE_QUEUE } from "../certificates/jobs/certificate-job.processor";
import type { GenerateCertificateJobData } from "../certificates/jobs/certificate-job.processor";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { VisibilityService } from "../visibility/visibility.service";
import { SerialNumberService } from "./serial-number.service";
import { MAX_CATALOG_ROWS, paginationParams } from "../common/constants";
import {
  localizeDesign,
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
    private readonly visibility: VisibilityService,
    @InjectQueue(CERTIFICATE_QUEUE)
    private readonly certificateQueue: Queue<GenerateCertificateJobData>,
  ) {}

  /**
   * Certificate rendering is CPU- and memory-heavy, so admin actions that mint
   * one hand it to the shared queue rather than blocking the request thread.
   * `jobId` collapses retries of the same piece into a single render.
   */
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
    const pieces = await this.prisma.db.piece.findMany({
      where: { currentOwnerId: clientId },
      // The result is re-sorted by acquisition date below, so `limit` cannot
      // be pushed down without changing which pieces are returned. This cap
      // bounds the read instead of letting it grow with the wardrobe.
      take: MAX_CATALOG_ROWS,
      include: {
        design: {
          include: {
            specifications: { orderBy: { sortOrder: "asc" } },
            collection: true,
          },
        },
        certificates: { where: { isActive: true }, take: 1 },
        ownershipRecords: {
          where: { clientId },
          orderBy: { acquiredAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    let sortedPieces = pieces
      .map((p) => ({
        id: p.id,
        serialNumber: p.serialNumber,
        status: p.status,
        design: {
          name: pickLocalized(locale, p.design.name, p.design.nameAr),
          slug: p.design.slug,
          images: p.design.imageUrls,
          specifications: localizeSpecifications(
            p.design.specifications,
            locale,
          ),
          collection: pickLocalized(
            locale,
            p.design.collection.name,
            p.design.collection.nameAr,
          ),
        },
        certificate: p.certificates[0] ?? null,
        acquiredAt: p.ownershipRecords[0]?.acquiredAt ?? p.registeredAt,
      }))
      .sort(
        (a, b) =>
          new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime(),
      );

    if (limit && limit > 0) {
      sortedPieces = sortedPieces.slice(0, limit);
    }

    return Promise.all(
      sortedPieces.map(async (entry) => ({
        ...entry,
        design: {
          ...entry.design,
          images: await this.storage.resolvePublicUrls(entry.design.images),
        },
      })),
    );
  }

  async getWardrobePiece(
    clientId: string,
    pieceId: string,
    locale: Locale = "ar",
  ) {
    const piece = await this.prisma.db.piece.findFirst({
      where: { id: pieceId, currentOwnerId: clientId },
      include: {
        design: {
          include: {
            specifications: { orderBy: { sortOrder: "asc" } },
            collection: true,
          },
        },
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

    const signedImageUrls = await this.storage.resolvePublicUrls(piece.design.imageUrls);
    const { specifications, ...designFields } = piece.design;

    return {
      id: piece.id,
      serialNumber: piece.serialNumber,
      status: piece.status,
      design: {
        ...localizeDesign(designFields, locale),
        specifications: localizeSpecifications(specifications, locale),
        imageUrls: signedImageUrls,
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
        piece: {
          include: {
            design: { include: { collection: true } },
          },
        },
      },
      orderBy: { savedAt: "desc" },
    });

    return Promise.all(
      saved.map(async (s) => {
        const { collection, ...designFields } = s.piece.design;
        return {
          savedAt: s.savedAt,
          piece: {
            id: s.piece.id,
            serialNumber: s.piece.serialNumber,
            status: s.piece.status,
            design: {
              ...localizeDesign(designFields, locale),
              collection: {
                id: collection.id,
                name: pickLocalized(locale, collection.name, collection.nameAr),
                slug: collection.slug,
              },
              imageUrls: await this.storage.resolvePublicUrls(s.piece.design.imageUrls),
            },
          },
        };
      }),
    );
  }

  /**
   * Get combined collection data for a client in a single request.
   * Returns both owned pieces and saved pieces with UI-ready format.
   */
  async getMyCollection(clientId: string, locale: Locale = "ar") {
    const [owned, saved] = await Promise.all([
      this.getWardrobe(clientId, locale),
      this.getSavedPieces(clientId, locale),
    ]);

    return {
      owned: owned.map((p) => ({
        id: p.id,
        serialNumber: p.serialNumber,
        name: p.design.name,
        slug: p.design.slug,
        imageUrl: p.design.images[0] ?? null,
        acquiredAt: p.acquiredAt,
        collection: p.design.collection,
      })),
      saved: saved.map((s) => ({
        id: s.piece.id,
        serialNumber: s.piece.serialNumber,
        name: s.piece.design.name,
        slug: s.piece.design.slug,
        imageUrl: s.piece.design.imageUrls[0] ?? null,
        savedAt: s.savedAt,
        collection: s.piece.design.collection.name,
        price: s.piece.design.basePrice,
        currency: s.piece.design.currency,
      })),
    };
  }

  async savePiece(clientId: string, clientGroups: string[], pieceId: string) {
    const piece = await this.prisma.db.piece.findUnique({
      where: { id: pieceId },
      include: { design: { include: { collection: true } } },
    });
    // Only allow saving pieces the client can actually see in the catalog.
    if (
      !piece ||
      !piece.design.isActive ||
      !piece.design.collection.isVisible ||
      !this.visibility.canAccess(clientGroups, piece.design.visibilityGroups) ||
      !this.visibility.canAccess(clientGroups, piece.design.collection.visibilityGroups)
    ) {
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
    data: { designId: string; notes?: string; initialClientId?: string },
    ipAddress?: string,
  ) {
    const serialNumber = await this.serialNumbers.generateForDesign(data.designId);

    const piece = await this.prisma.db.$transaction(async (tx) => {
      const created = await tx.piece.create({
        data: {
          serialNumber,
          designId: data.designId,
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

  async listPieces(page?: number, limit?: number) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.db.piece.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          design: { include: { collection: true } },
          currentOwner: { select: { displayName: true } },
        },
      }),
      this.prisma.db.piece.count(),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        serialNumber: p.serialNumber,
        designName: p.design.name,
        collection: p.design.collection.name,
        currentOwner: p.currentOwner?.displayName ?? null,
        status: p.status,
      })),
      total,
      page: p,
      limit: l,
    };
  }

  async getPieceById(id: string) {
    const piece = await this.prisma.db.piece.findUnique({
      where: { id },
      include: {
        design: {
          include: {
            specifications: { orderBy: { sortOrder: "asc" } },
            collection: true,
          },
        },
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
    return piece;
  }

  async updatePiece(
    adminId: string,
    id: string,
    data: { status?: PieceStatus; notes?: string },
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
      data: { status: data.status },
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
}
