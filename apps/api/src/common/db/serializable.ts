import { Prisma } from "@dadan/db";

/**
 * Structural subset of `PrismaClient` needed for interactive transactions, so
 * callers can pass `PrismaService.db` without this module importing the
 * generated client type.
 */
export interface TransactionRunner {
  $transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      isolationLevel?: Prisma.TransactionIsolationLevel;
      maxWait?: number;
      timeout?: number;
    },
  ): Promise<T>;
}

/**
 * P2034 — write conflict / deadlock, which is exactly how PostgreSQL reports a
 *         serialization failure under SERIALIZABLE.
 * P2024 — could not acquire a pooled connection in time.
 * P1017 — server closed the connection.
 */
const RETRYABLE_PRISMA_CODES = new Set(["P2034", "P2024", "P1017"]);

/**
 * Raw `SELECT ... FOR UPDATE` statements inside a transaction can surface a
 * serialization failure as an unknown request error instead of P2034, so the
 * SQLSTATE and message are matched as well.
 */
const RETRYABLE_MESSAGE_PATTERN =
  /40001|40P01|could not serialize access|deadlock detected/i;

export function isRetryableTransactionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_PRISMA_CODES.has(error.code);
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return RETRYABLE_MESSAGE_PATTERN.test(error.message);
  }
  return false;
}

const DEFAULT_ATTEMPTS = 4;
const MAX_WAIT_MS = 5_000;
const TIMEOUT_MS = 15_000;

/**
 * Runs `fn` in a SERIALIZABLE transaction, retrying serialization failures.
 *
 * PostgreSQL aborts SERIALIZABLE transactions that would violate serial order —
 * that is the isolation level working as designed, not an error the caller can
 * act on. Without this retry, ordinary concurrency on the checkout and transfer
 * state machines surfaces to clients as HTTP 500.
 *
 * `fn` must therefore be safe to run more than once: it may be partially
 * executed and rolled back before a later attempt succeeds.
 */
export async function runSerializable<T>(
  db: TransactionRunner,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  attempts: number = DEFAULT_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await db.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: MAX_WAIT_MS,
        timeout: TIMEOUT_MS,
      });
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isRetryableTransactionError(error)) {
        throw error;
      }
      // Jittered backoff so concurrent losers do not collide again immediately.
      const backoffMs = 25 * 2 ** (attempt - 1) + Math.random() * 50;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}
