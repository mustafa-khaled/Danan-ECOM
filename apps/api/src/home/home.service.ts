import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import type { Locale } from "@dadan/types";
import { pickLocalized } from "../common/i18n/localize";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { StorageService } from "../storage/storage.service";
import { VisibilityService } from "../visibility/visibility.service";

const MAX_SELECTED_PIECES = 3;
const POPULAR_CACHE_TTL_SECONDS = 300;

export interface SelectedPiece {
  designSlug: string;
  name: string;
  imageUrl: string | null;
  imageLqip: string | null;
  basePrice: string;
  currency: string;
  collectionName: string;
  collectionSlug: string;
}

interface DesignWithCollection {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  imageUrls: string[];
  imageLqips: string[];
  basePrice: { toString(): string };
  currency: string;
  visibilityGroups: string[];
  collection: {
    name: string;
    nameAr: string | null;
    slug: string;
    visibilityGroups: string[];
  };
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
    clientGroups: string[],
    locale: Locale = "ar",
  ): Promise<SelectedPiece[]> {
    const results: SelectedPiece[] = [];
    const selectedDesignIds = new Set<string>();

    await this.fillFromSavedPieces(clientId, clientGroups, locale, results, selectedDesignIds);
    if (results.length >= MAX_SELECTED_PIECES) return results;

    await this.fillFromPastOrders(clientId, clientGroups, locale, results, selectedDesignIds);
    if (results.length >= MAX_SELECTED_PIECES) return results;

    await this.fillFromPopular(clientGroups, locale, results, selectedDesignIds);
    if (results.length >= MAX_SELECTED_PIECES) return results;

    await this.fillFromNewest(clientGroups, locale, results, selectedDesignIds);

    return results;
  }

  // --- Level 1: Designs from collections the user has saved pieces from ---
  private async fillFromSavedPieces(
    clientId: string,
    clientGroups: string[],
    locale: Locale,
    results: SelectedPiece[],
    selectedDesignIds: Set<string>,
  ): Promise<void> {
    const savedPieces = await this.prisma.db.savedPiece.findMany({
      where: { clientId },
      include: { piece: { include: { design: true } } },
      orderBy: { savedAt: "desc" },
      take: 10,
    });

    if (savedPieces.length === 0) return;

    const savedDesignIds = new Set(savedPieces.map((sp) => sp.piece.designId));
    const interestedCollectionIds = [
      ...new Set(savedPieces.map((sp) => sp.piece.design.collectionId)),
    ];

    const relatedDesigns = await this.prisma.db.design.findMany({
      where: {
        collectionId: { in: interestedCollectionIds },
        isActive: true,
        id: { notIn: [...savedDesignIds] },
      },
      include: { collection: true },
      take: MAX_SELECTED_PIECES * 2,
    });

    for (const design of relatedDesigns) {
      if (results.length >= MAX_SELECTED_PIECES) break;
      if (selectedDesignIds.has(design.id)) continue;
      if (!this.visibility.canAccess(clientGroups, design.visibilityGroups)) continue;
      if (!this.visibility.canAccess(clientGroups, design.collection.visibilityGroups)) continue;

      selectedDesignIds.add(design.id);
      results.push(await this.mapToSelectedPiece(design, locale));
    }
  }

  // --- Level 2: Designs from collections the user has ordered from ---
  private async fillFromPastOrders(
    clientId: string,
    clientGroups: string[],
    locale: Locale,
    results: SelectedPiece[],
    selectedDesignIds: Set<string>,
  ): Promise<void> {
    const orderItems = await this.prisma.db.orderItem.findMany({
      where: {
        order: { clientId, status: { in: ["PAID", "FULFILLED"] } },
      },
      include: { design: true },
      take: 10,
    });

    if (orderItems.length === 0) return;

    const purchasedDesignIds = new Set(orderItems.map((oi) => oi.designId));
    const purchasedCollectionIds = [
      ...new Set(orderItems.map((oi) => oi.design.collectionId)),
    ];

    const relatedDesigns = await this.prisma.db.design.findMany({
      where: {
        collectionId: { in: purchasedCollectionIds },
        isActive: true,
        id: { notIn: [...purchasedDesignIds, ...selectedDesignIds] },
      },
      include: { collection: true },
      take: MAX_SELECTED_PIECES * 2,
    });

    for (const design of relatedDesigns) {
      if (results.length >= MAX_SELECTED_PIECES) break;
      if (selectedDesignIds.has(design.id)) continue;
      if (!this.visibility.canAccess(clientGroups, design.visibilityGroups)) continue;
      if (!this.visibility.canAccess(clientGroups, design.collection.visibilityGroups)) continue;

      selectedDesignIds.add(design.id);
      results.push(await this.mapToSelectedPiece(design, locale));
    }
  }

  // --- Level 3: Most popular designs globally (cached in Redis) ---
  private async fillFromPopular(
    clientGroups: string[],
    locale: Locale,
    results: SelectedPiece[],
    selectedDesignIds: Set<string>,
  ): Promise<void> {
    const groupsHash = createHash("md5")
      .update(clientGroups.slice().sort().join(","))
      .digest("hex")
      .slice(0, 12);
    const cacheKey = `home:popular-designs:${groupsHash}`;

    let designIds: string[] | null = null;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      designIds = JSON.parse(cached) as string[];
    } else {
      const popular = await this.prisma.db.design.findMany({
        where: { isActive: true },
        include: { collection: true, _count: { select: { orderItems: true } } },
        orderBy: { orderItems: { _count: "desc" } },
        take: 10,
      });

      const visible = popular.filter(
        (d) =>
          this.visibility.canAccess(clientGroups, d.visibilityGroups) &&
          this.visibility.canAccess(clientGroups, d.collection.visibilityGroups),
      );

      designIds = visible.map((d) => d.id);
      await this.redis.setWithExpiry(cacheKey, JSON.stringify(designIds), POPULAR_CACHE_TTL_SECONDS);
    }

    if (designIds.length === 0) return;

    const designs = await this.prisma.db.design.findMany({
      where: { id: { in: designIds }, isActive: true },
      include: { collection: true },
    });

    const designMap = new Map(designs.map((d) => [d.id, d]));
    for (const id of designIds) {
      if (results.length >= MAX_SELECTED_PIECES) break;
      if (selectedDesignIds.has(id)) continue;

      const design = designMap.get(id);
      if (!design) continue;
      if (!this.visibility.canAccess(clientGroups, design.visibilityGroups)) continue;
      if (!this.visibility.canAccess(clientGroups, design.collection.visibilityGroups)) continue;

      selectedDesignIds.add(design.id);
      results.push(await this.mapToSelectedPiece(design, locale));
    }
  }

  // --- Level 4: Newest designs (final fallback) ---
  private async fillFromNewest(
    clientGroups: string[],
    locale: Locale,
    results: SelectedPiece[],
    selectedDesignIds: Set<string>,
  ): Promise<void> {
    const newest = await this.prisma.db.design.findMany({
      where: {
        isActive: true,
        id: { notIn: [...selectedDesignIds] },
      },
      include: { collection: true },
      orderBy: { createdAt: "desc" },
      take: MAX_SELECTED_PIECES * 2,
    });

    for (const design of newest) {
      if (results.length >= MAX_SELECTED_PIECES) break;
      if (selectedDesignIds.has(design.id)) continue;
      if (!this.visibility.canAccess(clientGroups, design.visibilityGroups)) continue;
      if (!this.visibility.canAccess(clientGroups, design.collection.visibilityGroups)) continue;

      selectedDesignIds.add(design.id);
      results.push(await this.mapToSelectedPiece(design, locale));
    }
  }

  private async mapToSelectedPiece(
    design: DesignWithCollection,
    locale: Locale,
  ): Promise<SelectedPiece> {
    return {
      designSlug: design.slug,
      name: pickLocalized(locale, design.name, design.nameAr),
      imageUrl: await this.storage.resolvePublicUrl(design.imageUrls[0]),
      imageLqip: design.imageLqips?.[0] ?? null,
      basePrice: design.basePrice.toString(),
      currency: design.currency,
      collectionName: pickLocalized(locale, design.collection.name, design.collection.nameAr),
      collectionSlug: design.collection.slug,
    };
  }
}
