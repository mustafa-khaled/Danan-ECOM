import { Test, TestingModule } from "@nestjs/testing";
import { StaffRequestStatus, StaffRequestType } from "@dadan/db";
import { ClientsService } from "../src/clients/clients.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuditService } from "../src/audit/audit.service";
import { AuthService } from "../src/auth/auth.service";
import { ClassesService } from "../src/classes/classes.service";
import { StorageService } from "../src/storage/storage.service";
import { CollectionAccessSyncService } from "../src/collections/collection-access-sync.service";

describe("ClientsService.listClients", () => {
  let service: ClientsService;
  const prismaMock = {
    db: {
      client: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      collectionClass: { findMany: jest.fn() },
      staffRequest: { findMany: jest.fn() },
    },
  };

  function clientRow(overrides: Record<string, unknown> = {}) {
    return {
      id: "client-1",
      houseId: "A7X9B2",
      displayName: "Amira",
      email: "amira@example.com",
      phone: null,
      houseKeyPrefix: "dada",
      isActive: true,
      classId: "class-a",
      createdAt: new Date(),
      lastSeenAt: null,
      class: { id: "class-a", slug: "vip", name: "VIP", nameAr: null },
      _count: { ownedPieces: 0 },
      ...overrides,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: AuthService, useValue: {} },
        { provide: ClassesService, useValue: {} },
        {
          provide: StorageService,
          useValue: {
            resolvePublicUrlsBatch: jest.fn().mockResolvedValue(new Map()),
          },
        },
        {
          provide: CollectionAccessSyncService,
          useValue: {
            syncForClientClass: jest.fn().mockResolvedValue(0),
            syncForCollectionClasses: jest.fn().mockResolvedValue(0),
          },
        },
      ],
    }).compile();

    service = module.get(ClientsService);
    jest.clearAllMocks();
    prismaMock.db.client.findMany.mockResolvedValue([]);
    prismaMock.db.client.count.mockResolvedValue(0);
    prismaMock.db.collectionClass.findMany.mockResolvedValue([]);
    prismaMock.db.staffRequest.findMany.mockResolvedValue([]);
  });

  it("filters by prefix search and class", async () => {
    await service.listClients(1, 20, { q: "Amira", classId: "class-a", isActive: true });
    expect(prismaMock.db.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: expect.arrayContaining([
            { classId: "class-a" },
            { isActive: true },
            {
              OR: expect.arrayContaining([
                { displayName: { startsWith: "Amira", mode: "insensitive" } },
              ]),
            },
          ]),
        },
      }),
    );
  });

  it("keeps the search and the collection scope as separate AND conditions", async () => {
    prismaMock.db.collectionClass.findMany.mockResolvedValue([
      { classId: "class-a" },
    ]);

    await service.listClients(1, 20, { collectionId: "col-1", q: "Amira" });

    const { where } = prismaMock.db.client.findMany.mock.calls[0][0];
    // Two independent OR groups: one for access, one for the search. A flat
    // object would have let the search overwrite the access scope.
    const orGroups = where.AND.filter(
      (condition: Record<string, unknown>) => "OR" in condition,
    );
    expect(orGroups).toHaveLength(2);
  });

  it("includes members with an open request, not just granted classes", async () => {
    prismaMock.db.collectionClass.findMany.mockResolvedValue([
      { classId: "class-a" },
    ]);

    await service.listClients(1, 20, { collectionId: "col-1" });

    const { where } = prismaMock.db.client.findMany.mock.calls[0][0];
    expect(where.AND).toEqual([
      {
        OR: [
          { classId: { in: ["class-a"] } },
          {
            staffRequests: {
              some: {
                collectionId: "col-1",
                type: StaffRequestType.ACCESS_REQUEST,
                status: {
                  in: [
                    StaffRequestStatus.PENDING,
                    StaffRequestStatus.UNDER_REVIEW,
                  ],
                },
              },
            },
          },
        ],
      },
    ]);
  });

  it("still lists requesters when the collection is granted to no class", async () => {
    prismaMock.db.collectionClass.findMany.mockResolvedValue([]);

    await service.listClients(1, 20, { collectionId: "col-1" });

    const { where } = prismaMock.db.client.findMany.mock.calls[0][0];
    expect(where.AND[0].OR).toHaveLength(1);
    expect(where.AND[0].OR[0]).toHaveProperty("staffRequests");
  });

  describe("accessStatus", () => {
    it("reports GRANTED when the member's class has access", async () => {
      prismaMock.db.collectionClass.findMany.mockResolvedValue([
        { classId: "class-a" },
      ]);
      prismaMock.db.client.findMany.mockResolvedValue([clientRow()]);

      const result = await service.listClients(1, 20, { collectionId: "col-1" });

      expect(result.items[0]).toMatchObject({ accessStatus: "GRANTED" });
    });

    it("reports PENDING only when there is no class grant", async () => {
      prismaMock.db.collectionClass.findMany.mockResolvedValue([
        { classId: "class-other" },
      ]);
      prismaMock.db.client.findMany.mockResolvedValue([clientRow()]);
      prismaMock.db.staffRequest.findMany.mockResolvedValue([
        { clientId: "client-1" },
      ]);

      const result = await service.listClients(1, 20, { collectionId: "col-1" });

      expect(result.items[0]).toMatchObject({ accessStatus: "PENDING" });
    });

    it("prefers a live class grant over a stale open request", async () => {
      prismaMock.db.collectionClass.findMany.mockResolvedValue([
        { classId: "class-a" },
      ]);
      prismaMock.db.client.findMany.mockResolvedValue([clientRow()]);
      prismaMock.db.staffRequest.findMany.mockResolvedValue([
        { clientId: "client-1" },
      ]);

      const result = await service.listClients(1, 20, { collectionId: "col-1" });

      // The review finding: granted access must never display as Pending.
      expect(result.items[0]).toMatchObject({ accessStatus: "GRANTED" });
    });

    it("reports REVOKED for an inactive member with class access", async () => {
      prismaMock.db.collectionClass.findMany.mockResolvedValue([
        { classId: "class-a" },
      ]);
      prismaMock.db.client.findMany.mockResolvedValue([
        clientRow({ isActive: false }),
      ]);

      const result = await service.listClients(1, 20, { collectionId: "col-1" });

      expect(result.items[0]).toMatchObject({ accessStatus: "REVOKED" });
    });

    it("omits accessStatus when the list is not scoped to a collection", async () => {
      prismaMock.db.client.findMany.mockResolvedValue([clientRow()]);

      const result = await service.listClients(1, 20, {});

      expect(result.items[0]).not.toHaveProperty("accessStatus");
      expect(prismaMock.db.staffRequest.findMany).not.toHaveBeenCalled();
    });

    it("resolves pending members with a single query for the whole page", async () => {
      prismaMock.db.collectionClass.findMany.mockResolvedValue([
        { classId: "class-a" },
      ]);
      prismaMock.db.client.findMany.mockResolvedValue([
        clientRow({ id: "client-1" }),
        clientRow({ id: "client-2" }),
        clientRow({ id: "client-3" }),
      ]);

      await service.listClients(1, 20, { collectionId: "col-1" });

      expect(prismaMock.db.staffRequest.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.db.staffRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId: { in: ["client-1", "client-2", "client-3"] },
          }),
        }),
      );
    });
  });
});
