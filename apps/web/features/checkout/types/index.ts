export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  phone: string;
}

export type PaymentMethod = "CARD" | "MADA" | "APPLE_PAY";

export interface CheckoutInput {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentToken: string;
}
