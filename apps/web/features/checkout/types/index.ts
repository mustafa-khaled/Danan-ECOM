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

export interface CheckoutPaidResponse {
  status: "paid";
  orderId: string;
  orderStatus: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  pieceSerials: string[];
}

/**
 * The card needs 3-D Secure. The browser must navigate to `redirectUrl`; the
 * bank sends the cardholder back to /beta/checkout/return afterwards.
 */
export interface CheckoutRedirectResponse {
  status: "requires_action";
  orderId: string;
  redirectUrl: string;
}

export type CheckoutResponse = CheckoutPaidResponse | CheckoutRedirectResponse;

export interface CheckoutConfirmation {
  /** `pending` means Tap has not settled yet and the webhook will finish it. */
  status: "paid" | "pending" | "failed";
  orderId: string;
}
