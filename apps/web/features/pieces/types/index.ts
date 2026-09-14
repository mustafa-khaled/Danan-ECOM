export interface PieceDetail {
  id: string;
  name: string;
  slug: string;
  serialNumber: string;
  status: string;
  imageUrls: string[];
  material: string;
  weight: number;
  dimensions: string;
  price: string;
  currency: string;
  story?: string;
  isSaved?: boolean;
  collection: {
    name: string;
    slug: string;
  };
  specifications: Array<{ key: string; value: string }>;
}
