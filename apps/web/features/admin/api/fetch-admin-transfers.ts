import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminTransferListItem, AdminTransferDetail } from "../types";

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

export function fetchAdminTransferDetail(
  id: string,
  cookieHeader?: string,
) {
  return sendRequest<AdminTransferDetail>({
    method: "GET",
    url: `/admin/transfers/${id}`,
    cookieHeader,
  });
}

export function approveTransfer(id: string, cookieHeader?: string) {
  return sendRequest<{ success: boolean }>({
    method: "POST",
    url: `/admin/transfers/${id}/approve`,
    cookieHeader,
  });
}

export function rejectTransfer(id: string, cookieHeader?: string) {
  return sendRequest<{ success: boolean }>({
    method: "POST",
    url: `/admin/transfers/${id}/reject`,
    cookieHeader,
  });
}

export function contactSender(
  id: string,
  notes?: string,
  cookieHeader?: string,
) {
  return sendRequest<{ success: boolean }>({
    method: "POST",
    url: `/admin/transfers/${id}/contact-sender`,
    body: notes ? { notes } : undefined,
    cookieHeader,
  });
}

export function contactRecipient(
  id: string,
  notes?: string,
  cookieHeader?: string,
) {
  return sendRequest<{ success: boolean }>({
    method: "POST",
    url: `/admin/transfers/${id}/contact-recipient`,
    body: notes ? { notes } : undefined,
    cookieHeader,
  });
}
