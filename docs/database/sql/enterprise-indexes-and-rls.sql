-- INFÆMOUS FREIGHT enterprise indexes and RLS checklist
-- Updated: 2026-06-03
--
-- Purpose:
--   Reviewable PostgreSQL hardening SQL for tenant isolation, RLS, audit logging,
--   dispatch SLA monitoring, and analytics-readiness.
--
-- Safety:
--   1. Run in staging first.
--   2. Confirm exact generated table names before production.
--   3. Do not run CREATE INDEX CONCURRENTLY inside a transaction.
--   4. Enable RLS only after the API sets app.current_carrier_id for each request.

-- =========================================================
-- 1) Tenant isolation indexes
-- =========================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loads_carrier_status_pickup
ON loads (carrier_id, status, pickup_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loads_carrier_created_rate
ON loads (carrier_id, created_at, rate);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_carrier_status_name
ON drivers (carrier_id, status, name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_carrier_status_created
ON invoices (carrier_id, status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_carrier_status_expiry
ON documents (carrier_id, status, expiry_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_carrier_email_status
ON team_members (carrier_id, email, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quote_requests_carrier_status_created
ON quote_requests (carrier_id, status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_load_assignments_carrier_status_created
ON load_assignments (carrier_id, status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_load_dispatches_carrier_status_updated
ON load_dispatches (carrier_id, status, updated_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carrier_payments_carrier_status_created
ON carrier_payments (carrier_id, status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operational_metrics_carrier_period_date
ON operational_metrics (carrier_id, period, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispatch_incidents_carrier_status_sla
ON dispatch_incidents (carrier_id, status, sla_due_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispatch_alerts_carrier_status_created
ON dispatch_alerts (carrier_id, status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispatch_sla_timers_carrier_status_due
ON dispatch_sla_timers (carrier_id, status, due_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hos_risk_events_carrier_status_triggered
ON hos_risk_events (carrier_id, status, triggered_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_usage_events_carrier_feature_created
ON ai_usage_events (carrier_id, feature, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipment_tracking_load_updated
ON shipment_tracking (load_id, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_public_shipments_status_updated
ON public_shipments (status, updated_at DESC);

-- =========================================================
-- 2) Audit logging expansion
-- =========================================================
-- Existing Prisma model AuditLog is not carrier-scoped yet. This SQL hardening path
-- adds carrier/user/action lookup performance if the underlying table has or gains
-- carrier_id / request_id / ip_address columns.

-- Suggested future columns, after Prisma migration review:
-- ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS carrier_id text;
-- ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_id text;
-- ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address text;
-- ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata jsonb;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_created
ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created
ON audit_logs (user_id, created_at DESC);

-- Enable only after carrier_id exists:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_carrier_action_created
-- ON audit_logs (carrier_id, action, created_at DESC);

-- =========================================================
-- 3) RLS tenant isolation policies
-- =========================================================
-- The API should set this once per request/transaction before private DB access:
--   SELECT set_config('app.current_carrier_id', '<carrier-id>', true);
--
-- Use current_setting(..., true) so missing context returns NULL instead of throwing.
-- Missing context should match zero private rows.

-- Loads
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS loads_carrier_isolation ON loads;
CREATE POLICY loads_carrier_isolation
ON loads
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS drivers_carrier_isolation ON drivers;
CREATE POLICY drivers_carrier_isolation
ON drivers
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_carrier_isolation ON invoices;
CREATE POLICY invoices_carrier_isolation
ON invoices
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_carrier_isolation ON documents;
CREATE POLICY documents_carrier_isolation
ON documents
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Team members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_members_carrier_isolation ON team_members;
CREATE POLICY team_members_carrier_isolation
ON team_members
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Quote requests
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quote_requests_carrier_isolation ON quote_requests;
CREATE POLICY quote_requests_carrier_isolation
ON quote_requests
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Load assignments
ALTER TABLE load_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS load_assignments_carrier_isolation ON load_assignments;
CREATE POLICY load_assignments_carrier_isolation
ON load_assignments
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Load dispatches
ALTER TABLE load_dispatches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS load_dispatches_carrier_isolation ON load_dispatches;
CREATE POLICY load_dispatches_carrier_isolation
ON load_dispatches
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Carrier payments
ALTER TABLE carrier_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS carrier_payments_carrier_isolation ON carrier_payments;
CREATE POLICY carrier_payments_carrier_isolation
ON carrier_payments
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Operational metrics
ALTER TABLE operational_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS operational_metrics_carrier_isolation ON operational_metrics;
CREATE POLICY operational_metrics_carrier_isolation
ON operational_metrics
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Dispatch incidents
ALTER TABLE dispatch_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dispatch_incidents_carrier_isolation ON dispatch_incidents;
CREATE POLICY dispatch_incidents_carrier_isolation
ON dispatch_incidents
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Dispatch alerts
ALTER TABLE dispatch_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dispatch_alerts_carrier_isolation ON dispatch_alerts;
CREATE POLICY dispatch_alerts_carrier_isolation
ON dispatch_alerts
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Dispatch SLA timers
ALTER TABLE dispatch_sla_timers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dispatch_sla_timers_carrier_isolation ON dispatch_sla_timers;
CREATE POLICY dispatch_sla_timers_carrier_isolation
ON dispatch_sla_timers
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- HOS risk events
ALTER TABLE hos_risk_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hos_risk_events_carrier_isolation ON hos_risk_events;
CREATE POLICY hos_risk_events_carrier_isolation
ON hos_risk_events
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- AI usage events
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_usage_events_carrier_isolation ON ai_usage_events;
CREATE POLICY ai_usage_events_carrier_isolation
ON ai_usage_events
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));

-- Shipment tracking is scoped through loads.
ALTER TABLE shipment_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shipment_tracking_carrier_isolation ON shipment_tracking;
CREATE POLICY shipment_tracking_carrier_isolation
ON shipment_tracking
USING (
  EXISTS (
    SELECT 1
    FROM loads
    WHERE loads.id = shipment_tracking.load_id
      AND loads.carrier_id = current_setting('app.current_carrier_id', true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM loads
    WHERE loads.id = shipment_tracking.load_id
      AND loads.carrier_id = current_setting('app.current_carrier_id', true)
  )
);

-- Public tracking table: keep explicit and narrow. Prefer API-only access in production.
-- Do not add RLS policies that expose private joins through public_shipments.

-- =========================================================
-- 4) Dispatch SLA monitoring queries
-- =========================================================

-- Open overdue SLA timers by carrier.
-- Replace $1 with carrier id in application code.
-- SELECT id, incident_id, due_at, created_at
-- FROM dispatch_sla_timers
-- WHERE carrier_id = $1
--   AND status = 'open'
--   AND due_at < now()
-- ORDER BY due_at ASC
-- LIMIT 100;

-- Incident queue ordered by urgency.
-- SELECT id, load_id, priority, severity, status, sla_due_at, created_at
-- FROM dispatch_incidents
-- WHERE carrier_id = $1
--   AND status = 'open'
-- ORDER BY priority DESC, sla_due_at ASC NULLS LAST, created_at ASC
-- LIMIT 100;

-- =========================================================
-- 5) Enterprise analytics warehouse starter views
-- =========================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_carrier_loads AS
SELECT
  carrier_id,
  date_trunc('day', created_at)::date AS metric_date,
  COUNT(*) AS loads_created,
  COUNT(*) FILTER (WHERE status = 'delivered') AS loads_delivered,
  COALESCE(SUM(rate), 0) AS gross_revenue,
  COALESCE(AVG(rate_per_mile), 0) AS avg_rate_per_mile
FROM loads
GROUP BY carrier_id, date_trunc('day', created_at)::date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_carrier_loads_unique
ON analytics_daily_carrier_loads (carrier_id, metric_date);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_dispatch_sla AS
SELECT
  carrier_id,
  date_trunc('day', created_at)::date AS metric_date,
  COUNT(*) AS sla_timers_created,
  COUNT(*) FILTER (WHERE status = 'open' AND due_at < now()) AS overdue_open_timers,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed_timers
FROM dispatch_sla_timers
GROUP BY carrier_id, date_trunc('day', created_at)::date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_dispatch_sla_unique
ON analytics_daily_dispatch_sla (carrier_id, metric_date);

-- Refresh cadence recommendation:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_carrier_loads;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_dispatch_sla;
