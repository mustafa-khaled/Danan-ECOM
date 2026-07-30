import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminVerificationLogItem } from "../types";

export function fetchAdminVerificationLogs(
  page = 1,
  limit = 20,
  cookieHeader?: string,
) {
  return sendRequest<Paginated<AdminVerificationLogItem>>({
    method: "GET",
    url: "/admin/verification-logs",
    params: { page, limit },
    cookieHeader,
  });
}
