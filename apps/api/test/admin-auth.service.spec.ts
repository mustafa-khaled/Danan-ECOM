import { HttpException, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AdminAuthService } from "../src/admin/auth/admin-auth.service";
import { AuditService } from "../src/audit/audit.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { RedisService } from "../src/redis/redis.service";
import { RefreshTokenService } from "../src/auth/refresh-token.service";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

import * as bcrypt from "bcrypt";

describe("AdminAuthService login lockout", () => {
  const redisMock = {
    isRateLimited: jest.fn().mockResolvedValue(false),
    getCount: jest.fn().mockResolvedValue(0),
    incrementWithExpiry: jest.fn().mockResolvedValue(1),
  };
  const prismaMock = {
    db: {
      adminUser: {
        findUnique: jest.fn(),
      },
    },
  };

  let service: AdminAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: { signAsync: jest.fn(), decode: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: RedisService, useValue: redisMock },
        { provide: RefreshTokenService, useValue: {} },
      ],
    }).compile();

    service = module.get(AdminAuthService);
    jest.clearAllMocks();
    redisMock.isRateLimited.mockResolvedValue(false);
    redisMock.getCount.mockResolvedValue(0);
  });

  it("rejects further attempts once the email counter is exhausted", async () => {
    redisMock.getCount.mockResolvedValue(5);

    await expect(
      service.login("admin@dadan.sa", "wrong", "1.2.3.4"),
    ).rejects.toBeInstanceOf(HttpException);
    expect(prismaMock.db.adminUser.findUnique).not.toHaveBeenCalled();
  });

  it("counts a failed password against the email, not a success", async () => {
    prismaMock.db.adminUser.findUnique.mockResolvedValue({
      id: "admin-1",
      isActive: true,
      passwordHash: "hash",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login("admin@dadan.sa", "wrong", "1.2.3.4"),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(redisMock.incrementWithExpiry).toHaveBeenCalledWith(
      "admin:login:email:admin@dadan.sa",
      expect.any(Number),
    );
  });
});
