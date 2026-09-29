import { Test, TestingModule } from "@nestjs/testing";
import { StaffRequestStatus, StaffRequestType } from "@dadan/db";
import { CollectionAccessSyncService } from "../src/collections/collection-access-sync.service";

describe("CollectionAccessSyncService", () => {
  let service: CollectionAccessSyncService;

  const tx = {
    staffRequest: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    collectionClass: {
      findMany: jest.fn(),
    },
    auditLog: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectionAccessSyncService],
    }).compile();

    service = module.get(CollectionAccessSyncService);
    jest.clearAllMocks();
    tx.staffRequest.findMany.mockResolvedValue([]);
    tx.collectionClass.findMany.mockResolvedValue([]);
  });

  // Cast once: the service only touches the three delegates mocked above.
  const asTx = () => tx as unknown as Parameters<
    CollectionAccessSyncService["syncForCollectionClasses"]
  >[0];

  describe("syncForCollectionClasses", () => {
    it("completes open requests whose requester is in a granted class", async () => {
      tx.staffRequest.findMany.mockResolvedValue([
        { id: "req-1", clientId: "client-1", collectionId: "col-1" },
        { id: "req-2", clientId: "client-2", collectionId: "col-1" },
      ]);

      const count = await service.syncForCollectionClasses(
        asTx(),
        "col-1",
        ["class-a", "class-b"],
        "admin-1",
      );

      expect(count).toBe(2);
      expect(tx.staffRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            collectionId: "col-1",
            client: { classId: { in: ["class-a", "class-b"] } },
            type: StaffRequestType.ACCESS_REQUEST,
            status: {
              in: [StaffRequestStatus.PENDING, StaffRequestStatus.UNDER_REVIEW],
            },
          }),
        }),
      );
      expect(tx.staffRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ["req-1", "req-2"] } },
          data: expect.objectContaining({
            status: StaffRequestStatus.COMPLETED,
            reviewedById: "admin-1",
          }),
        }),
      );
    });

    it("writes an audit row per completed request on the same transaction", async () => {
      tx.staffRequest.findMany.mockResolvedValue([
        { id: "req-1", clientId: "client-1", collectionId: "col-1" },
      ]);

      await service.syncForCollectionClasses(asTx(), "col-1", ["class-a"], "admin-1");

      expect(tx.auditLog.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            action: "STAFF_REQUEST_AUTO_COMPLETED",
            targetType: "StaffRequest",
            targetId: "req-1",
          }),
        ],
      });
    });

    it("does nothing when the collection is granted to no class", async () => {
      const count = await service.syncForCollectionClasses(
        asTx(),
        "col-1",
        [],
        "admin-1",
      );

      expect(count).toBe(0);
      expect(tx.staffRequest.findMany).not.toHaveBeenCalled();
      expect(tx.staffRequest.updateMany).not.toHaveBeenCalled();
    });

    it("does not update anything when no request is satisfied", async () => {
      const count = await service.syncForCollectionClasses(
        asTx(),
        "col-1",
        ["class-a"],
        "admin-1",
      );

      expect(count).toBe(0);
      expect(tx.staffRequest.updateMany).not.toHaveBeenCalled();
      expect(tx.auditLog.createMany).not.toHaveBeenCalled();
    });
  });

  describe("syncForClientClass", () => {
    it("completes the member's requests for collections their new class can see", async () => {
      tx.collectionClass.findMany.mockResolvedValue([
        { collectionId: "col-1" },
        { collectionId: "col-2" },
      ]);
      tx.staffRequest.findMany.mockResolvedValue([
        { id: "req-1", clientId: "client-1", collectionId: "col-2" },
      ]);

      const count = await service.syncForClientClass(
        asTx(),
        "client-1",
        "class-a",
        "admin-1",
      );

      expect(count).toBe(1);
      expect(tx.staffRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId: "client-1",
            collectionId: { in: ["col-1", "col-2"] },
          }),
        }),
      );
    });

    it("does nothing when the new class has no collection access", async () => {
      const count = await service.syncForClientClass(
        asTx(),
        "client-1",
        "class-a",
        "admin-1",
      );

      expect(count).toBe(0);
      expect(tx.staffRequest.findMany).not.toHaveBeenCalled();
    });
  });
});
