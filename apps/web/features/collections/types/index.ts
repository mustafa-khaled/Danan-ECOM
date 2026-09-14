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
  pieces: Array<{
    id: string;
    name: string;
    slug: string;
    serialNumber?: string;
    status?: string;
    imageUrls: string[];
    imageLqips?: string[];
    price: string;
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
