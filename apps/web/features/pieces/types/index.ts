export interface PieceDetail {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  serialNumber: string;
  status: string;
  mainImageUrl?: string | null;
  mainImageLqip?: string | null;
  imageUrls: string[];
  imageLqips?: string[];
  material: string;
  materialAr?: string | null;
  weight: number;
  dimensions: string;
  dimensionsAr?: string | null;
  price: string;
  currency: string;
  story?: string | null;
  storyAr?: string | null;
  isSaved?: boolean;
  collection: {
    name: string;
    nameAr?: string | null;
    slug: string;
  };
  specifications: Array<{
    key: string;
    keyAr?: string | null;
    value: string;
    valueAr?: string | null;
  }>;
}
