-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "nameAr" TEXT;

-- AlterTable
ALTER TABLE "Design" ADD COLUMN     "dimensionsAr" TEXT,
ADD COLUMN     "materialAr" TEXT,
ADD COLUMN     "nameAr" TEXT,
ADD COLUMN     "storyAr" TEXT;

-- AlterTable
ALTER TABLE "DesignSpecification" ADD COLUMN     "keyAr" TEXT,
ADD COLUMN     "valueAr" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" TEXT;

-- CreateIndex
CREATE INDEX "Order_paymentReference_idx" ON "Order"("paymentReference");
