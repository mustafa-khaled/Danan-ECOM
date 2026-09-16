export interface CartItem {
  id: string;
  addedAt: string;
  piece?: {
    id: string;
    serialNumber: string;
    name: string;
    price: string;
    currency: string;
    mainImageUrl?: string | null;
    mainImageLqip?: string | null;
    collection: {
      name: string;
    };
  };
}

export interface CartSummary {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: string;
  itemCount: number;
}

export interface CartResponse {
  items: CartItem[];
  summary: CartSummary;
}
