export interface DesignDetail {
  id: string;
  name: string;
  slug: string;
  imageUrls: string[];
  material: string;
  weight: number;
  dimensions: string;
  basePrice: string;
  currency: string;
  story?: string;
  collection: {
    name: string;
    slug: string;
  };
  specifications: Array<{ key: string; value: string }>;
  availablePieces: Array<{
    id: string;
    serialNumber: string;
    status: string;
  }>;
}
