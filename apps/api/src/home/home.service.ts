import { Injectable } from "@nestjs/common";
import type { Locale } from "@dadan/types";
import { pickLocalized } from "../common/i18n/localize";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { VisibilityService } from "../visibility/visibility.service";

const MAX_SELECTED_PIECES = 4;

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

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly visibility: VisibilityService,
  ) {}

  async getSelectedForYou(
    clientGroups: string[],
    locale: Locale = "ar",
  ): Promise<SelectedPiece[]> {
    const collections = await this.prisma.db.collection.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      include: {
        designs: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          take: 10,
        },
      },
    });

    const visibleCollections = collections.filter((c) =>
      this.visibility.canAccess(clientGroups, c.visibilityGroups),
    );

    const selectedPieces: SelectedPiece[] = [];
    const selectedDesignIds = new Set<string>();

    for (const collection of visibleCollections.slice(0, 3)) {
      const visibleDesigns = collection.designs.filter((d) =>
        this.visibility.canAccess(clientGroups, d.visibilityGroups),
      );

      const design = visibleDesigns[0];
      if (design && !selectedDesignIds.has(design.id)) {
        selectedDesignIds.add(design.id);
        selectedPieces.push({
          designSlug: design.slug,
          name: pickLocalized(locale, design.name, design.nameAr),
          imageUrl: await this.storage.resolvePublicUrl(design.imageUrls[0]),
          imageLqip: design.imageLqips?.[0] ?? null,
          basePrice: design.basePrice.toString(),
          currency: design.currency,
          collectionName: pickLocalized(locale, collection.name, collection.nameAr),
          collectionSlug: collection.slug,
        });
      }
    }

    if (selectedPieces.length < MAX_SELECTED_PIECES && visibleCollections[0]) {
      const firstCollection = visibleCollections[0];
      const visibleDesigns = firstCollection.designs.filter((d) =>
        this.visibility.canAccess(clientGroups, d.visibilityGroups),
      );

      for (const design of visibleDesigns) {
        if (selectedPieces.length >= MAX_SELECTED_PIECES) break;
        if (selectedDesignIds.has(design.id)) continue;

        selectedDesignIds.add(design.id);
        selectedPieces.push({
          designSlug: design.slug,
          name: pickLocalized(locale, design.name, design.nameAr),
          imageUrl: await this.storage.resolvePublicUrl(design.imageUrls[0]),
          imageLqip: design.imageLqips?.[0] ?? null,
          basePrice: design.basePrice.toString(),
          currency: design.currency,
          collectionName: pickLocalized(locale, firstCollection.name, firstCollection.nameAr),
          collectionSlug: firstCollection.slug,
        });
      }
    }

    return selectedPieces;
  }
}
