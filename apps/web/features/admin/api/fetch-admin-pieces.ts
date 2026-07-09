import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminPieceListItem } from "../types";

export function fetchAdminPieces(page = 1, limit = 20, cookieHeader?: string) {
  return sendRequest<Paginated<AdminPieceListItem>>({
    method: "GET",
    url: "/admin/pieces",
    params: { page, limit },
    cookieHeader,
  });
}
