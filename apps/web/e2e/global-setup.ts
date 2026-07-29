import Redis from "ioredis";

const RATE_LIMIT_PATTERNS = [
  "auth:validate-key:*",
  "admin:login:*",
  "verify:*",
  "transfer:initiate:*",
];

export default async function globalSetup(): Promise<void> {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const redis = new Redis(redisUrl);

  try {
    for (const pattern of RATE_LIMIT_PATTERNS) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } finally {
    await redis.quit();
  }
}
