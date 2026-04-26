-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "stockQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
ADD COLUMN "blingProductId" TEXT,
ADD COLUMN "lastBlingSyncAt" TIMESTAMP(3),
ADD COLUMN "lastBlingError" TEXT;

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "blingOrderId" TEXT,
ADD COLUMN "lastBlingSyncAt" TIMESTAMP(3),
ADD COLUMN "lastBlingError" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_userId_blingProductId_key" ON "Product"("userId", "blingProductId");

-- CreateIndex
CREATE INDEX "Order_userId_blingOrderId_idx" ON "Order"("userId", "blingOrderId");
