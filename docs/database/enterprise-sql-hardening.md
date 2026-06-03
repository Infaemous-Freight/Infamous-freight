# Enterprise SQL Hardening Guide

Updated: 2026-06-03

This guide converts the SQL recommendations for INFÆMOUS FREIGHT into production-ready database patterns for the active Prisma-backed PostgreSQL API.

## Current repo baseline

The active schema already includes freight-domain models for carriers, drivers, loads, public shipments, tracking events, dispatch, billing, payments, operational metrics, AI usage, and Stripe webhook events in `apps/api/prisma/schema.prisma`.

Because the production launch notes still require migration review and evidence capture before approval, every query below is intentionally written as reviewable SQL. Apply to production only after staging verification, backup confirmation, and operator approval.

## Core rules

1. Never query private freight records without tenant scoping.
2. Prefer `carrierId` / `carrier_id` indexes on all private operational tables.
3. Public shipment tracking must remain sanitized and separate from private load/driver/customer data.
4. Use `EXPLAIN (ANALYZE, BUFFERS)` in staging before applying new dashboard queries to production.
5. Keep dashboard reads bounded by date ranges, status filters, and indexes.
6. Treat RLS as a security layer, not a replacement for verified API authorization.

## Tenant-safe query patterns

### Active loads for one carrier

```sql
SELECT id, broker_name, origin_city, origin_state, dest_city, dest_state, status, pickup_date, delivery_date, rate
FROM loads
WHERE carrier_id = $1
  AND status IN ('available', 'assigned', 'dispatched', 'in_transit')
ORDER BY pickup_date ASC
LIMIT 100;
```

### Driver roster for one carrier

```sql
SELECT id, name, phone, equipment_type, status, hos_status, hours_remaining, last_location_at
FROM drivers
WHERE carrier_id = $1
ORDER BY status ASC, name ASC
LIMIT 250;
```

### Recent shipment tracking for one carrier

```sql
SELECT st.id, st.load_id, st.status, st.latitude, st.longitude, st.delivery_eta, st.delivered_at, st.updated_at
FROM shipment_tracking st
JOIN loads l ON l.id = st.load_id
WHERE l.carrier_id = $1
ORDER BY st.updated_at DESC
LIMIT 100;
```

### Public tracking lookup

```sql
SELECT tracking_number, route, origin, destination, status, pickup_date, delivery_date, eta, equipment, public_notes, timeline, updated_at
FROM public_shipments
WHERE tracking_number = $1
LIMIT 1;
```

Only fields in this public table should be exposed by unauthenticated tracking routes.

## Dashboard KPI queries

### Carrier operations dashboard

```sql
SELECT
  (SELECT COUNT(*) FROM loads WHERE carrier_id = $1 AND status IN ('assigned', 'dispatched', 'in_transit')) AS active_loads,
  (SELECT COUNT(*) FROM drivers WHERE carrier_id = $1 AND status = 'available') AS available_drivers,
  (SELECT COALESCE(SUM(rate), 0) FROM loads WHERE carrier_id = $1 AND created_at >= date_trunc('month', now())) AS monthly_revenue,
  (SELECT COUNT(*) FROM shipment_tracking st JOIN loads l ON l.id = st.load_id WHERE l.carrier_id = $1 AND st.status = 'delivered' AND st.delivered_at >= date_trunc('day', now())) AS delivered_today;
```

### Top customers / brokers by revenue

```sql
SELECT broker_name, COALESCE(SUM(rate), 0) AS total_revenue, COUNT(*) AS load_count
FROM loads
WHERE carrier_id = $1
  AND created_at >= now() - interval '90 days'
GROUP BY broker_name
ORDER BY total_revenue DESC
LIMIT 10;
```

### Delayed in-transit loads

```sql
SELECT l.id, l.broker_name, l.origin_city, l.origin_state, l.dest_city, l.dest_state, l.pickup_date, l.delivery_date, st.updated_at AS last_tracking_update
FROM loads l
LEFT JOIN LATERAL (
  SELECT updated_at
  FROM shipment_tracking
  WHERE load_id = l.id
  ORDER BY updated_at DESC
  LIMIT 1
) st ON true
WHERE l.carrier_id = $1
  AND l.status = 'in_transit'
  AND COALESCE(st.updated_at, l.created_at) < now() - interval '48 hours'
ORDER BY COALESCE(st.updated_at, l.created_at) ASC
LIMIT 100;
```

## Recommended indexes

The Prisma schema already defines several carrier/status indexes. Use the companion SQL file at `docs/database/sql/enterprise-indexes-and-rls.sql` for a reviewable index/RLS checklist.

High-priority private table indexes:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loads_carrier_status_pickup
ON loads (carrier_id, status, pickup_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loads_carrier_created_rate
ON loads (carrier_id, created_at, rate);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_carrier_status_name
ON drivers (carrier_id, status, name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipment_tracking_load_updated
ON shipment_tracking (load_id, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_public_shipments_status_updated
ON public_shipments (status, updated_at DESC);
```

Do not put `CREATE INDEX CONCURRENTLY` inside a Prisma transaction-based migration. Use a controlled SQL deployment path or convert to non-concurrent indexes for local-only migrations.

## RLS posture

For Supabase/PostgreSQL RLS, private freight tables should use tenant-scoped policies that match the active carrier/org context. The API must set the tenant context before DB access if RLS is enforced at the database layer.

Recommended session variable pattern:

```sql
SELECT set_config('app.current_carrier_id', $1, true);
```

Recommended policy shape:

```sql
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY loads_carrier_isolation
ON loads
USING (carrier_id = current_setting('app.current_carrier_id', true))
WITH CHECK (carrier_id = current_setting('app.current_carrier_id', true));
```

Apply the equivalent pattern to private freight tables such as `drivers`, `invoices`, `documents`, `team_members`, `quote_requests`, `load_assignments`, `load_dispatches`, `carrier_payments`, `operational_metrics`, `dispatch_incidents`, `dispatch_alerts`, `dispatch_sla_timers`, `hos_risk_events`, and `ai_usage_events` after confirming exact table names from generated migrations.

Public tracking remains separate: `public_shipments` may allow narrow public read access through the API, but it must not join back to private tables in unauthenticated routes.

## Verification workflow

Run these checks before merging/applying database hardening:

```bash
pnpm run prisma:validate
pnpm -C apps/api run prisma:generate
pnpm -C apps/api run lint
pnpm -C apps/api run test
pnpm run build
```

For database performance review in staging:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, broker_name, status, pickup_date
FROM loads
WHERE carrier_id = 'replace-with-staging-carrier-id'
  AND status IN ('assigned', 'dispatched', 'in_transit')
ORDER BY pickup_date ASC
LIMIT 100;
```

## Production go/no-go

Approve production SQL only when:

- staging query plans are acceptable;
- index creation does not lock hot tables during peak traffic;
- tenant context is set by API code before enabling RLS enforcement;
- public tracking responses are still sanitized;
- launch evidence is recorded after smoke tests.
