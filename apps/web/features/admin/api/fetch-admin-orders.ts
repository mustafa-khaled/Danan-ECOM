import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminOrderListItem, AdminOrderDetail } from "../types";

export function fetchAdminOrders(page = 1, limit = 20, cookieHeader?: string, status?: string) {
  return sendRequest<Paginated<AdminOrderListItem>>({
    method: "GET",
    url: "/admin/orders",
    params: { page, limit, status },
    cookieHeader,
  });
}

export function fetchAdminOrderDetail(id: string, cookieHeader?: string) {
  return sendRequest<AdminOrderDetail>({
    method: "GET",
    url: `/admin/orders/${id}`,
    cookieHeader,
  });
}
