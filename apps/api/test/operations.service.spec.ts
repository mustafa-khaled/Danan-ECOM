import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AdminRole, StaffRequestStatus, StaffRequestType } from "@dadan/db";
import { OperationsService } from "../src/operations/operations.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { ClientsService } from "../src/clients/clients.service";
import { AuditService } from "../src/audit/audit.service";

describe("OperationsService", () => {
  let service: OperationsService;

  const txMock = {
    client: { update: jest.fn(), findUnique: jest.fn() },
    collectionClass: { upsert: jest.fn() },
    staffRequest: { update: jest.fn() },
  };

  const prismaMock = {
    db: {
      staffRequest: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      client: { findUnique: jest.fn() },
      $transaction: jest.fn((fn: (tx: typeof txMock) => unknown) => fn(txMock)),
    },
  };
  const clientsMock = { rotateKey: jest.fn().mockResolvedValue({ houseKey: "new-key" }) };
  const auditMock = { log: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ClientsService, useValue: clientsMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get(OperationsService);
    jest.clearAllMocks();
  });

  it("upgrades membership class on approve", async () => {
    prismaMock.db.staffRequest.findUnique.mockResolvedValue({
      id: "req-1",
      type: StaffRequestType.MEMBERSHIP_UPGRADE,
      status: StaffRequestStatus.PENDING,
      clientId: "client-1",
      targetClassId: "class-a",
    });

    await service.approve("admin-1", "req-1", "ok");

    expect(txMock.client.update).toHaveBeenCalledWith({
      where: { id: "client-1" },
      data: { classId: "class-a" },
    });
    expect(txMock.staffRequest.update).toHaveBeenCalled();
  });

  it("rejects already completed requests", async () => {
    prismaMock.db.staffRequest.findUnique.mockResolvedValue({
      id: "req-1",
      type: StaffRequestType.ACCESS_REQUEST,
      status: StaffRequestStatus.COMPLETED,
    });

    await expect(service.approve("admin-1", "req-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rotates a house key only for super admins", async () => {
    prismaMock.db.staffRequest.findUnique.mockResolvedValue({
      id: "req-1",
      type: StaffRequestType.KEY_ISSUANCE,
      status: StaffRequestStatus.PENDING,
      clientId: "client-1",
    });

    await expect(
      service.approve("admin-1", "req-1", undefined, undefined, AdminRole.STAFF),
    ).rejects.toThrow("Insufficient permissions");

    const result = await service.approve(
      "admin-1",
      "req-1",
      undefined,
      undefined,
      AdminRole.SUPER_ADMIN,
    );
    expect(clientsMock.rotateKey).toHaveBeenCalledWith("admin-1", "client-1", undefined);
    expect(result.houseKey).toBe("new-key");
  });
});
