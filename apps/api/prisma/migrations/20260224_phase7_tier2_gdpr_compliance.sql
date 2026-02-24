-- Phase 7 Tier 2: GDPR Compliance Schema Updates
-- Migration: Update UserConsent and DataProcessingLog for full GDPR compliance

-- ============================================
-- UserConsent Table Updates
-- ============================================

-- Rename columns for GDPR terminology
ALTER TABLE "user_consents" 
  RENAME COLUMN "value" TO "granted";

ALTER TABLE "user_consents" 
  RENAME COLUMN "withdrawnAt" TO "revokedAt";

ALTER TABLE "user_consents" 
  RENAME COLUMN "recordedIp" TO "ipAddress";

ALTER TABLE "user_consents" 
  RENAME COLUMN "recordedUserAgent" TO "userAgent";

-- Add metadata column for additional context
ALTER TABLE "user_consents" 
  ADD COLUMN "metadata" TEXT;

-- Add indexes for GDPR compliance auditing
CREATE INDEX IF NOT EXISTS "user_consents_granted_idx" ON "user_consents" ("granted");
CREATE INDEX IF NOT EXISTS "user_consents_grantedAt_idx" ON "user_consents" ("grantedAt");

-- Update consent type comments to reflect GDPR categories
COMMENT ON COLUMN "user_consents"."consentType" IS 'GDPR consent types: marketing | analytics | profiling | third_party_sharing | location_tracking | ai_processing';

-- ============================================
-- DataProcessingLog Table Updates
-- ============================================

-- Rename dataCategory to dataCategories (will store JSON array)
ALTER TABLE "data_processing_logs" 
  RENAME COLUMN "dataCategory" TO "dataCategories";

-- Add GDPR legal basis column
ALTER TABLE "data_processing_logs" 
  ADD COLUMN "legalBasis" TEXT;

-- Add metadata column
ALTER TABLE "data_processing_logs" 
  ADD COLUMN "metadata" TEXT;

-- Add index for legal basis (GDPR compliance auditing)
CREATE INDEX IF NOT EXISTS "data_processing_logs_legalBasis_idx" ON "data_processing_logs" ("legalBasis");

-- Update comments for GDPR compliance
COMMENT ON COLUMN "data_processing_logs"."operation" IS 'Operations: read | write | delete | export | share | consent_recorded | data_export | data_erasure';
COMMENT ON COLUMN "data_processing_logs"."purpose" IS 'GDPR purposes: service_delivery | contract_fulfillment | legal_obligation | consent | legitimate_interest';
COMMENT ON COLUMN "data_processing_logs"."dataCategories" IS 'JSON array of categories: personal | financial | location | behavioral | communications';
COMMENT ON COLUMN "data_processing_logs"."legalBasis" IS 'GDPR Article 6 legal basis: Article 6(1)(a) - Consent | Article 6(1)(b) - Contract | Article 6(1)(c) - Legal obligation | Article 6(1)(d) - Vital interests | Article 6(1)(e) - Public task | Article 6(1)(f) - Legitimate interests';

-- ============================================
-- Data Migration
-- ============================================

-- Migrate existing consents (no data loss)
-- The renamed columns preserve existing data automatically

-- Set default legal basis for existing processing logs
UPDATE "data_processing_logs"
SET "legalBasis" = CASE 
  WHEN "purpose" = 'shipment' THEN 'Article 6(1)(b) - Contract'
  WHEN "purpose" = 'analytics' THEN 'Article 6(1)(f) - Legitimate interests'
  WHEN "purpose" = 'support' THEN 'Article 6(1)(b) - Contract'
  WHEN "purpose" = 'marketing' THEN 'Article 6(1)(a) - Consent'
  ELSE 'Article 6(1)(f) - Legitimate interests'
END
WHERE "legalBasis" IS NULL;

-- Convert single dataCategory to JSON array format
UPDATE "data_processing_logs"
SET "dataCategories" = '["' || "dataCategories" || '"]'
WHERE "dataCategories" IS NOT NULL 
  AND "dataCategories" NOT LIKE '[%';

-- ============================================
-- Verification Queries
-- ============================================

-- Verify UserConsent changes
-- SELECT COUNT(*) as total_consents, 
--        COUNT(CASE WHEN granted = true THEN 1 END) as granted_count,
--        COUNT(CASE WHEN granted = false THEN 1 END) as revoked_count
-- FROM "user_consents";

-- Verify DataProcessingLog changes
-- SELECT "legalBasis", COUNT(*) as count
-- FROM "data_processing_logs"
-- GROUP BY "legalBasis"
-- ORDER BY count DESC;

-- Check for any NULL legal bases (should be none)
-- SELECT COUNT(*) as null_legal_basis_count
-- FROM "data_processing_logs"
-- WHERE "legalBasis" IS NULL;

-- ============================================
-- GDPR Compliance Notes
-- ============================================

-- This migration ensures:
-- 1. Article 7 - Consent conditions are properly tracked
-- 2. Article 6 - Legal basis for processing is recorded
-- 3. Article 15 - Right to access (data export capability)
-- 4. Article 17 - Right to erasure (data deletion tracking)
-- 5. Article 20 - Right to data portability (structured data)
-- 6. Article 30 - Records of processing activities (audit logs)

-- All existing data is preserved and migrated to new structure
-- No data loss occurs during this migration
