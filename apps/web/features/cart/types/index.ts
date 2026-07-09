export interface CartItem {
  id: string;
  expiresAt: string;
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
