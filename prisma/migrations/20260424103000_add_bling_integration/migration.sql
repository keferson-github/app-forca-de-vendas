-- CreateTable
CREATE TABLE "BlingConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlingConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlingOAuthState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlingOAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlingWebhookEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "companyId" TEXT,
    "event" TEXT NOT NULL,
    "version" TEXT,
    "occurredAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "BlingWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlingConnection_userId_key" ON "BlingConnection"("userId");

-- CreateIndex
CREATE INDEX "BlingConnection_companyId_idx" ON "BlingConnection"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "BlingOAuthState_state_key" ON "BlingOAuthState"("state");

-- CreateIndex
CREATE INDEX "BlingOAuthState_userId_expiresAt_idx" ON "BlingOAuthState"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlingWebhookEvent_eventId_key" ON "BlingWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "BlingWebhookEvent_userId_receivedAt_idx" ON "BlingWebhookEvent"("userId", "receivedAt");

-- CreateIndex
CREATE INDEX "BlingWebhookEvent_companyId_receivedAt_idx" ON "BlingWebhookEvent"("companyId", "receivedAt");

-- CreateIndex
CREATE INDEX "BlingWebhookEvent_event_receivedAt_idx" ON "BlingWebhookEvent"("event", "receivedAt");

-- AddForeignKey
ALTER TABLE "BlingConnection" ADD CONSTRAINT "BlingConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlingOAuthState" ADD CONSTRAINT "BlingOAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlingWebhookEvent" ADD CONSTRAINT "BlingWebhookEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
