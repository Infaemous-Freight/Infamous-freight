# Infamous Freight — Phase 5 Launch Validation

Date: April 26, 2026
Status: Phase 5 UI and launch validation path added

## Purpose

Phase 5 gives the operations team a browser-based validation console for the freight workflow API added in Phases 3 and 4.

The validation page is available at:

```text
/launch-validation
```

## What the page validates

The page runs end-to-end workflow checks against the configured API using the signed-in user's carrier context.

It validates:

1. Quote to load conversion
2. Load assignment acceptance
3. Dispatch confirmation
4. Shipment tracking update
5. POD / delivery verification
6. Carrier payment status update
7. Operational metric rollup
8. Load board post lifecycle

## Required environment

The web app must have a valid API URL configured:

```env
VITE_API_URL=https://api.infamousfreight.com
```

The API must have production database access configured through:

```env
DATABASE_URL=postgresql://...
```

## Production migration readiness

Do not run the launch validation page against production until the production migration plan is confirmed.

For an existing production database that already has the original baseline tables, mark the baseline migration as applied first:

```bash
npm --prefix apps/api exec prisma migrate resolve --applied 20260425000000_baseline_schema --schema prisma/schema.prisma
```

Then deploy pending migrations:

```bash
npm --prefix apps/api exec prisma migrate deploy --schema prisma/schema.prisma
```

## Recommended launch sequence

1. Confirm CI is green on `main`.
2. Confirm production environment variables are present.
3. Apply database migration to staging first.
4. Run `/launch-validation` against staging.
5. Apply production migration.
6. Run `/launch-validation` against production with an internal carrier account.
7. Review generated validation records in the dashboard/API.
8. Disable or restrict access to launch validation if the page should not remain available to all dispatcher/admin users.

## Access control note

The page uses the existing app auth/session context. It calls API endpoints with:

- `x-tenant-id`
- `x-user-role`

For stricter production control, restrict the route to owner/admin users or hide it behind a feature flag before broad rollout.

## Operational note

The validation page creates real workflow records in the selected environment. Use it with an internal test carrier account, not a live customer tenant.
