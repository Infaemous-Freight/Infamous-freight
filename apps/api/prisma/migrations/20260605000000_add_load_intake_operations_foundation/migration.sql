-- Sprint 1 load intake operations foundation.
-- Adds durable Genesis prioritization metadata plus notification and retry queues for /api/loads/intake.

ALTER TABLE "QuoteRequest"
  ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "genesisScore" INTEGER,
  ADD COLUMN IF NOT EXISTS "genesisPriority" TEXT,
  ADD COLUMN IF NOT EXISTS "genesisReasons" JSONB;

CREATE INDEX IF NOT EXISTS "QuoteRequest_carrierId_status_createdAt_idx"
  ON "QuoteRequest"("carrierId", "status", "createdAt");

CREATE TABLE IF NOT EXISTS "LoadIntakeNotificationQueue" (
  "id" TEXT NOT NULL,
  "carrierId" TEXT NOT NULL,
  "quoteRequestId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "recipientRole" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LoadIntakeNotificationQueue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LoadIntakeRetryQueue" (
  "id" TEXT NOT NULL,
  "carrierId" TEXT NOT NULL,
  "quoteRequestId" TEXT,
  "operation" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "context" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LoadIntakeRetryQueue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LoadIntakeNotificationQueue_dedupeKey_key"
  ON "LoadIntakeNotificationQueue"("dedupeKey");
CREATE INDEX IF NOT EXISTS "LoadIntakeNotificationQueue_carrierId_status_availableAt_idx"
  ON "LoadIntakeNotificationQueue"("carrierId", "status", "availableAt");
CREATE INDEX IF NOT EXISTS "LoadIntakeNotificationQueue_quoteRequestId_idx"
  ON "LoadIntakeNotificationQueue"("quoteRequestId");
CREATE INDEX IF NOT EXISTS "LoadIntakeNotificationQueue_recipientRole_status_idx"
  ON "LoadIntakeNotificationQueue"("recipientRole", "status");

CREATE INDEX IF NOT EXISTS "LoadIntakeRetryQueue_carrierId_status_availableAt_idx"
  ON "LoadIntakeRetryQueue"("carrierId", "status", "availableAt");
CREATE INDEX IF NOT EXISTS "LoadIntakeRetryQueue_quoteRequestId_idx"
  ON "LoadIntakeRetryQueue"("quoteRequestId");
CREATE INDEX IF NOT EXISTS "LoadIntakeRetryQueue_operation_status_idx"
  ON "LoadIntakeRetryQueue"("operation", "status");

ALTER TABLE "LoadIntakeNotificationQueue"
  ADD CONSTRAINT "LoadIntakeNotificationQueue_carrierId_fkey"
  FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadIntakeNotificationQueue"
  ADD CONSTRAINT "LoadIntakeNotificationQueue_quoteRequestId_fkey"
  FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LoadIntakeRetryQueue"
  ADD CONSTRAINT "LoadIntakeRetryQueue_carrierId_fkey"
  FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadIntakeRetryQueue"
  ADD CONSTRAINT "LoadIntakeRetryQueue_quoteRequestId_fkey"
  FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
