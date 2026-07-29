export interface CollectionSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  coverImageLqip?: string | null;
  pieceCount: number;
}

export interface CollectionDetail extends CollectionSummary {
  designs: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrls: string[];
    imageLqips?: string[];
    basePrice: string;
    currency: string;
  }>;
}
