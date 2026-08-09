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


export interface OwnedPieceItem {
  id: string;
  name: string;
  serialNumber?: string;
  imageUrl?: string | null;
  acquiredAt?: string;
  slug?: string;
}

export interface SavedPieceItem {
  id: string;
  name: string;
  serialNumber?: string;
  imageUrl?: string | null;
  collectionName?: string;
  price?: string;
  currency?: string;
  slug?: string;
}
