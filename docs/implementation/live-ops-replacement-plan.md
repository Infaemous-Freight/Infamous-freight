# Live Operations Replacement Plan

Updated: 2026-06-03

## Objective

Replace remaining demo-backed operational surfaces with tenant-safe Prisma/PostgreSQL data while preserving public route safety, paid access gates, and production launch controls.

## Current priority

The current status document identifies these authenticated routes as demo-backed or not ready:

- `/ops`
- `/loads`
- `/dispatch`
- `/ops/drivers`
- `/invoices`
- `/analytics`
- `/compliance`
- `/carriers`
- `/accounting`
- `/quotes`
- `/messages`
- `/driver-app`

This plan turns those routes into live-data implementation tasks.

## Global requirements

Every live operational route must satisfy:

1. Verified user context from trusted auth.
2. Tenant context resolved from membership.
3. Paid subscription enforcement where required.
4. Prisma query scoped by tenant/carrier.
5. No hardcoded production demo records.
6. Empty state instead of fake fallback data.
7. Loading and retry states in the UI.
8. Audit logging for every mutation.
9. Tests for authorization, happy path, empty state, and cross-tenant denial.
10. Production evidence captured after deployment.

## API endpoint plan

### Operations dashboard

Route: `/ops`

API endpoints:

- `GET /api/ops/summary`
- `GET /api/ops/recent-activity`
- `GET /api/ops/exceptions`

Data sources:

- `Load`
- `Driver`
- `ShipmentTracking`
- `DispatchIncident`
- `DispatchSlaTimer`
- `OperationalMetric`

Acceptance criteria:

- Summary metrics use live carrier-scoped DB queries.
- No demo KPI cards appear in production unless explicitly enabled for controlled demos.
- Exceptions come from live dispatch incidents and SLA timers.

### Loads

Route: `/loads`

API endpoints:

- `GET /api/loads`
- `POST /api/loads`
- `GET /api/loads/:id`
- `PATCH /api/loads/:id`
- `PATCH /api/loads/:id/status`

Acceptance criteria:

- List is tenant-scoped.
- Mutations write audit logs.
- Status transitions are validated.
- Cross-tenant load lookup returns 404 or 403 without leaking existence.

### Dispatch

Route: `/dispatch`

API endpoints:

- `GET /api/dispatch/board`
- `POST /api/dispatch/assignments`
- `PATCH /api/dispatch/assignments/:id`
- `POST /api/dispatch/incidents`
- `PATCH /api/dispatch/incidents/:id/resolve`

Acceptance criteria:

- Board reads live loads, drivers, dispatch records, incidents, and SLA timers.
- Assignment mutations create audit logs.
- Incident creation can be manual or automation-generated.

### Drivers

Route: `/ops/drivers`

API endpoints:

- `GET /api/drivers`
- `POST /api/drivers`
- `GET /api/drivers/:id`
- `PATCH /api/drivers/:id`
- `PATCH /api/drivers/:id/status`
- `POST /api/drivers/:id/location`

Acceptance criteria:

- Driver roster is live and tenant-scoped.
- Location updates do not expose private coordinates cross-tenant.
- HOS risk events are generated when thresholds are crossed.

### Invoices and accounting

Routes: `/invoices`, `/accounting`

API endpoints:

- `GET /api/invoices`
- `POST /api/invoices`
- `PATCH /api/invoices/:id`
- `PATCH /api/invoices/:id/mark-paid`
- `GET /api/accounting/summary`
- `GET /api/accounting/payments`

Acceptance criteria:

- Invoice/payment records are live.
- Billing routes remain owner/admin protected.
- Payment status changes write audit logs.

### Analytics

Route: `/analytics`

API endpoints:

- `GET /api/analytics/executive`
- `GET /api/analytics/revenue`
- `GET /api/analytics/dispatch`
- `GET /api/analytics/drivers`
- `GET /api/analytics/sla`

Acceptance criteria:

- Reads live materialized views when available.
- Falls back to bounded live queries only in development/staging.
- Responses are tenant-scoped and cache-safe.

### Compliance

Route: `/compliance`

API endpoints:

- `GET /api/compliance/documents`
- `POST /api/compliance/documents`
- `PATCH /api/compliance/documents/:id`
- `GET /api/compliance/expiring`

Acceptance criteria:

- Document and expiration data is live.
- Document metadata is tenant-scoped.
- File contents are never exposed through general list endpoints.

### Quotes

Route: `/quotes`

API endpoints:

- `GET /api/quotes`
- `POST /api/quotes`
- `PATCH /api/quotes/:id`
- `PATCH /api/quotes/:id/status`

Acceptance criteria:

- Internal quote workflows are live.
- Public quote intake remains sanitized.
- Quote status changes write audit logs.

### Carriers

Route: `/carriers`

API endpoints:

- `GET /api/carriers/current`
- `PATCH /api/carriers/current`
- `GET /api/carriers/members`
- `POST /api/carriers/members/invite`
- `PATCH /api/carriers/members/:id`

Acceptance criteria:

- Carrier profile and team management are live.
- Role changes write audit logs.
- Owner/admin guard protects team management.

## UI replacement rules

For each route:

1. Identify all demo/mock constants.
2. Replace with API client calls.
3. Add loading skeletons.
4. Add empty states.
5. Add error states with retry.
6. Add production guard that prevents fake data unless `VITE_ENABLE_DEMO_DATA=true`.
7. Add tests that fail if demo labels/fixtures render in production mode.

## Testing matrix

Each route needs:

- unit tests for API client parsing;
- API tests for tenant scoping;
- API tests for RBAC enforcement;
- UI test for loading state;
- UI test for empty state;
- UI test for error state;
- smoke test route coverage.

## Production evidence

After deployment, capture evidence for:

- authenticated login;
- real tenant loading `/ops`;
- live loads list;
- live driver roster;
- live dispatch board;
- live invoice/accounting route;
- live analytics route;
- public tracking still safe;
- billing route still protected and functional.

## Completion definition

The live operations replacement is complete only when current status can be changed from demo-backed to live for every route listed above, with test results and production evidence recorded.