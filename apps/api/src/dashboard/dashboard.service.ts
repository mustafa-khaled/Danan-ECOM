import { Injectable } from "@nestjs/common";
import { PieceStatus } from "@dadan/db";
import { DashboardRepository } from "./dashboard.repository";

function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function fillMonths(
  rows: Array<{ period: Date; count: number }>,
  from: Date,
) {
  const map = new Map(
    rows.map((row) => [new Date(row.period).toISOString().slice(0, 7), row.count]),
  );
  const points: Array<{ period: string; count: number }> = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const end = new Date();
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 7);
    points.push({ period: key, count: map.get(key) ?? 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return points;
}

@Injectable()
export class DashboardService {
  constructor(private readonly repo: DashboardRepository) {}

  async getOverview() {
    const monthStart = this.repo.startOfUtcMonth();
    const last30d = this.repo.daysAgo(30);

    const [
      membersTotal,
      membersThisMonth,
      collectionsTotal,
      collectionsHidden,
      piecesTotal,
      piecesRecent,
      pendingTransfers,
      membershipRequests,
      certificatesReady,
      membership,
      collections,
    ] = await Promise.all([
      this.repo.countClients(),
      this.repo.countClients({ createdAt: { gte: monthStart } }),
      this.repo.countCollections(),
      this.repo.countCollections({ isVisible: false }),
      this.repo.countPieces(),
      this.repo.countPieces({ createdAt: { gte: last30d } }),
      this.repo.pendingReview(),
      this.repo.pendingMembershipRequests(),
      this.repo.countCertificatesReady(),
      this.repo.membershipByClass(),
      this.repo.topCollections(4),
    ]);

    return {
      stats: {
        members: { total: membersTotal, addedThisMonth: membersThisMonth },
        collections: { total: collectionsTotal, hidden: collectionsHidden },
        pieces: { total: piecesTotal, addedLast30d: piecesRecent },
        pendingTransfers: { total: pendingTransfers },
      },
      pendingActions: {
        transferRequests: pendingTransfers,
        membershipRequests,
        certificatesReady,
      },
      membership: membership.map((cls) => ({
        classId: cls.id,
        name: cls.name,
        clientCount: cls._count.clients,
      })),
      collections,
    };
  }

  async getAnalytics(period: "30d" | "12m" = "12m") {
    const bounds = this.repo.periodBounds(period);
    const activeSince = this.repo.daysAgo(30);

    const [
      members,
      previousMembers,
      activeMembers,
      previousActive,
      piecesOwned,
      previousOwned,
      revenue,
      previousRevenue,
      membersOverTime,
      [acquisitions, transfers, pending],
      collectionPerformance,
      membership,
    ] = await Promise.all([
      this.repo.countClients({ createdAt: { gte: bounds.from, lt: bounds.to } }),
      this.repo.countClients({
        createdAt: { gte: bounds.previousFrom, lt: bounds.previousTo },
      }),
      this.repo.countClients({ lastSeenAt: { gte: activeSince } }),
      this.repo.countClients({
        lastSeenAt: { gte: this.repo.daysAgo(60), lt: activeSince },
      }),
      this.repo.countPieces({ status: PieceStatus.OWNED }),
      this.repo.countPieces({
        status: PieceStatus.OWNED,
        updatedAt: { lt: bounds.from },
      }),
      this.repo.paidRevenue(bounds.from, bounds.to),
      this.repo.paidRevenue(bounds.previousFrom, bounds.previousTo),
      this.repo.monthlyClientCounts(bounds.from),
      this.repo.monthlyOwnership(bounds.from),
      this.repo.collectionPerformance(),
      this.repo.membershipByClass(),
    ]);

    const totalMembers = membership.reduce((sum, cls) => sum + cls._count.clients, 0);
    const acquisitionSeries = fillMonths(acquisitions, bounds.from);
    const transferSeries = fillMonths(transfers, bounds.from);
    const pendingSeries = fillMonths(pending, bounds.from);

    return {
      kpis: {
        members,
        activeMembers,
        piecesOwned,
        revenue,
        deltas: {
          members: delta(members, previousMembers),
          activeMembers: delta(activeMembers, previousActive),
          piecesOwned: delta(piecesOwned, previousOwned),
          revenue: delta(revenue, previousRevenue),
        },
      },
      membersOverTime: fillMonths(membersOverTime, bounds.from),
      ownershipOverTime: acquisitionSeries.map((row, index) => ({
        period: row.period,
        acquisitions: row.count,
        transfers: transferSeries[index]?.count ?? 0,
        pending: pendingSeries[index]?.count ?? 0,
      })),
      collectionPerformance,
      membershipDistribution: membership.map((cls) => ({
        classId: cls.id,
        name: cls.name,
        count: cls._count.clients,
        percentage: totalMembers === 0 ? 0 : Math.round((cls._count.clients / totalMembers) * 100),
      })),
    };
  }
}
