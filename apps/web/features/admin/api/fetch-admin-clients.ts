import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminClientListItem } from "../types";

export function fetchAdminClients(page = 1, limit = 20, cookieHeader?: string) {
  return sendRequest<Paginated<AdminClientListItem>>({
    method: "GET",
    url: "/admin/clients",
    params: { page, limit },
    cookieHeader,
  });
}
