import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { OrderSummary } from "../types";

export function fetchOrders(cookieHeader?: string): Promise<Paginated<OrderSummary>> {
  return sendRequest<Paginated<OrderSummary>>({
    method: "GET",
    url: "/client/orders",
    cookieHeader,
  });
}
