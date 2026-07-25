import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from "@nestjs/terminus";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../common/decorators/public.decorator";
import { PrismaHealthIndicator } from "./prisma.health";
import { RedisHealthIndicator } from "./redis.health";

@Public()
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.isHealthy("database"),
      () => this.redisHealth.isHealthy("redis"),
    ]);
  }

  @Get("live")
  liveness() {
    return { status: "ok" };
  }

  @Get("ready")
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.isHealthy("database"),
      () => this.redisHealth.isHealthy("redis"),
    ]);
  }
}
