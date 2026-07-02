import type { AdminSession } from "@dadan/types";
import { apiFetch } from "./shared";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminClientListItem {
  id: string;
  displayName: string;
  email: string;
  houseKeyPrefix: string;
  isActive: boolean;
  visibilityGroups: string[];
  pieceCount: number;
}

export interface AdminPieceListItem {
  id: string;
  serialNumber: string;
  designName: string;
  collection: string;
  currentOwner: string | null;
  status: string;
}

export interface AdminOrderListItem {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  placedAt: string;
  client: { displayName: string; email: string };
  items: Array<{ piece: { serialNumber: string } }>;
}

export interface AdminTransferListItem {
  id: string;
  status: string;
  transferType: string;
  initiatedAt: string;
  needsReview?: boolean;
  piece: { serialNumber: string; design: { name: string; imageUrls: string[] } };
  fromClient: { displayName: string; email: string };
  toClient: { displayName: string; email: string };
}

export async function adminLogin(email: string, password: string): Promise<AdminSession> {
  return apiFetch<AdminSession>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchAdminMe(cookieHeader?: string): Promise<AdminSession> {
  return apiFetch<AdminSession>("/admin/auth/me", {}, cookieHeader);
}

export async function adminLogout(cookieHeader?: string) {
  return apiFetch<{ success: boolean }>(
    "/admin/auth/logout",
    { method: "POST" },
    cookieHeader,
  );
}

export async function fetchClients(page = 1, limit = 20, cookieHeader?: string) {
  return apiFetch<Paginated<AdminClientListItem>>(
    `/admin/clients?page=${page}&limit=${limit}`,
    {},
    cookieHeader,
  );
}

export async function fetchPieces(page = 1, limit = 20, cookieHeader?: string) {
  return apiFetch<Paginated<AdminPieceListItem>>(
    `/admin/pieces?page=${page}&limit=${limit}`,
    {},
    cookieHeader,
  );
}

export async function fetchOrders(page = 1, limit = 20, cookieHeader?: string) {
  return apiFetch<Paginated<AdminOrderListItem>>(
    `/admin/orders?page=${page}&limit=${limit}`,
    {},
    cookieHeader,
  );
}

export async function fetchTransfers(
  page = 1,
  limit = 20,
  status?: string,
  cookieHeader?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) params.set("status", status);

  return apiFetch<Paginated<AdminTransferListItem>>(
    `/admin/transfers?${params.toString()}`,
    {},
    cookieHeader,
  );
}
