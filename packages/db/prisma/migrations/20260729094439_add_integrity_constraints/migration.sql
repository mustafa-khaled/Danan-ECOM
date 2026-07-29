-- Add database integrity constraints as recommended by the DADAN Database Design Review
-- These constraints enforce critical business rules at the database level

-- ============================================================================
-- PARTIAL UNIQUE INDEXES
-- ============================================================================

-- HI-01: Enforce exactly one current (open) ownership record per piece
-- A piece can have only one ownership record where transferredAt is NULL
CREATE UNIQUE INDEX "one_current_owner_per_piece"
ON "OwnershipRecord" ("pieceId")
WHERE "transferredAt" IS NULL;

-- HI-02: Enforce exactly one active certificate per piece
-- Prevents multiple valid certificates for the same piece
CREATE UNIQUE INDEX "one_active_certificate_per_piece"
ON "Certificate" ("pieceId")
WHERE "isActive" = true;

-- CR-03: Enforce only one active transfer per piece
-- Active statuses are: INITIATED, SENDER_CONFIRMED, RECIPIENT_CONFIRMED, DADAN_REVIEW
CREATE UNIQUE INDEX "one_active_transfer_per_piece"
ON "TransferRequest" ("pieceId")
WHERE "status" IN ('INITIATED', 'SENDER_CONFIRMED', 'RECIPIENT_CONFIRMED', 'DADAN_REVIEW');

-- ============================================================================
-- CHECK CONSTRAINTS
-- ============================================================================

-- ME-02: Prevent self-transfer (sender cannot be the same as recipient)
ALTER TABLE "TransferRequest"
ADD CONSTRAINT "transfer_participants_must_differ"
CHECK ("fromClientId" <> "toClientId");

-- ME-16: Ensure design weight is positive
ALTER TABLE "Design"
ADD CONSTRAINT "design_weight_positive"
CHECK ("weight" > 0);

-- ME-16: Ensure design base price is non-negative
ALTER TABLE "Design"
ADD CONSTRAINT "design_price_nonnegative"
CHECK ("basePrice" >= 0);

-- HI-07: Ensure payment reference uniqueness per provider (when not null)
-- This prevents duplicate payment processing
CREATE UNIQUE INDEX "unique_payment_reference_per_provider"
ON "Order" ("paymentProvider", "paymentReference")
WHERE "paymentReference" IS NOT NULL;

-- ============================================================================
-- ADDITIONAL INDEXES FOR INTEGRITY QUERIES
-- ============================================================================

-- Index to efficiently query current ownership records
CREATE INDEX "ownership_record_current_idx"
ON "OwnershipRecord" ("pieceId", "clientId")
WHERE "transferredAt" IS NULL;

-- Index for order item piece uniqueness check across orders
CREATE UNIQUE INDEX "unique_piece_per_order"
ON "OrderItem" ("orderId", "pieceId");
