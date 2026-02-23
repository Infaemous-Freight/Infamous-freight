-- CreateTable: AuditLog (cross-service general audit logging)
CREATE TABLE "audit_logs" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "action"         TEXT NOT NULL,
    "resource"       TEXT,
    "resourceType"   TEXT,
    "resourceId"     TEXT,
    "recordId"       TEXT,
    "entityType"     TEXT,
    "entityId"       TEXT,
    "method"         TEXT,
    "status"         TEXT,
    "ipAddress"      TEXT,
    "userAgent"      TEXT,
    "reason"         TEXT,
    "changeType"     TEXT,
    "dataSnapshot"   TEXT,
    "beforeSnapshot" TEXT,
    "afterSnapshot"  TEXT,
    "details"        TEXT,
    "metadata"       JSONB,
    "changes"        JSONB,
    "timestamp"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_userId_action_idx" ON "audit_logs"("userId", "action");
