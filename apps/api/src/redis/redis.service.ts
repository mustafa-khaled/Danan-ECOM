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

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    if (members.length > 0) {
      await this.client.sadd(key, ...members);
    }
  }

  async srem(key: string, ...members: string[]): Promise<void> {
    if (members.length > 0) {
      await this.client.srem(key, ...members);
    }
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async eval(
    script: string,
    keys: string[],
    args: (string | number)[],
  ): Promise<unknown> {
    return this.client.eval(
      script,
      keys.length,
      ...keys,
      ...args.map(String),
    );
  }
}
