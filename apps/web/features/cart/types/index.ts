export interface CartItem {
  id: string;
  addedAt: string;
  piece?: {
    id: string;
    serialNumber: string;
    design: {
      name: string;
      basePrice: string;
      currency: string;
      imageUrls: string[];
      collection: {
        name: string;
      };
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
