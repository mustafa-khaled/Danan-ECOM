-- Add new enums for separated payment and fulfillment status
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'DISPUTED');
CREATE TYPE "FulfillmentStatus" AS ENUM ('UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED');

-- Add new columns to Order table
ALTER TABLE "Order"
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED',
ADD COLUMN "subtotalAmount" DECIMAL(12, 2),
ADD COLUMN "taxAmount" DECIMAL(12, 2),
ADD COLUMN "taxRate" DECIMAL(5, 4),
ADD COLUMN "shippingAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN "discountAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN "idempotencyKey" TEXT;

-- Backfill existing orders: derive subtotal and tax from totalAmount
-- Assuming 15% VAT was applied: subtotal = totalAmount / 1.15, taxAmount = subtotal * 0.15
UPDATE "Order"
SET 
  "subtotalAmount" = ROUND("totalAmount" / 1.15, 2),
  "taxAmount" = ROUND("totalAmount" - ("totalAmount" / 1.15), 2),
  "taxRate" = 0.15,
  "paymentStatus" = CASE 
    WHEN "status" IN ('PAID', 'PROCESSING', 'FULFILLED') THEN 'PAID'::"PaymentStatus"
    WHEN "status" = 'CANCELLED' THEN 'REFUNDED'::"PaymentStatus"
    ELSE 'PENDING'::"PaymentStatus"
  END,
  "fulfillmentStatus" = CASE 
    WHEN "status" = 'FULFILLED' THEN 'DELIVERED'::"FulfillmentStatus"
    WHEN "status" = 'PROCESSING' THEN 'PROCESSING'::"FulfillmentStatus"
    ELSE 'UNFULFILLED'::"FulfillmentStatus"
  END;

-- Make the backfilled columns required
ALTER TABLE "Order"
ALTER COLUMN "subtotalAmount" SET NOT NULL,
ALTER COLUMN "taxAmount" SET NOT NULL,
ALTER COLUMN "taxRate" SET NOT NULL;

-- Add unique index for idempotency key
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;

-- Add indexes for the new status columns
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_fulfillmentStatus_idx" ON "Order"("fulfillmentStatus");

-- Add new columns to OrderItem table
ALTER TABLE "OrderItem"
ADD COLUMN "taxRate" DECIMAL(5, 4) NOT NULL DEFAULT 0.15,
ADD COLUMN "taxAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN "discountAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN "lineTotal" DECIMAL(12, 2),
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SAR';

-- Backfill OrderItem: calculate taxAmount and lineTotal
UPDATE "OrderItem"
SET 
  "taxAmount" = ROUND("priceAtPurchase" * "taxRate", 2),
  "lineTotal" = ROUND("priceAtPurchase" * (1 + "taxRate"), 2);

-- Make lineTotal required
ALTER TABLE "OrderItem"
ALTER COLUMN "lineTotal" SET NOT NULL;

-- Add index for piece lookups in order items
CREATE INDEX "OrderItem_pieceId_idx" ON "OrderItem"("pieceId");
