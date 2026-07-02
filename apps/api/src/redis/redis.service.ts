import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>("REDIS_URL"));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async incrementWithExpiry(
    key: string,
    windowSeconds: number,
  ): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, windowSeconds);
    }
    return count;
  }

  async isRateLimited(
    key: string,
    maxAttempts: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const count = await this.incrementWithExpiry(key, windowSeconds);
    return count > maxAttempts;
  }

  async getCount(key: string): Promise<number> {
    const val = await this.client.get(key);
    return val ? parseInt(val, 10) : 0;
  }

  async setWithExpiry(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.set(key, value, "EX", ttlSeconds);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }
}
