-- Phase 7 billing updates: add PRO plan + AI usage feature tracking

-- Add PRO enum to BillingPlan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'BillingPlan' AND e.enumlabel = 'PRO'
  ) THEN
    ALTER TYPE "BillingPlan" ADD VALUE 'PRO';
  END IF;
END$$;

-- Add feature column to AI usage records
ALTER TABLE "ai_usage_records"
  ADD COLUMN IF NOT EXISTS "feature" TEXT NOT NULL DEFAULT 'unknown';
