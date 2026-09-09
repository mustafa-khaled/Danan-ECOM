import type { AdminOrderListItem } from "../../types";

export interface AdminPaymentListItem extends AdminOrderListItem {
  paymentMethod: string;
  paymentStatus: string;
}

export type PaymentStatusFilter = "all" | "PAID" | "PENDING" | "FAILED";

export type PaymentAmountFilter = "all" | "under500" | "500-1000" | "over1000";

export type PaymentMethodFilter = "all" | "CARD" | "MADA" | "APPLE_PAY";
