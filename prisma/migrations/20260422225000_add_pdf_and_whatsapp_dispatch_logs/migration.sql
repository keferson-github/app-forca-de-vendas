-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DECLARACAO_CONTEUDO');

-- CreateEnum
CREATE TYPE "DispatchChannel" AS ENUM ('WHATSAPP');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "OrderDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'DECLARACAO_CONTEUDO',
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappDispatchLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderDocumentId" TEXT,
    "customerContactId" TEXT,
    "channel" "DispatchChannel" NOT NULL DEFAULT 'WHATSAPP',
    "status" "DispatchStatus" NOT NULL DEFAULT 'PENDING',
    "destinationPhone" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "providerPayload" JSONB,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappDispatchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderDocument_userId_orderId_type_idx" ON "OrderDocument"("userId", "orderId", "type");

-- CreateIndex
CREATE INDEX "WhatsappDispatchLog_userId_status_createdAt_idx" ON "WhatsappDispatchLog"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsappDispatchLog_orderId_createdAt_idx" ON "WhatsappDispatchLog"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappDispatchLog" ADD CONSTRAINT "WhatsappDispatchLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappDispatchLog" ADD CONSTRAINT "WhatsappDispatchLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappDispatchLog" ADD CONSTRAINT "WhatsappDispatchLog_orderDocumentId_fkey" FOREIGN KEY ("orderDocumentId") REFERENCES "OrderDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappDispatchLog" ADD CONSTRAINT "WhatsappDispatchLog_customerContactId_fkey" FOREIGN KEY ("customerContactId") REFERENCES "CustomerContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
