export interface OrderSummary {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  placedAt: string;
  items: Array<{ piece: { serialNumber: string } }>;
}

export interface OrderDetail {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  placedAt: string;
  paymentProvider: string;
  paymentReference: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    region: string;
    country: string;
    postalCode: string;
    phone: string;
  };
  items: Array<{
    piece: {
      id: string;
      serialNumber: string;
    };
    design: {
      name: string;
      imageUrls: string[];
    };
    priceAtPurchase: string;
  }>;
}
