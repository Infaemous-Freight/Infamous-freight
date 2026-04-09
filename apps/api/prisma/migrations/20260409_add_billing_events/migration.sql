-- Add billing idempotency event ledger
CREATE TYPE "BillingEventStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE "billing_events" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "BillingEventStatus" NOT NULL DEFAULT 'PENDING',
  "payload" JSONB,
  "result" JSONB,
  "errorMessage" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_events_idempotencyKey_key" ON "billing_events"("idempotencyKey");
CREATE INDEX "billing_events_organizationId_eventType_createdAt_idx" ON "billing_events"("organizationId", "eventType", "createdAt");
CREATE INDEX "billing_events_organizationId_status_createdAt_idx" ON "billing_events"("organizationId", "status", "createdAt");

ALTER TABLE "billing_events"
  ADD CONSTRAINT "billing_events_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
