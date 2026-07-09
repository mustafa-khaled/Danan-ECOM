import { sendRequest } from "@/shared/lib/send-request";
import type { OrderDetail } from "../types";

export function fetchOrder(orderId: string, cookieHeader?: string): Promise<OrderDetail> {
  return sendRequest<OrderDetail>({
    method: "GET",
    url: `/client/orders/${orderId}`,
    cookieHeader,
  });
}
