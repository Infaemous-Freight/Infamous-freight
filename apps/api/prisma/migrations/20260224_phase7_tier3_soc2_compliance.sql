-- Phase 7 Tier 3: SOC2 Compliance Schema Updates
-- Migration: Update SecurityEvent and AnomalyDetection for SOC2 Type II compliance

-- ============================================
-- SecurityEvent Table Updates (SOC2 CC6.1, CC6.2, CC7.2)
-- ============================================

-- Add resource column for tracking accessed resources
ALTER TABLE "security_events" 
  ADD COLUMN IF NOT EXISTS "resource" TEXT;

-- Add action column for tracking performed actions
ALTER TABLE "security_events" 
  ADD COLUMN IF NOT EXISTS "action" TEXT;

-- Add result column for access control verification
ALTER TABLE "security_events" 
  ADD COLUMN IF NOT EXISTS "result" TEXT DEFAULT 'success';

-- Update severity values to include 'info' level
UPDATE "security_events"
SET "severity" = 'info'
WHERE "severity" = 'low' AND "eventType" IN ('login_success', 'data_access');

-- Update detectedBy to have default value
ALTER TABLE "security_events" 
  ALTER COLUMN "detectedBy" SET DEFAULT 'system';

-- Add indexes for SOC2 compliance reporting
CREATE INDEX IF NOT EXISTS "security_events_result_idx" ON "security_events" ("result");
CREATE INDEX IF NOT EXISTS "security_events_action_idx" ON "security_events" ("action");

-- Update event type comments for SOC2
COMMENT ON COLUMN "security_events"."eventType" IS 'SOC2 event types: login_success | login_failure | data_access | data_modification | data_deletion | data_export | system_config_change | suspicious_activity | permission_change';
COMMENT ON COLUMN "security_events"."severity" IS 'SOC2 severity levels: info | low | medium | high | critical';
COMMENT ON COLUMN "security_events"."result" IS 'SOC2 access result: success | denied | unauthorized | error';

-- ============================================
-- AnomalyDetection Table Updates (SOC2 CC7.2)
-- ============================================

-- Rename flaggedAt to detectedAt for consistency
ALTER TABLE "anomaly_detections"
  RENAME COLUMN "flaggedAt" TO "detectedAt";

-- Add anomalies JSON column for detailed anomaly data
ALTER TABLE "anomaly_detections" 
  ADD COLUMN IF NOT EXISTS "anomalies" JSONB;

-- Add severity column for prioritization
ALTER TABLE "anomaly_detections" 
  ADD COLUMN IF NOT EXISTS "severity" TEXT DEFAULT 'medium';

-- Add status column for incident tracking
ALTER TABLE "anomaly_detections" 
  ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'detected';

-- Set default for anomalyType
ALTER TABLE "anomaly_detections" 
  ALTER COLUMN "anomalyType" SET DEFAULT 'unknown';

-- Add indexes for SOC2 incident management
CREATE INDEX IF NOT EXISTS "anomaly_detections_severity_idx" ON "anomaly_detections" ("severity");
CREATE INDEX IF NOT EXISTS "anomaly_detections_status_idx" ON "anomaly_detections" ("status");
CREATE INDEX IF NOT EXISTS "anomaly_detections_detectedAt_idx" ON "anomaly_detections" ("detectedAt");

-- Update comments for SOC2
COMMENT ON COLUMN "anomaly_detections"."anomalyType" IS 'SOC2 anomaly types: unusual_location | impossible_travel | unusual_time | multiple_failed_logins | rapid_data_access | multiple_ip_addresses | after_hours_activity';
COMMENT ON COLUMN "anomaly_detections"."status" IS 'SOC2 incident status: detected | investigating | resolved | false_positive';
COMMENT ON COLUMN "anomaly_detections"."severity" IS 'SOC2 severity levels: info | low | medium | high | critical';

-- ============================================
-- Data Migration & Cleanup
-- ============================================

-- Populate status for existing anomalies
UPDATE "anomaly_detections"
SET "status" = CASE 
  WHEN "reviewedAt" IS NOT NULL AND "falsePositive" = true THEN 'false_positive'
  WHEN "reviewedAt" IS NOT NULL THEN 'resolved'
  ELSE 'detected'
END
WHERE "status" IS NULL;

-- Populate severity for existing anomalies based on confidence
UPDATE "anomaly_detections"
SET "severity" = CASE 
  WHEN "confidence" >= 0.9 THEN 'critical'
  WHEN "confidence" >= 0.75 THEN 'high'
  WHEN "confidence" >= 0.5 THEN 'medium'
  ELSE 'low'
END
WHERE "severity" IS NULL;

-- Populate anomalies JSON for existing records
UPDATE "anomaly_detections"
SET "anomalies" = jsonb_build_array(
  jsonb_build_object(
    'type', "anomalyType",
    'confidence', "confidence",
    'severity', "severity"
  )
)
WHERE "anomalies" IS NULL;

-- ============================================
-- SOC2 Control Verification Queries
-- ============================================

-- Verify CC6.1 - Logical Access Controls
-- SELECT COUNT(*) as total_access_attempts,
--        COUNT(CASE WHEN result = 'success' THEN 1 END) as successful_access,
--        COUNT(CASE WHEN result IN ('denied', 'unauthorized') THEN 1 END) as blocked_access
-- FROM "security_events"
-- WHERE "eventType" = 'data_access'
--   AND timestamp >= NOW() - INTERVAL '30 days';

-- Verify CC6.2 - Access Monitoring
-- SELECT DATE(timestamp) as date,
--        COUNT(*) as events_logged
-- FROM "security_events"
-- GROUP BY DATE(timestamp)
-- ORDER BY date DESC
-- LIMIT 30;

-- Verify CC7.2 - Incident Detection
-- SELECT "severity", "status", COUNT(*) as count
-- FROM "anomaly_detections"
-- WHERE "detectedAt" >= NOW() - INTERVAL '30 days'
-- GROUP BY "severity", "status"
-- ORDER BY 
--   CASE "severity"
--     WHEN 'critical' THEN 1
--     WHEN 'high' THEN 2
--     WHEN 'medium' THEN 3
--     WHEN 'low' THEN 4
--     WHEN 'info' THEN 5
--   END;

-- Verify CC8.1 - Change Management
-- SELECT COUNT(*) as system_changes
-- FROM "security_events"
-- WHERE "eventType" = 'system_config_change'
--   AND timestamp >= NOW() - INTERVAL '30 days';

-- ============================================
-- SOC2 Compliance Notes
-- ============================================

-- This migration ensures:
-- 1. CC6.1 - Logical and Physical Access Controls (access verification & logging)
-- 2. CC6.2 - Monitoring of Access (continuous access monitoring)
-- 3. CC7.1 - Detection of Processing Deviations (continuous monitoring)
-- 4. CC7.2 - Security Incident Detection (anomaly detection)
-- 5. CC7.3 - Response to Security Incidents (incident management)
-- 6. CC8.1 - Change Management (system change auditing)
-- 7. CC9.2 - Risk Mitigation (risk-based incident prioritization)

-- All existing data is preserved and enriched with SOC2-compliant fields
-- Continuous monitoring supports SOC2 Type II compliance (6-12 month audit period)

-- Next Steps for SOC2 Type II Compliance:
-- 1. Maintain continuous monitoring for 6-12 months
-- 2. Document all security controls and policies
-- 3. Conduct regular security reviews and audits
-- 4. Engage SOC2 auditor for formal assessment
-- 5. Remediate any identified control gaps
-- 6. Obtain SOC2 Type II report
