-- Tier 1-3: Security, Compliance, Partner, and Referral Models Migration
-- This migration adds all tables needed for TIER 1-5 recommendations

-- ============================================
-- Two-Factor Authentication (TIER 3)
-- ============================================

CREATE TABLE "two_factor_auth" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "totpSecret" TEXT,
  "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
  "backupCodesHashed" TEXT[],
  "backupCodesUsed" TEXT[],
  "recoveryEmailSent" TIMESTAMP(3),
  "recoveryPhoneNumber" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  CONSTRAINT "two_factor_auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE INDEX "two_factor_auth_userId_idx" ON "two_factor_auth"("userId");

-- ============================================
-- Encryption Key Management (TIER 3)
-- ============================================

CREATE TABLE "encryption_keys" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "keyVersionId" TEXT NOT NULL UNIQUE,
  "keyType" TEXT NOT NULL DEFAULT 'aes-256-gcm',
  "keyStatus" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rotatedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "nextRotationDate" TIMESTAMP(3),
  "createdBy" TEXT,
  "rotationReason" TEXT,
  "encryptedRecords" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "encryption_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE
);

CREATE INDEX "encryption_keys_organizationId_idx" ON "encryption_keys"("organizationId");
CREATE INDEX "encryption_keys_keyStatus_idx" ON "encryption_keys"("keyStatus");
CREATE INDEX "encryption_keys_expiresAt_idx" ON "encryption_keys"("expiresAt");

-- ============================================
-- GDPR Compliance Tracking (TIER 1)
-- ============================================

CREATE TABLE "data_processing_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "dataCategory" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "endpoint" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "retained" BOOLEAN NOT NULL DEFAULT true,
  "retentionUntil" TIMESTAMP(3),
  CONSTRAINT "data_processing_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE INDEX "data_processing_logs_userId_timestamp_idx" ON "data_processing_logs"("userId", "timestamp");
CREATE INDEX "data_processing_logs_operation_idx" ON "data_processing_logs"("operation");
CREATE INDEX "data_processing_logs_purpose_idx" ON "data_processing_logs"("purpose");
CREATE INDEX "data_processing_logs_timestamp_idx" ON "data_processing_logs"("timestamp");

CREATE TABLE "user_consents" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "consentType" TEXT NOT NULL,
  "value" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "grantedAt" TIMESTAMP(3),
  "withdrawnAt" TIMESTAMP(3),
  "recordedIp" TEXT,
  "recordedUserAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_consents_userId_consentType_unique" UNIQUE ("userId", "consentType"),
  CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE INDEX "user_consents_userId_idx" ON "user_consents"("userId");
CREATE INDEX "user_consents_consentType_idx" ON "user_consents"("consentType");

-- ============================================
-- COMPLIANCE AUDITS & REPORTS (TIER 1)
-- ============================================

CREATE TABLE "compliance_audits" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "standard" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  "findingsJson" JSONB,
  "remediationItems" TEXT[],
  "auditDate" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "nextAuditDate" TIMESTAMP(3),
  "evidenceLinks" TEXT[],
  "auditorNotes" TEXT,
  CONSTRAINT "compliance_audits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE
);

CREATE INDEX "compliance_audits_organizationId_standard_idx" ON "compliance_audits"("organizationId", "standard");
CREATE INDEX "compliance_audits_status_idx" ON "compliance_audits"("status");
CREATE INDEX "compliance_audits_auditDate_idx" ON "compliance_audits"("auditDate");

CREATE TABLE "compliance_reports" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "reportType" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "dataProcessedRecords" INTEGER NOT NULL DEFAULT 0,
  "dataAccessEvents" INTEGER NOT NULL DEFAULT 0,
  "dataDeleteRequests" INTEGER NOT NULL DEFAULT 0,
  "securityIncidents" INTEGER NOT NULL DEFAULT 0,
  "complianceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "areasOfConcern" TEXT[],
  "recommendations" TEXT[],
  "reportUrl" TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "compliance_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE
);

CREATE INDEX "compliance_reports_organizationId_period_idx" ON "compliance_reports"("organizationId", "period");
CREATE INDEX "compliance_reports_reportType_idx" ON "compliance_reports"("reportType");

-- ============================================
-- THREAT DETECTION & SECURITY (TIER 3)
-- ============================================

CREATE TABLE "security_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT,
  "userId" TEXT,
  "eventType" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'low',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "endpoint" TEXT,
  "method" TEXT,
  "detectedBy" TEXT NOT NULL,
  "metadata" JSONB,
  "actionTaken" TEXT,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "resolvedAt" TIMESTAMP(3),
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL
);

CREATE INDEX "security_events_organizationId_timestamp_idx" ON "security_events"("organizationId", "timestamp");
CREATE INDEX "security_events_userId_timestamp_idx" ON "security_events"("userId", "timestamp");
CREATE INDEX "security_events_severity_idx" ON "security_events"("severity");
CREATE INDEX "security_events_eventType_idx" ON "security_events"("eventType");

CREATE TABLE "anomaly_detections" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "anomalyType" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "normalBehavior" JSONB,
  "currentBehavior" JSONB,
  "deviation" DOUBLE PRECISION,
  "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "falsePositive" BOOLEAN,
  CONSTRAINT "anomaly_detections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL
);

CREATE INDEX "anomaly_detections_userId_idx" ON "anomaly_detections"("userId");
CREATE INDEX "anomaly_detections_anomalyType_idx" ON "anomaly_detections"("anomalyType");
CREATE INDEX "anomaly_detections_confidence_idx" ON "anomaly_detections"("confidence");

-- ============================================
-- USAGE METERING & ANALYTICS (TIER 1 & 2)
-- ============================================

CREATE TABLE "usage_metrics" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "metricName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "value" DOUBLE PRECISION,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "month" TEXT NOT NULL,
  CONSTRAINT "usage_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE,
  CONSTRAINT "usage_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL
);

CREATE INDEX "usage_metrics_organizationId_month_idx" ON "usage_metrics"("organizationId", "month");
CREATE INDEX "usage_metrics_organizationId_metricName_idx" ON "usage_metrics"("organizationId", "metricName");
CREATE INDEX "usage_metrics_recordedAt_idx" ON "usage_metrics"("recordedAt");

-- ============================================
-- PARTNER PROGRAM (TIER 2)
-- ============================================

CREATE TABLE "partners" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT,
  "name" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "website" TEXT,
  "tier" TEXT NOT NULL DEFAULT 'RESELLER',
  "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "approvedAt" TIMESTAMP(3),
  "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "transactionCount" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "partners_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL
);

CREATE INDEX "partners_tier_idx" ON "partners"("tier");
CREATE INDEX "partners_isActive_idx" ON "partners"("isActive");
CREATE INDEX "partners_createdAt_idx" ON "partners"("createdAt");

CREATE TABLE "partner_commissions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "partnerId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "commissionRate" DOUBLE PRECISION NOT NULL,
  "commission" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_commissions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners" ("id") ON DELETE CASCADE
);

CREATE INDEX "partner_commissions_partnerId_idx" ON "partner_commissions"("partnerId");
CREATE INDEX "partner_commissions_status_idx" ON "partner_commissions"("status");
CREATE INDEX "partner_commissions_createdAt_idx" ON "partner_commissions"("createdAt");

-- ============================================
-- REFERRAL PROGRAM (TIER 2)
-- ============================================

CREATE TABLE "referrals" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "referrerUserId" TEXT NOT NULL,
  "referreeEmail" TEXT NOT NULL,
  "referreeUserId" TEXT,
  "directReward" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "indirectReward" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "convertedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "referralTier" TEXT NOT NULL DEFAULT 'bronze',
  "fraudDetected" BOOLEAN NOT NULL DEFAULT false,
  "fraudReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "referrals_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "referrals_referreeUserId_fkey" FOREIGN KEY ("referreeUserId") REFERENCES "users" ("id") ON DELETE SET NULL
);

CREATE INDEX "referrals_referrerUserId_idx" ON "referrals"("referrerUserId");
CREATE INDEX "referrals_status_idx" ON "referrals"("status");
CREATE INDEX "referrals_convertedAt_idx" ON "referrals"("convertedAt");
CREATE INDEX "referrals_createdAt_idx" ON "referrals"("createdAt");

-- ============================================
-- UPSELL & CHURN PREDICTION (TIER 2)
-- ============================================

CREATE TABLE "churn_predictions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "riskFactors" JSONB NOT NULL,
  "recommendedAction" TEXT,
  "recommendedOffer" JSONB,
  "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actionTaken" TEXT,
  "actionAt" TIMESTAMP(3),
  "result" TEXT,
  CONSTRAINT "churn_predictions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE
);

CREATE INDEX "churn_predictions_organizationId_riskScore_idx" ON "churn_predictions"("organizationId", "riskScore");
CREATE INDEX "churn_predictions_predictedAt_idx" ON "churn_predictions"("predictedAt");

CREATE TABLE "upsell_opportunities" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "opportunityType" TEXT NOT NULL,
  "targetTier" TEXT,
  "estimatedValue" DOUBLE PRECISION,
  "reason" TEXT,
  "contextJson" JSONB,
  "campaignId" TEXT,
  "campaignStatus" TEXT NOT NULL DEFAULT 'draft',
  "exposed" TIMESTAMP(3),
  "clicked" TIMESTAMP(3),
  "converted" TIMESTAMP(3),
  CONSTRAINT "upsell_opportunities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE
);

CREATE INDEX "upsell_opportunities_organizationId_idx" ON "upsell_opportunities"("organizationId");
CREATE INDEX "upsell_opportunities_campaignStatus_idx" ON "upsell_opportunities"("campaignStatus");

-- ============================================
-- DISASTER RECOVERY & BACKUPS (TIER 1)
-- ============================================

CREATE TABLE "backup_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "backupType" TEXT NOT NULL,
  "backupDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "s3Key" TEXT NOT NULL,
  "size" BIGINT,
  "status" TEXT NOT NULL DEFAULT 'success',
  "checksumSha256" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "retentionUntil" TIMESTAMP(3)
);

CREATE INDEX "backup_logs_backupDate_idx" ON "backup_logs"("backupDate");
CREATE INDEX "backup_logs_status_idx" ON "backup_logs"("status");
CREATE INDEX "backup_logs_backupType_idx" ON "backup_logs"("backupType");

CREATE TABLE "restore_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "backupLogId" TEXT,
  "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reason" TEXT NOT NULL,
  "initiatedBy" TEXT,
  "rto" INTEGER,
  "rpo" INTEGER,
  "errors" TEXT
);

CREATE INDEX "restore_logs_status_idx" ON "restore_logs"("status");
CREATE INDEX "restore_logs_initiatedAt_idx" ON "restore_logs"("initiatedAt");
