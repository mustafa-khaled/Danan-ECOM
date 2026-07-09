import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminTransferListItem } from "../types";

export function fetchAdminTransfers(
  page = 1,
  limit = 20,
  status?: string,
  cookieHeader?: string,
) {
  return sendRequest<Paginated<AdminTransferListItem>>({
    method: "GET",
    url: "/admin/transfers",
    params: { page, limit, status },
    cookieHeader,
  });
}
