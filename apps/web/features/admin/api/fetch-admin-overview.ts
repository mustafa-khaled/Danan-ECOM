import { sendRequest } from "@/shared/lib/send-request";

export interface AdminOverview {
  stats: {
    members: { total: number; addedThisMonth: number };
    collections: { total: number; hidden: number };
    pieces: { total: number; addedLast30d: number };
    pendingTransfers: { total: number };
  };
  pendingActions: {
    transferRequests: number;
    membershipRequests: number;
    certificatesReady: number;
  };
  membership: Array<{ classId: string; name: string; clientCount: number }>;
  collections: Array<{
    id: string;
    name: string;
    pieceCount: number;
    ownerCount: number;
  }>;
}

export function fetchAdminOverview(cookieHeader?: string) {
  return sendRequest<AdminOverview>({
    method: "GET",
    url: "/admin/overview",
    cookieHeader,
  });
}
