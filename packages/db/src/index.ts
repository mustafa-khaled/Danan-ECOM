import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Sizes the client's own connection pool and caps query runtime.
 *
 * `statement_timeout` prevents a runaway query from holding a connection
 * indefinitely. `connection_limit` and `pool_timeout` are set explicitly rather
 * than left to Prisma's `num_cpus * 2 + 1` default: `DATABASE_URL` points at
 * PgBouncer, so each API replica multiplying its pool by the host's core count
 * is how a two-replica deploy exhausts the pooler.
 *
 * Any value already present in the URL wins, so a deployment can still override
 * these per environment.
 */
function getDatasourceUrl(): string {
  const baseUrl = process.env.DATABASE_URL ?? "";
  if (!baseUrl) return baseUrl;

  const params: Record<string, string> = {
    statement_timeout: process.env.DATABASE_STATEMENT_TIMEOUT_MS ?? "30000",
    connection_limit: process.env.DATABASE_POOL_SIZE ?? "10",
    pool_timeout: process.env.DATABASE_POOL_TIMEOUT_SECONDS ?? "10",
  };

  let url = baseUrl;
  for (const [key, value] of Object.entries(params)) {
    if (url.includes(`${key}=`)) continue;
    url += `${url.includes("?") ? "&" : "?"}${key}=${value}`;
  }

  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: getDatasourceUrl(),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient } from "../generated/client";
export * from "../generated/client";
