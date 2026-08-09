-- Add compound index for efficient client orders query with date sorting
-- Optimizes: SELECT ... FROM "Order" WHERE "clientId" = ? ORDER BY "placedAt" DESC
CREATE INDEX "Order_clientId_placedAt_idx" ON "Order"("clientId", "placedAt" DESC);
