import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminOrderListItem } from "../types";

export function fetchAdminOrders(page = 1, limit = 20, cookieHeader?: string) {
  return sendRequest<Paginated<AdminOrderListItem>>({
    method: "GET",
    url: "/admin/orders",
    params: { page, limit },
    cookieHeader,
  });
}
