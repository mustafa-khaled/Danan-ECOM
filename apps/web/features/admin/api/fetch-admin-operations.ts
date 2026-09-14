import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";

export interface AdminOperationListItem {
  id: string;
  kind: "transfer" | "staff";
  requestNumber: string;
  title: string;
  type: string;
  transferType: string;
  memberName: string;
  memberEmail: string;
  date: string;
  status: string;
  pieceName?: string;
}

export function fetchAdminOperations(
  page = 1,
  limit = 20,
  cookieHeader?: string,
  filters?: { q?: string; type?: string; status?: string },
) {
  return sendRequest<Paginated<AdminOperationListItem>>({
    method: "GET",
    url: "/admin/operations",
    params: { page, limit, ...filters },
    cookieHeader,
  });
}

export function fetchAdminOperationsStats(cookieHeader?: string) {
  return sendRequest<{
    pending: number;
    transfers: number;
    access: number;
    completed: number;
  }>({
    method: "GET",
    url: "/admin/operations/stats",
    cookieHeader,
  });
}

export function fetchAdminOperationDetail(
  id: string,
  kind?: "transfer" | "staff",
  cookieHeader?: string,
) {
  return sendRequest<Record<string, unknown>>({
    method: "GET",
    url: `/admin/operations/${id}`,
    params: { kind },
    cookieHeader,
  });
}

export function approveStaffRequest(id: string, notes?: string) {
  return sendRequest<{ success: boolean; houseKey?: string }>({
    method: "POST",
    url: `/admin/operations/staff-requests/${id}/approve`,
    body: { notes },
  });
}

export function rejectStaffRequest(id: string, notes?: string) {
  return sendRequest<{ id: string }>({
    method: "POST",
    url: `/admin/operations/staff-requests/${id}/reject`,
    body: { notes },
  });
}
