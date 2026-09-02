-- Cart Hold Rework Migration
-- 1. Remove expiresAt column and unique(pieceId) from CartItem
-- 2. Add unique(clientId, pieceId) to CartItem
-- 3. Create CheckoutReservation table

-- Step 1: Drop the old unique index on CartItem.pieceId
DROP INDEX IF EXISTS "CartItem_pieceId_key";

-- Step 2: Drop the old expiresAt index
DROP INDEX IF EXISTS "CartItem_expiresAt_idx";

-- Step 3: Remove expiresAt column from CartItem
ALTER TABLE "CartItem" DROP COLUMN IF EXISTS "expiresAt";

-- Step 4: Add composite unique constraint on (clientId, pieceId)
ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_clientId_pieceId_key" UNIQUE ("clientId", "pieceId");

-- Step 5: Create CheckoutReservation table
CREATE TABLE "CheckoutReservation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutReservation_pkey" PRIMARY KEY ("id")
);

-- Step 6: Unique constraint on pieceId (only one active reservation per piece)
ALTER TABLE "CheckoutReservation"
ADD CONSTRAINT "CheckoutReservation_pieceId_key" UNIQUE ("pieceId");

-- Step 7: Foreign keys for CheckoutReservation
ALTER TABLE "CheckoutReservation"
ADD CONSTRAINT "CheckoutReservation_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckoutReservation"
ADD CONSTRAINT "CheckoutReservation_pieceId_fkey"
FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Indexes for CheckoutReservation
CREATE INDEX "CheckoutReservation_clientId_idx" ON "CheckoutReservation"("clientId");
CREATE INDEX "CheckoutReservation_expiresAt_idx" ON "CheckoutReservation"("expiresAt");
