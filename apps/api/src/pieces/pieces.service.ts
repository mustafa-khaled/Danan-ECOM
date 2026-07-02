import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AcquisitionType, ActorType, PieceStatus } from "@dadan/db";
import { AuditService } from "../audit/audit.service";
import { CertificatesService } from "../certificates/certificates.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { VisibilityService } from "../visibility/visibility.service";
import { SerialNumberService } from "./serial-number.service";
import { paginationParams } from "../common/constants";

@Injectable()
export class PiecesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serialNumbers: SerialNumberService,
    private readonly certificates: CertificatesService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly visibility: VisibilityService,
  ) {}

  async getWardrobe(clientId: string) {
    const pieces = await this.prisma.db.piece.findMany({
      where: { currentOwnerId: clientId },
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

    return Promise.all(
      pieces
        .map((p) => ({
          id: p.id,
          serialNumber: p.serialNumber,
          status: p.status,
          design: {
            name: p.design.name,
            images: p.design.imageUrls,
            specifications: p.design.specifications,
            collection: p.design.collection.name,
          },
          certificate: p.certificates[0] ?? null,
          acquiredAt: p.ownershipRecords[0]?.acquiredAt ?? p.registeredAt,
        }))
        .sort(
          (a, b) =>
            new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime(),
        )
        .map(async (entry) => ({
          ...entry,
          design: {
            ...entry.design,
            images: await this.storage.resolvePublicUrls(entry.design.images),
          },
        })),
    );
  }

  async getWardrobePiece(clientId: string, pieceId: string) {
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

    if (!piece) throw new NotFoundException("Piece not found");

    const signedImageUrls = await this.storage.resolvePublicUrls(piece.design.imageUrls);

    return {
      id: piece.id,
      serialNumber: piece.serialNumber,
      status: piece.status,
      design: {
        ...piece.design,
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

  async getSavedPieces(clientId: string) {
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
      saved.map(async (s) => ({
        savedAt: s.savedAt,
        piece: {
          id: s.piece.id,
          serialNumber: s.piece.serialNumber,
          status: s.piece.status,
          design: {
            ...s.piece.design,
            imageUrls: await this.storage.resolvePublicUrls(s.piece.design.imageUrls),
          },
        },
      })),
    );
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
      throw new NotFoundException("Piece not found");
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
      await this.certificates.generateCertificate(piece.id, data.initialClientId, adminId);
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
    if (!piece) throw new NotFoundException("Piece not found");
    return piece;
  }

  async updatePiece(
    adminId: string,
    id: string,
    data: { status?: PieceStatus; notes?: string },
    ipAddress?: string,
  ) {
    const piece = await this.prisma.db.piece.findUnique({ where: { id } });
    if (!piece) throw new NotFoundException("Piece not found");

    if (data.status === PieceStatus.OWNED && !piece.currentOwnerId) {
      throw new BadRequestException("Cannot set OWNED without an owner");
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
    if (!piece) throw new NotFoundException("Piece not found");
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

    await this.certificates.generateCertificate(id, data.clientId, adminId);

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
