import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminPieceListItem, AdminPieceDetail } from "../types";

export function fetchAdminPieces(page = 1, limit = 20, cookieHeader?: string, search?: string) {
  return sendRequest<Paginated<AdminPieceListItem>>({
    method: "GET",
    url: "/admin/pieces",
    params: { page, limit, q: search },
    cookieHeader,
  });
}

export function fetchAdminPieceDetail(id: string, cookieHeader?: string) {
  return sendRequest<AdminPieceDetail>({
    method: "GET",
    url: `/admin/pieces/${id}`,
    cookieHeader,
  });
}

export interface RegisterPieceInput {
  designId: string;
  notes?: string;
  initialClientId?: string;
}

export function registerPiece(data: RegisterPieceInput, cookieHeader?: string) {
  return sendRequest<AdminPieceDetail>({
    method: "POST",
    url: "/admin/pieces",
    body: data,
    cookieHeader,
  });
}

export interface UpdatePieceInput {
  status?: string;
  notes?: string;
}

export function updatePiece(id: string, data: UpdatePieceInput, cookieHeader?: string) {
  return sendRequest<AdminPieceDetail>({
    method: "PATCH",
    url: `/admin/pieces/${id}`,
    body: data,
    cookieHeader,
  });
}

export interface AssignPieceInput {
  clientId: string;
  acquisitionType?: string;
  notes?: string;
}

export function assignPiece(id: string, data: AssignPieceInput, cookieHeader?: string) {
  return sendRequest<AdminPieceDetail>({
    method: "POST",
    url: `/admin/pieces/${id}/assign`,
    body: data,
    cookieHeader,
  });
}
