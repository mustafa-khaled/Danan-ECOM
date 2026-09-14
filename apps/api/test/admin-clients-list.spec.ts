import { Test, TestingModule } from "@nestjs/testing";
import { ClientsService } from "../src/clients/clients.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuditService } from "../src/audit/audit.service";
import { AuthService } from "../src/auth/auth.service";
import { ClassesService } from "../src/classes/classes.service";

describe("ClientsService.listClients", () => {
  let service: ClientsService;
  const prismaMock = {
    db: {
      client: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      collectionClass: { findMany: jest.fn() },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: AuthService, useValue: {} },
        { provide: ClassesService, useValue: {} },
      ],
    }).compile();

    service = module.get(ClientsService);
    jest.clearAllMocks();
    prismaMock.db.client.findMany.mockResolvedValue([]);
    prismaMock.db.client.count.mockResolvedValue(0);
  });

  it("filters by prefix search and class", async () => {
    await service.listClients(1, 20, { q: "Amira", classId: "class-a", isActive: true });
    expect(prismaMock.db.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          classId: { in: ["class-a"] },
          isActive: true,
          OR: expect.arrayContaining([
            { displayName: { startsWith: "Amira", mode: "insensitive" } },
          ]),
        }),
      }),
    );
  });

  it("returns empty when collection has no class access", async () => {
    prismaMock.db.collectionClass.findMany.mockResolvedValue([]);
    const result = await service.listClients(1, 20, { collectionId: "col-1" });
    expect(result).toEqual({ items: [], total: 0, page: 1, limit: 20 });
    expect(prismaMock.db.client.findMany).not.toHaveBeenCalled();
  });
});
