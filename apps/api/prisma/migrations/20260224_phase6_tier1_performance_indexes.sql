-- Phase 6 Tier 1.2: Production Optimization - Strategic Performance Indexes
-- Expected Impact: 10-20% latency reduction on complex queries
-- Date: 2026-02-24

-- User table composite indexes for analytics and multi-tenant optimization
CREATE INDEX IF NOT EXISTS "users_planTier_idx" ON "users"("planTier");
CREATE INDEX IF NOT EXISTS "users_planStatus_idx" ON "users"("planStatus");
CREATE INDEX IF NOT EXISTS "users_stripeCustomerId_idx" ON "users"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "users_organizationId_createdAt_idx" ON "users"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "users_email_organizationId_idx" ON "users"("email", "organizationId");

-- Driver table composite indexes for availability and performance tracking
CREATE INDEX IF NOT EXISTS "drivers_status_createdAt_idx" ON "drivers"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "drivers_phone_idx" ON "drivers"("phone");

-- Shipment table composite indexes for analytics and status tracking
CREATE INDEX IF NOT EXISTS "shipments_status_createdAt_idx" ON "shipments"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "shipments_driverId_status_idx" ON "shipments"("driverId", "status");
CREATE INDEX IF NOT EXISTS "shipments_userId_createdAt_idx" ON "shipments"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "shipments_status_updatedAt_idx" ON "shipments"("status", "updatedAt");

-- AiEvent table optimization for analytics
CREATE INDEX IF NOT EXISTS "ai_events_userId_createdAt_idx" ON "ai_events"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_events_provider_createdAt_idx" ON "ai_events"("provider", "createdAt");

-- Organization table optimization for multi-tenant queries
CREATE INDEX IF NOT EXISTS "organizations_isActive_createdAt_idx" ON "organizations"("isActive", "createdAt");

-- Job table optimization (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
        CREATE INDEX IF NOT EXISTS "jobs_status_createdAt_idx" ON "jobs"("status", "createdAt");
        CREATE INDEX IF NOT EXISTS "jobs_shipperId_status_idx" ON "jobs"("shipperId", "status");
    END IF;
END
$$;

-- Comment on optimization strategy
COMMENT ON INDEX "users_organizationId_createdAt_idx" IS 'Phase 6: Optimize analytics queries per organization over time';
COMMENT ON INDEX "shipments_status_createdAt_idx" IS 'Phase 6: Optimize dashboard queries filtering by status and date range';
COMMENT ON INDEX "shipments_driverId_status_idx" IS 'Phase 6: Fast lookup of driver active shipments';
COMMENT ON INDEX "drivers_status_createdAt_idx" IS 'Phase 6: Optimize available driver queries with date filters';
