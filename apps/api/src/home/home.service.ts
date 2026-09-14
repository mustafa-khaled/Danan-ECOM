import { Injectable } from "@nestjs/common";
import { PieceStatus } from "@dadan/db";
import type { Locale } from "@dadan/types";
import { pickLocalized } from "../common/i18n/localize";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { StorageService } from "../storage/storage.service";
import { VisibilityService } from "../visibility/visibility.service";

const MAX_SELECTED_PIECES = 3;
const POPULAR_CACHE_TTL_SECONDS = 300;

export interface SelectedPiece {
  slug: string;
  name: string;
  imageUrl: string | null;
  imageLqip: string | null;
  price: string;
  currency: string;
  collectionName: string;
  collectionSlug: string;
}

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly visibility: VisibilityService,
    private readonly redis: RedisService,
  ) {}

  async getSelectedForYou(
    clientId: string,
    classId: string,
    locale: Locale = "ar",
  ): Promise<SelectedPiece[]> {
    const results: SelectedPiece[] = [];
    const selectedIds = new Set<string>();

    await this.fillFromSavedPieces(clientId, classId, locale, results, selectedIds);
    if (results.length >= MAX_SELECTED_PIECES) return results;

    await this.fillFromPastOrders(clientId, classId, locale, results, selectedIds);
    if (results.length >= MAX_SELECTED_PIECES) return results;

    await this.fillFromPopular(classId, locale, results, selectedIds);
    if (results.length >= MAX_SELECTED_PIECES) return results;

    await this.fillFromNewest(classId, locale, results, selectedIds);

    return results;
  }

  private catalogWhere(classId: string, extra?: Record<string, unknown>) {
    return {
      isActive: true,
      status: PieceStatus.AVAILABLE,
      currentOwnerId: null,
      collection: this.visibility.prismaFilter(classId),
      ...extra,
    };
  }

  private async fillFromSavedPieces(
    clientId: string,
    classId: string,
    locale: Locale,
    results: SelectedPiece[],
    selectedIds: Set<string>,
  ): Promise<void> {
    const savedPieces = await this.prisma.db.savedPiece.findMany({
      where: { clientId },
      include: { piece: { select: { id: true, collectionId: true } } },
      orderBy: { savedAt: "desc" },
      take: 10,
    });

    if (savedPieces.length === 0) return;

    const savedIds = new Set(savedPieces.map((sp) => sp.piece.id));
    const interestedCollectionIds = [
      ...new Set(savedPieces.map((sp) => sp.piece.collectionId)),
    ];

    const related = await this.prisma.db.piece.findMany({
      where: this.catalogWhere(classId, {
        collectionId: { in: interestedCollectionIds },
        id: { notIn: [...savedIds] },
      }),
      include: { collection: true },
      take: MAX_SELECTED_PIECES * 2,
    });

    for (const piece of related) {
      if (results.length >= MAX_SELECTED_PIECES) break;
      if (selectedIds.has(piece.id)) continue;
      selectedIds.add(piece.id);
      results.push(await this.mapToSelectedPiece(piece, locale));
    }
  }

  private async fillFromPastOrders(
    clientId: string,
    classId: string,
    locale: Locale,
    results: SelectedPiece[],
    selectedIds: Set<string>,
  ): Promise<void> {
    const orderItems = await this.prisma.db.orderItem.findMany({
      where: {
        order: { clientId, status: { in: ["PAID", "FULFILLED"] } },
      },
      include: { piece: { select: { id: true, collectionId: true } } },
      take: 10,
    });

    if (orderItems.length === 0) return;

    const purchasedIds = new Set(orderItems.map((oi) => oi.piece.id));
    const purchasedCollectionIds = [
      ...new Set(orderItems.map((oi) => oi.piece.collectionId)),
    ];

    const related = await this.prisma.db.piece.findMany({
      where: this.catalogWhere(classId, {
        collectionId: { in: purchasedCollectionIds },
        id: { notIn: [...purchasedIds, ...selectedIds] },
      }),
      include: { collection: true },
      take: MAX_SELECTED_PIECES * 2,
    });

    for (const piece of related) {
      if (results.length >= MAX_SELECTED_PIECES) break;
      if (selectedIds.has(piece.id)) continue;
      selectedIds.add(piece.id);
      results.push(await this.mapToSelectedPiece(piece, locale));
    }
  }

  private async fillFromPopular(
    classId: string,
    locale: Locale,
    results: SelectedPiece[],
    selectedIds: Set<string>,
  ): Promise<void> {
    const cacheKey = `home:popular-pieces:${classId}`;

    let pieceIds: string[] | null = null;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      pieceIds = JSON.parse(cached) as string[];
    } else {
      const popular = await this.prisma.db.piece.findMany({
        where: this.catalogWhere(classId),
        include: { _count: { select: { orderItems: true } } },
        orderBy: { orderItems: { _count: "desc" } },
        take: 10,
      });
      pieceIds = popular.map((p) => p.id);
      await this.redis.setWithExpiry(
        cacheKey,
        JSON.stringify(pieceIds),
        POPULAR_CACHE_TTL_SECONDS,
      );
    }

    if (pieceIds.length === 0) return;

    const pieces = await this.prisma.db.piece.findMany({
      where: { id: { in: pieceIds }, ...this.catalogWhere(classId) },
      include: { collection: true },
    });

    const pieceMap = new Map(pieces.map((p) => [p.id, p]));
    for (const id of pieceIds) {
      if (results.length >= MAX_SELECTED_PIECES) break;
      if (selectedIds.has(id)) continue;
      const piece = pieceMap.get(id);
      if (!piece) continue;
      selectedIds.add(piece.id);
      results.push(await this.mapToSelectedPiece(piece, locale));
    }
  }

  private async fillFromNewest(
    classId: string,
    locale: Locale,
    results: SelectedPiece[],
    selectedIds: Set<string>,
  ): Promise<void> {
    const newest = await this.prisma.db.piece.findMany({
      where: this.catalogWhere(classId, {
        id: { notIn: [...selectedIds] },
      }),
      include: { collection: true },
      orderBy: { createdAt: "desc" },
      take: MAX_SELECTED_PIECES * 2,
    });

    for (const piece of newest) {
      if (results.length >= MAX_SELECTED_PIECES) break;
      if (selectedIds.has(piece.id)) continue;
      selectedIds.add(piece.id);
      results.push(await this.mapToSelectedPiece(piece, locale));
    }
  }

  private async mapToSelectedPiece(
    piece: {
      slug: string;
      name: string;
      nameAr: string | null;
      imageUrls: string[];
      imageLqips: string[];
      price: { toString(): string };
      currency: string;
      collection: { name: string; nameAr: string | null; slug: string };
    },
    locale: Locale,
  ): Promise<SelectedPiece> {
    return {
      slug: piece.slug,
      name: pickLocalized(locale, piece.name, piece.nameAr),
      imageUrl: await this.storage.resolvePublicUrl(piece.imageUrls[0]),
      imageLqip: piece.imageLqips?.[0] ?? null,
      price: piece.price.toString(),
      currency: piece.currency,
      collectionName: pickLocalized(
        locale,
        piece.collection.name,
        piece.collection.nameAr,
      ),
      collectionSlug: piece.collection.slug,
    };
  }
}
