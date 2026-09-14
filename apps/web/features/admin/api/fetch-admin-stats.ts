import { sendRequest } from "@/shared/lib/send-request";

export function fetchAdminCollectionStats(cookieHeader?: string) {
  return sendRequest<{
    members: number;
    collections: number;
    hidden: number;
    pieces: number;
    pendingTransfers: number;
  }>({
    method: "GET",
    url: "/admin/collections/stats",
    cookieHeader,
  });
}

export function fetchAdminClientStats(cookieHeader?: string) {
  return sendRequest<{
    total: number;
    byClass: Array<{ classId: string; name: string; slug: string | null; count: number }>;
  }>({
    method: "GET",
    url: "/admin/clients/stats",
    cookieHeader,
  });
}

export function fetchAdminPieceStats(collectionId?: string, cookieHeader?: string) {
  return sendRequest<{
    total: number;
    published: number;
    drafts: number;
    archived: number;
  }>({
    method: "GET",
    url: "/admin/pieces/stats",
    params: { collectionId },
    cookieHeader,
  });
}

export function fetchAdminOrderStats(cookieHeader?: string) {
  return sendRequest<{
    totalRevenue: number;
    successful: number;
    pending: number;
    refunded: number;
  }>({
    method: "GET",
    url: "/admin/orders/stats",
    cookieHeader,
  });
}
