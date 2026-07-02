import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "../src/health/health.controller";
import { HealthCheckService } from "@nestjs/terminus";
import { PrismaHealthIndicator } from "../src/health/prisma.health";
import { RedisHealthIndicator } from "../src/health/redis.health";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn(),
    };

    const mockPrismaHealth = {
      isHealthy: jest.fn(),
    };

    const mockRedisHealth = {
      isHealthy: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: PrismaHealthIndicator, useValue: mockPrismaHealth },
        { provide: RedisHealthIndicator, useValue: mockRedisHealth },
      ],
    }).compile();

    controller = app.get<HealthController>(HealthController);
  });

  describe("liveness", () => {
    it('should return { status: "ok" }', () => {
      expect(controller.liveness()).toEqual({ status: "ok" });
    });
  });
});
