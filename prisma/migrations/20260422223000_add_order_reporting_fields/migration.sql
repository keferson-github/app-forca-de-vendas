-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "billedAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledReason" TEXT;

-- CreateIndex
CREATE INDEX "Order_userId_status_createdAt_idx" ON "Order"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_billedAt_idx" ON "Order"("userId", "billedAt");
