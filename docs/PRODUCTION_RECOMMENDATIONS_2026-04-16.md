# Production Recommendations (April 16, 2026)

These recommendations are prioritized to keep Infamous Freight stable, secure, and deployment-ready.

## 1) Authentication hardening
- Enforce a single auth middleware path for all API routes that touch tenant data.
- Add a CI guard that fails if protected routes are registered without auth middleware.
- Standardize token verification errors to avoid leaking internals.

## 2) Tenant isolation guarantees
- Introduce a Prisma query helper that requires `tenantId` for all tenant-scoped models.
- Add integration tests that assert cross-tenant access always returns 403/404.
- Add static checks (eslint/custom rule) for unsafe tenant queries in `apps/api`.

## 3) RBAC consistency
- Centralize permission checks in one reusable service or middleware layer.
- Add route-level tests that verify unauthorized roles cannot access protected endpoints.
- Audit routes for mixed inline permission logic and migrate to shared guards.

## 4) Configuration and environment safety
- Validate all required env vars at process startup (fail fast).
- Separate required vars by runtime (`api`, `web`, `worker`) and environment (`dev`, `staging`, `prod`).
- Ensure `SENTRY_DSN` is optional and Sentry remains disabled when unset.

## 5) Shared contracts and type safety
- Move API request/response contracts to shared packages and consume from both API and web.
- Gate merges on `tsc --noEmit` for all workspaces.
- Add API schema drift checks in CI.

## 6) Audit logging completeness
- Require `AiDecisionLog` writes for all AI decision points.
- Add explicit correlation IDs so decisions can be traced to requests and billing events.
- Add tests that fail when decision-producing code paths skip audit writes.

## 7) Error handling and resilience
- Standardize error envelopes (`code`, `message`, `requestId`, optional `details`).
- Keep Sentry capture middleware after routes and before custom error middleware.
- Add non-production `GET /debug/sentry` verification only when Sentry is configured.

## 8) Billing idempotency safety
- Use `BillingEvent` idempotency keys for all Stripe webhook and mutation handlers.
- Add replay tests for duplicate webhook events.
- Ensure idempotency key uniqueness scope is documented (event type + provider ID + tenant).

## 9) Build/test/deploy reliability
- In CI: run `prisma generate` before build/tests for every app relying on Prisma.
- Enforce `pnpm -r test -- --no-file-parallelism` for stability-sensitive suites.
- Verify Docker startup path binds to `PORT=3000` and `/health` returns 200.

## Suggested execution order (next 2 sprints)
1. Tenant query guardrails + RBAC centralization.
2. Env validation + shared error envelope.
3. Billing idempotency replay coverage + AI decision audit test coverage.
4. CI enforcement for protected routes/auth and tenant-safe query checks.
