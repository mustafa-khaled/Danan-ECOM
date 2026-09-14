import { Test, TestingModule } from "@nestjs/testing";
import { DashboardService } from "../src/dashboard/dashboard.service";
import { DashboardRepository } from "../src/dashboard/dashboard.repository";

describe("DashboardService", () => {
  let service: DashboardService;

  const from = new Date("2026-01-01T00:00:00.000Z");
  const repoMock = {
    startOfUtcMonth: jest.fn().mockReturnValue(from),
    daysAgo: jest.fn().mockReturnValue(from),
    periodBounds: jest.fn().mockReturnValue({
      from,
      to: new Date("2026-09-01T00:00:00.000Z"),
      previousFrom: from,
      previousTo: from,
    }),
    countClients: jest.fn().mockResolvedValue(10),
    countCollections: jest.fn().mockResolvedValue(4),
    countPieces: jest.fn().mockResolvedValue(20),
    pendingReview: jest.fn().mockResolvedValue(3),
    pendingMembershipRequests: jest.fn().mockResolvedValue(2),
    countCertificatesReady: jest.fn().mockResolvedValue(1),
    membershipByClass: jest.fn().mockResolvedValue([
      { id: "a", name: "Class A", _count: { clients: 4 } },
      { id: "b", name: "Class B", _count: { clients: 6 } },
    ]),
    topCollections: jest.fn().mockResolvedValue([
      { id: "c1", name: "Heritage", pieceCount: 8, ownerCount: 3 },
    ]),
    paidRevenue: jest.fn().mockResolvedValue(1000),
    monthlyClientCounts: jest.fn().mockResolvedValue([]),
    monthlyOwnership: jest.fn().mockResolvedValue([[], [], []]),
    collectionPerformance: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DashboardRepository, useValue: repoMock },
      ],
    }).compile();

    service = module.get(DashboardService);
    jest.clearAllMocks();
    repoMock.countClients.mockResolvedValue(10);
    repoMock.countCollections.mockResolvedValue(4);
    repoMock.countPieces.mockResolvedValue(20);
    repoMock.pendingReview.mockResolvedValue(3);
    repoMock.pendingMembershipRequests.mockResolvedValue(2);
    repoMock.countCertificatesReady.mockResolvedValue(1);
    repoMock.membershipByClass.mockResolvedValue([
      { id: "a", name: "Class A", _count: { clients: 4 } },
      { id: "b", name: "Class B", _count: { clients: 6 } },
    ]);
    repoMock.topCollections.mockResolvedValue([
      { id: "c1", name: "Heritage", pieceCount: 8, ownerCount: 3 },
    ]);
    repoMock.paidRevenue.mockResolvedValue(1000);
    repoMock.monthlyClientCounts.mockResolvedValue([]);
    repoMock.monthlyOwnership.mockResolvedValue([[], [], []]);
    repoMock.collectionPerformance.mockResolvedValue([]);
  });

  it("aggregates overview without fetching member or piece rows", async () => {
    const overview = await service.getOverview();
    expect(overview.stats.members.total).toBe(10);
    expect(overview.pendingActions.transferRequests).toBe(3);
    expect(overview.membership).toEqual([
      { classId: "a", name: "Class A", clientCount: 4 },
      { classId: "b", name: "Class B", clientCount: 6 },
    ]);
    expect(overview.collections[0]?.ownerCount).toBe(3);
    expect(repoMock.topCollections).toHaveBeenCalledWith(4);
  });

  it("returns analytics kpis and membership percentages", async () => {
    const analytics = await service.getAnalytics("12m");
    expect(analytics.kpis.revenue).toBe(1000);
    expect(analytics.membershipDistribution[0]?.percentage).toBe(40);
    expect(analytics.membershipDistribution[1]?.percentage).toBe(60);
  });
});
