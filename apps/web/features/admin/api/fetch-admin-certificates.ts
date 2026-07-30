import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminCertificateListItem } from "../types";

export function fetchAdminCertificates(
  page = 1,
  limit = 20,
  cookieHeader?: string,
) {
  return sendRequest<Paginated<AdminCertificateListItem>>({
    method: "GET",
    url: "/admin/certificates",
    params: { page, limit },
    cookieHeader,
  });
}

export function regenerateCertificate(
  pieceId: string,
  cookieHeader?: string,
) {
  return sendRequest<{ success: boolean }>({
    method: "POST",
    url: `/admin/certificates/regenerate/${pieceId}`,
    cookieHeader,
  });
}
