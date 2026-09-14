import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";
import type { AdminPieceListItem, AdminPieceDetail } from "../types";

export function fetchAdminPieces(
  page = 1,
  limit = 20,
  cookieHeader?: string,
  collectionId?: string,
  status?: string,
  q?: string,
) {
  return sendRequest<Paginated<AdminPieceListItem>>({
    method: "GET",
    url: "/admin/pieces",
    params: { page, limit, collectionId, status, q },
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
  collectionId: string;
  name: string;
  nameAr: string;
  slug: string;
  story: string;
  storyAr: string;
  material: string;
  materialAr?: string;
  weight: number;
  dimensions: string;
  dimensionsAr?: string;
  price: number;
  currency?: string;
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
  isActive?: boolean;
  name?: string;
  nameAr?: string;
  story?: string;
  storyAr?: string;
  material?: string;
  weight?: number;
  dimensions?: string;
  price?: number;
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
