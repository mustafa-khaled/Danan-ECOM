import { Injectable, NotFoundException } from "@nestjs/common";
import { PieceStatus, TransferStatus } from "@dadan/db";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { paginationParams } from "../common/constants";

type OwnershipFilter = "OWNED" | "IN_TRANSFER" | "PENDING" | "AVAILABLE";

@Injectable()
export class OwnershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(
    page?: number,
    limit?: number,
    filters?: { q?: string; status?: OwnershipFilter; collectionId?: string },
  ) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const q = filters?.q?.trim();
    const where = {
      ...(filters?.collectionId ? { collectionId: filters.collectionId } : {}),
      ...this.statusWhere(filters?.status),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { nameAr: { contains: q, mode: "insensitive" as const } },
              { serialNumber: { contains: q.toUpperCase() } },
              {
                currentOwner: {
                  displayName: { contains: q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.db.piece.findMany({
        skip,
        take,
        where,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          nameAr: true,
          serialNumber: true,
          status: true,
          mainImageUrl: true,
          collection: { select: { id: true, name: true, nameAr: true } },
          currentOwner: { select: { displayName: true, email: true } },
          ownershipRecords: {
            where: { transferredAt: null },
            orderBy: { acquiredAt: "desc" },
            take: 1,
            select: { acquiredAt: true, acquisitionType: true },
          },
          transferRequests: {
            where: { status: TransferStatus.DADAN_REVIEW },
            select: { id: true },
            take: 1,
          },
        },
      }),
      this.prisma.db.piece.count({ where }),
    ]);

    const urlMap = await this.storage.resolvePublicUrlsBatch(
      items.map((piece) => piece.mainImageUrl).filter(Boolean) as string[],
    );

    return {
      items: items.map((piece) => ({
        id: piece.id,
        pieceId: piece.id,
        pieceName: piece.name,
        pieceNameAr: piece.nameAr,
        pieceSerial: piece.serialNumber,
        pieceImageUrl: piece.mainImageUrl
          ? (urlMap.get(piece.mainImageUrl) ?? null)
          : null,
        ownerName: piece.currentOwner?.displayName ?? null,
        ownerEmail: piece.currentOwner?.email ?? null,
        collectionName: piece.collection.name,
        collectionNameAr: piece.collection.nameAr,
        status: this.toUiStatus(piece.status, piece.transferRequests.length > 0),
        transferType: piece.ownershipRecords[0]?.acquisitionType ?? null,
        since: piece.ownershipRecords[0]?.acquiredAt ?? null,
      })),
      total,
      page: p,
      limit: l,
    };
  }

  async stats() {
    const [owned, transferPending, available, transfers] = await Promise.all([
      this.prisma.db.piece.count({ where: { status: PieceStatus.OWNED } }),
      this.prisma.db.piece.count({ where: { status: PieceStatus.TRANSFER_PENDING } }),
      this.prisma.db.piece.count({ where: { status: PieceStatus.AVAILABLE } }),
      this.prisma.db.transferRequest.count(),
    ]);
    return { owned, transfers, pendingTransfers: transferPending, available };
  }

  async getByPieceId(pieceId: string) {
    const piece = await this.prisma.db.piece.findUnique({
      where: { id: pieceId },
      select: {
        id: true,
        name: true,
        nameAr: true,
        serialNumber: true,
        status: true,
        mainImageUrl: true,
        mainImageLqip: true,
        imageUrls: true,
        collection: { select: { id: true, name: true, nameAr: true } },
        currentOwner: {
          select: { id: true, displayName: true, email: true, houseKeyPrefix: true },
        },
        ownershipRecords: {
          orderBy: { acquiredAt: "asc" },
          select: {
            id: true,
            acquiredAt: true,
            transferredAt: true,
            acquisitionType: true,
            notes: true,
            client: { select: { id: true, displayName: true } },
          },
        },
        transferRequests: {
          where: {
            status: {
              in: [
                TransferStatus.INITIATED,
                TransferStatus.SENDER_CONFIRMED,
                TransferStatus.RECIPIENT_CONFIRMED,
                TransferStatus.DADAN_REVIEW,
              ],
            },
          },
          orderBy: { initiatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            transferType: true,
            initiatedAt: true,
            fromClient: { select: { id: true, displayName: true, email: true } },
            toClient: { select: { id: true, displayName: true, email: true } },
          },
        },
      },
    });
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");

    return {
      ...piece,
      mainImageUrl: await this.storage.resolvePublicUrl(piece.mainImageUrl),
      imageUrls: await this.storage.resolvePublicUrls(piece.imageUrls),
      activeTransfer: piece.transferRequests[0] ?? null,
      status: this.toUiStatus(piece.status, Boolean(piece.transferRequests[0])),
    };
  }

  private statusWhere(status?: OwnershipFilter) {
    if (!status) return {};
    if (status === "AVAILABLE") return { status: PieceStatus.AVAILABLE };
    if (status === "OWNED") return { status: PieceStatus.OWNED };
    if (status === "IN_TRANSFER") return { status: PieceStatus.TRANSFER_PENDING };
    return {
      transferRequests: { some: { status: TransferStatus.DADAN_REVIEW } },
    };
  }

  private toUiStatus(status: PieceStatus, hasReview: boolean) {
    if (hasReview) return "PENDING";
    if (status === PieceStatus.TRANSFER_PENDING) return "IN_TRANSFER";
    if (status === PieceStatus.AVAILABLE) return "AVAILABLE";
    return "OWNED";
  }
}
