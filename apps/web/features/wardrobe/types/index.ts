export interface WardrobePiece {
  id: string;
  serialNumber: string;
  status: string;
  acquiredAt: string;
  name: string;
  slug: string;
  images: string[];
  collection: string;
  story?: string;
  material?: string;
  weight?: number;
  dimensions?: string;
  price?: string;
  currency?: string;
  imageUrls?: string[];
  specifications?: Array<{ key: string; value: string }>;
  activeTransfer?: {
    id: string;
  };
  ownershipHistory?: Array<{
    acquiredAt: string;
    acquisitionType: string;
  }>;
}

export interface MyCollectionItem {
  id: string;
  serialNumber: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  collection: string;
}

export interface OwnedCollectionItem extends MyCollectionItem {
  acquiredAt: string;
}

export interface SavedCollectionItem extends MyCollectionItem {
  savedAt: string;
  price: string;
  currency: string;
}

export interface MyCollection {
  owned: OwnedCollectionItem[];
  saved: SavedCollectionItem[];
}
