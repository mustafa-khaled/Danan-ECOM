import { sendRequest } from "@/shared/lib/send-request";

export interface AdminAnalytics {
  kpis: {
    members: number;
    activeMembers: number;
    piecesOwned: number;
    revenue: number;
    deltas: {
      members: number;
      activeMembers: number;
      piecesOwned: number;
      revenue: number;
    };
  };
  membersOverTime: Array<{ period: string; count: number }>;
  ownershipOverTime: Array<{
    period: string;
    acquisitions: number;
    transfers: number;
    pending: number;
  }>;
  collectionPerformance: Array<{
    id: string;
    name: string;
    views: number;
    saves: number;
    acquisitions: number;
  }>;
  membershipDistribution: Array<{
    classId: string;
    name: string;
    count: number;
    percentage: number;
  }>;
}

export function fetchAdminAnalytics(
  period: "30d" | "12m" = "12m",
  cookieHeader?: string,
) {
  return sendRequest<AdminAnalytics>({
    method: "GET",
    url: "/admin/analytics",
    params: { period },
    cookieHeader,
  });
}
