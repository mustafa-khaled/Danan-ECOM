import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Appends statement_timeout to DATABASE_URL if not already present.
 * This prevents runaway queries from holding connections indefinitely.
 */
function getDatasourceUrl(): string {
  const baseUrl = process.env.DATABASE_URL ?? "";
  const timeoutMs = parseInt(process.env.DATABASE_STATEMENT_TIMEOUT_MS ?? "30000", 10);

  // If the URL already has statement_timeout, don't override it
  if (baseUrl.includes("statement_timeout")) {
    return baseUrl;
  }

  // Append statement_timeout as a query parameter
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}statement_timeout=${timeoutMs}`;
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
