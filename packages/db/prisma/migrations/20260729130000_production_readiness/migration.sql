-- Production Readiness Migration
-- Adds: CartItem FKs, FailedRefund model, financial constraints, piece invariant, indexes

-- CartItem foreign keys
ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_pieceId_fkey"
FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FailedRefund table
CREATE TABLE "FailedRefund" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerReference" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "reason" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailedRefund_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FailedRefund_resolvedAt_idx" ON "FailedRefund"("resolvedAt");

-- Financial check constraints
ALTER TABLE "Order"
ADD CONSTRAINT "order_amounts_nonnegative"
CHECK ("subtotalAmount" >= 0 AND "taxAmount" >= 0 AND "totalAmount" >= 0
  AND "shippingAmount" >= 0 AND "discountAmount" >= 0);

ALTER TABLE "OrderItem"
ADD CONSTRAINT "order_item_amounts_nonnegative"
CHECK ("priceAtPurchase" >= 0 AND "taxAmount" >= 0 AND "lineTotal" >= 0);

-- Piece status/owner invariant
ALTER TABLE "Piece"
ADD CONSTRAINT "piece_owned_has_owner"
CHECK (
  ("status" = 'OWNED' AND "currentOwnerId" IS NOT NULL)
  OR ("status" = 'TRANSFER_PENDING' AND "currentOwnerId" IS NOT NULL)
  OR ("status" IN ('AVAILABLE', 'RETIRED') AND "currentOwnerId" IS NULL)
);

-- Missing indexes
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);
CREATE INDEX "OwnershipRecord_pieceId_transferredAt_idx" ON "OwnershipRecord"("pieceId", "transferredAt");
CREATE INDEX "VerificationLog_serialNumber_idx" ON "VerificationLog"("serialNumber");

-- Unique constraint for design specifications
CREATE UNIQUE INDEX "DesignSpecification_designId_key_key" ON "DesignSpecification"("designId", "key");

-- Add ipAddress column to AuditLog (referenced in service but missing from schema)
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
