export interface CollectionSummary {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  description?: string | null;
  descriptionAr?: string | null;
  coverImageUrl?: string | null;
  coverImageLqip?: string | null;
  pieceCount: number;
}

export interface CollectionDetail extends CollectionSummary {
  pieces: Array<{
    id: string;
    name: string;
    nameAr?: string | null;
    slug: string;
    serialNumber?: string;
    status?: string;
    mainImageUrl?: string | null;
    mainImageLqip?: string | null;
    material?: string | null;
    materialAr?: string | null;
    price: string;
    currency: string;
  }>;
}
