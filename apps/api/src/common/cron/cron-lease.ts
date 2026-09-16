import { Logger } from "@nestjs/common";
import type { RedisService } from "../../redis/redis.service";

/** Redis key for a cross-instance cron lease. */
export function cronLeaseKey(name: string): string {
  return `cron:lease:${name}`;
}

/**
 * Runs `job` only if this process wins the lease for `name`.
 *
 * An in-process boolean guard only prevents a sweep from overlapping itself on
 * one instance; with more than one replica every instance runs the same cron on
 * the same schedule. For sweeps that call a payment gateway or mutate order
 * state, that duplication is not harmless, so the lease is held in Redis.
 *
 * The lease expires rather than being released, so a process that dies mid-run
 * cannot wedge the job permanently — pick a TTL comfortably above the expected
 * runtime but below the cron interval.
 */
export async function withCronLease(
  redis: RedisService,
  name: string,
  ttlSeconds: number,
  logger: Logger,
  job: () => Promise<void>,
): Promise<void> {
  const acquired = await redis.setIfAbsent(
    cronLeaseKey(name),
    String(process.pid),
    ttlSeconds,
  );
  if (!acquired) {
    logger.debug(`Skipping ${name}: another instance holds the lease`);
    return;
  }

  try {
    await job();
  } catch (error) {
    logger.error(
      `Cron ${name} failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
    );
  }
  // The lease is intentionally left to expire: releasing it early would let a
  // second instance start a fresh run inside the same cron tick.
}
