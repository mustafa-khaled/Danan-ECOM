import { HttpException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { AuthService } from "../src/auth/auth.service";
import { AuditService } from "../src/audit/audit.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { RedisService } from "../src/redis/redis.service";
import { AUTH_FAILURE_MESSAGE } from "../src/common/constants";

jest.mock("bcrypt");

describe("AuthService", () => {
  let service: AuthService;

  const prismaMock = {
    db: {
      client: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    },
  };
  const jwtMock = { signAsync: jest.fn().mockResolvedValue("jwt-token") };
  const redisMock = { isRateLimited: jest.fn().mockResolvedValue(false) };
  const auditMock = { log: jest.fn().mockResolvedValue(undefined) };
  const configMock = { get: jest.fn().mockReturnValue("12") };

  beforeEach(async () => {
    jest.clearAllMocks();
    redisMock.isRateLimited.mockResolvedValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: RedisService, useValue: redisMock },
        { provide: AuditService, useValue: auditMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe("validateKey", () => {
    it("returns a token for a valid house key", async () => {
      const client = {
        id: "client-1",
        displayName: "Test Client",
        visibilityGroups: ["vip"],
        houseKey: "hashed-key",
        isActive: true,
      };
      prismaMock.db.client.findMany.mockResolvedValue([client]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateKey("valid-key", "127.0.0.1");

      expect(result.token).toBe("jwt-token");
      expect(result.client).toEqual({
        clientId: "client-1",
        displayName: "Test Client",
        visibilityGroups: ["vip"],
        locale: "ar",
      });
      expect(jwtMock.signAsync).toHaveBeenCalled();
      expect(auditMock.log).toHaveBeenCalled();
    });

    it("throws UnauthorizedException for an invalid house key", async () => {
      prismaMock.db.client.findMany.mockResolvedValue([
        {
          id: "client-1",
          displayName: "Test Client",
          visibilityGroups: [],
          houseKey: "hashed-key",
          isActive: true,
        },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateKey("wrong-key", "127.0.0.1")).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateKey("wrong-key", "127.0.0.1")).rejects.toThrow(
        AUTH_FAILURE_MESSAGE,
      );
    });

    it("throws when rate limited", async () => {
      redisMock.isRateLimited.mockResolvedValue(true);

      await expect(service.validateKey("any-key", "127.0.0.1")).rejects.toThrow(
        HttpException,
      );
      expect(prismaMock.db.client.findMany).not.toHaveBeenCalled();
    });

    it("does not match inactive clients", async () => {
      prismaMock.db.client.findMany.mockResolvedValue([]);

      await expect(service.validateKey("any-key", "127.0.0.1")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
