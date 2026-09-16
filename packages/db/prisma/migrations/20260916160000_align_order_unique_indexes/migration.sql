-- Aligns the two `Order` unique indexes with what schema.prisma can express, so
-- the drift check has a smaller allowlist to trust.
--
-- Both were written as partial indexes (`WHERE ... IS NOT NULL`) while the schema
-- declares them as ordinary uniques. The `WHERE` clause was never load-bearing:
-- PostgreSQL treats NULLs as distinct in a unique index by default, so rows with
-- a NULL `paymentReference` or `idempotencyKey` already never conflicted. Dropping
-- the predicate makes the database match the declared model exactly, which means
-- `prisma migrate diff` stops reporting them and a genuinely missing migration
-- stands out.
DROP INDEX IF EXISTS "unique_payment_reference_per_provider";

CREATE UNIQUE INDEX IF NOT EXISTS "Order_paymentProvider_paymentReference_key"
  ON "Order" ("paymentProvider", "paymentReference");

DROP INDEX IF EXISTS "Order_idempotencyKey_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Order_idempotencyKey_key"
  ON "Order" ("idempotencyKey");
