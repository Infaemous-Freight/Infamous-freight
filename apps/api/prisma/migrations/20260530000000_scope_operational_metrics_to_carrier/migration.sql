ALTER TABLE "OperationalMetric" ADD COLUMN "carrierId" TEXT;

INSERT INTO "Carrier" ("id", "email", "name", "status", "subscriptionTier", "createdAt", "updatedAt")
SELECT
  'carrier_legacy_operational_metrics',
  'legacy-operational-metrics@infamousfreight.local',
  'Legacy Operational Metrics',
  'archived',
  'starter',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM "OperationalMetric"
  WHERE "carrierId" IS NULL
)
ON CONFLICT ("id") DO NOTHING;

UPDATE "OperationalMetric"
SET "carrierId" = 'carrier_legacy_operational_metrics'
WHERE "carrierId" IS NULL;

ALTER TABLE "OperationalMetric" ALTER COLUMN "carrierId" SET NOT NULL;

CREATE INDEX "OperationalMetric_carrierId_date_idx" ON "OperationalMetric"("carrierId", "date");
CREATE INDEX "OperationalMetric_carrierId_period_idx" ON "OperationalMetric"("carrierId", "period");

ALTER TABLE "OperationalMetric" ADD CONSTRAINT "OperationalMetric_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
