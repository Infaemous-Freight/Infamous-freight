# Infamous Freight Automation Sprints

This plan turns the automation overview into deployable, tenant-safe increments. Each sprint must preserve Supabase JWT verification, RBAC, organization isolation, Stripe webhook verification, and auditability.

## Cross-sprint guardrails

- Every protected API route must use verified authentication, tenant resolution, RBAC, and active subscription checks before touching freight data.
- Every Prisma query must scope records by the tenant/carrier identifier and must not trust client-supplied tenant or role headers in production trusted-auth mode.
- Public intake routes may collect non-sensitive lead data only; production freight operations must stay on authenticated routes.
- Automated decisions are recommendations until an authorized user confirms them, unless a future sprint explicitly adds a reviewed approval workflow.
- Notification and retry records must avoid secrets, raw tokens, payment credentials, private keys, or full document payloads.

## Sprint 1: Quote intake automation

Implemented first as a production-safe API increment:

- `POST /api/loads/intake` creates a tenant-scoped `quoteRequests` record from validated quote intake fields.
- Validation rejects missing required fields, invalid dates/emails, delivery deadlines before pickup, non-positive rates/weights, and unprofitable quotes.
- Genesis prioritization is integrated as a deterministic local scoring adapter with no hidden network calls or unsupported system authority.
- Notification queue items are deterministic in-app queue descriptors and are audit logged for dispatcher/admin routing.
- The endpoint stays behind the existing protected API chain: tenant, role, and paid-subscription middleware.

## Sprint 2: Carrier matching automation

Recommended next increment:

1. Add carrier profile fields through Prisma migrations with `carrierId`/tenant ownership and indexes for equipment, lanes, status, and insurance expiration.
2. Add a protected carrier search endpoint that only returns carrier records visible to the authenticated tenant context.
3. Implement matching as ranked recommendations, not automatic carrier approval.
4. Queue notifications for candidate carrier matches with deterministic dedupe keys.
5. Add tests for tenant isolation, role restrictions, expired insurance handling, and prompt-injection style unsafe requests.

## Sprint 3: Load assignment automation

Recommended sequence:

1. Add immutable assignment history with tenant-scoped load/carrier references.
2. Add protected load assignment endpoints that preserve the existing assignment transition rules.
3. Implement recommendation scoring for eligible drivers/carriers, with compliance checks before any assignment is offered.
4. Queue assignment notifications without exposing shipper margin or private customer data.
5. Test accepted/rejected terminal states, tenant boundaries, and role restrictions.

## Sprint 4: Freight marketplace integration

Recommended sequence:

1. Add marketplace listing tables with tenant ownership, listing status, external provider IDs, and idempotency keys.
2. Add protected listing endpoints that require dispatcher/admin/owner access.
3. Implement marketplace sync jobs with provider allowlists, retry limits, and audit events.
4. Queue marketplace update notifications using redacted operational summaries.
5. Test provider failures, retries, duplicate sync events, and tenant-scoped marketplace listing access.

## Sprint 5: Reporting and analytics

Recommended sequence:

1. Add reporting tables or materialized projections only after the source operational tables are stable.
2. Add reporting endpoints that aggregate by tenant and do not leak cross-tenant metrics.
3. Add scheduled reporting jobs with idempotent date-window keys.
4. Integrate visualization using aggregated responses, not raw cross-tenant datasets.
5. Test report window boundaries, RBAC access, tenant isolation, and degraded dependency behavior.

## Deployment impact

Sprint 1 adds one protected API route and no new environment variables. It reuses existing quote request storage and audit logging, so rollback is a code revert with no data migration rollback required.

## Rollback plan

1. Revert the commit that adds the quote intake automation route and helper module.
2. Redeploy the previous API image.
3. Existing `quoteRequests` rows created by the endpoint can remain as normal pending/needs-review quote requests.
4. If operators need to disable the flow before redeploy, remove or hide client entry points that call `POST /api/loads/intake`.
