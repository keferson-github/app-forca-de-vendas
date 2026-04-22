-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('PROSPECT', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED');

-- AlterTable
ALTER TABLE "Customer"
ADD COLUMN "isProspect" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "prospectStatus" "ProspectStatus" NOT NULL DEFAULT 'PROSPECT';

-- CreateIndex
CREATE INDEX "Customer_userId_isProspect_prospectStatus_idx" ON "Customer"("userId", "isProspect", "prospectStatus");
