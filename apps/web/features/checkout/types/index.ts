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

export interface CheckoutInput {
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentToken: string;
}
