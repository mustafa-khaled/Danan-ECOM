import { sendRequest } from "@/shared/lib/send-request";
import type { Paginated } from "@/shared/types/common";

export interface AdminOwnershipListItem {
  id: string;
  pieceId: string;
  pieceName: string;
  pieceSerial: string;
  pieceImageUrl: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  collectionName: string;
  status: "OWNED" | "IN_TRANSFER" | "PENDING" | "AVAILABLE";
  transferType: string | null;
  since: string | null;
}

export interface AdminOwnershipStats {
  owned: number;
  transfers: number;
  pendingTransfers: number;
  available: number;
}

export function fetchAdminOwnership(
  page = 1,
  limit = 20,
  cookieHeader?: string,
  filters?: { q?: string; status?: string; collectionId?: string },
) {
  return sendRequest<Paginated<AdminOwnershipListItem>>({
    method: "GET",
    url: "/admin/ownership",
    params: { page, limit, ...filters },
    cookieHeader,
  });
}

export function fetchAdminOwnershipStats(cookieHeader?: string) {
  return sendRequest<AdminOwnershipStats>({
    method: "GET",
    url: "/admin/ownership/stats",
    cookieHeader,
  });
}

export function fetchAdminOwnershipDetail(pieceId: string, cookieHeader?: string) {
  return sendRequest<{
    id: string;
    name: string;
    serialNumber: string;
    status: string;
    currentOwner: { displayName: string; email: string } | null;
    collection: { name: string };
    ownershipRecords: Array<{
      id: string;
      acquiredAt: string;
      transferredAt: string | null;
      client: { displayName: string };
    }>;
    activeTransfer: {
      id: string;
      status: string;
      transferType: string;
      initiatedAt: string;
      fromClient: { displayName: string };
      toClient: { displayName: string };
    } | null;
  }>({
    method: "GET",
    url: `/admin/ownership/${pieceId}`,
    cookieHeader,
  });
}
