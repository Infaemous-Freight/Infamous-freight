# Infamous Freight Connector Execution Queue

_Last updated: June 3, 2026._

This queue is the ordered execution plan for the connector and production-readiness work requested for Infamous Freight.

## Execution order

1. Supabase auth verification
2. Stripe production verification
3. DAT integration
4. Truckstop integration
5. Tracking provider integration
6. QuickBooks integration
7. Messaging integration
8. Sentry monitoring
9. Analytics instrumentation
10. Mobile driver operations

## 1. Supabase auth verification

### Goal
Verify production authentication, JWT validation, tenant context, membership checks, role checks, and protected-route enforcement.

### Repository tasks
- Confirm backend JWT verification uses `SUPABASE_JWT_SECRET` with the documented legacy fallback only where needed.
- Confirm frontend Supabase variables are `VITE_SUPABASE_URL` plus either `VITE_SUPABASE_PUBLISHABLE_KEY` or the documented legacy `VITE_SUPABASE_ANON_KEY`.
- Confirm protected API routes reject unauthenticated requests.
- Confirm protected API routes reject requests without valid tenant/member context.
- Confirm RBAC roles are enforced on admin, owner, dispatcher, accounting, shipper, carrier, and driver workflows.
- Add or update tests for tenant mismatch and insufficient role cases.

### Validation
```bash
pnpm run env:check:supabase-client
pnpm run codex:env-check:strict
pnpm -C apps/api run test -- --runInBand
```

### External blockers
- Production Supabase project access
- Production JWT secret in deployment secret manager
- Verified production user/member test account

## 2. Stripe production verification

### Goal
Verify live checkout, billing portal, webhook signature validation, subscription state persistence, and paid-access enforcement.

### Repository tasks
- Confirm `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, checkout success/cancel URLs, and portal return URL are documented and validated.
- Confirm webhook handler verifies Stripe signatures.
- Confirm subscription status gates paid routes.
- Confirm billing events are auditable.
- Add a safe smoke-test checklist for live-mode validation.

### Validation
```bash
pnpm run codex:env-check:strict
pnpm -C apps/api run test -- --runInBand stripe
pnpm run build
```

### External blockers
- Stripe live keys
- Live webhook endpoint configured in Stripe dashboard
- Safe production test customer/payment path

## 3. DAT integration

### Goal
Add a DAT adapter for load-board, rate, and freight-posting workflows behind environment-gated configuration.

### Repository tasks
- Add `datProvider` implementing the shared load-board provider contract.
- Add tests using mocked DAT responses only.
- Add feature flag or configuration gate so DAT is disabled without credentials.
- Ensure provider errors do not expose payloads or secrets.

### Validation
```bash
pnpm -C apps/api run test -- --runInBand integrations
pnpm run typecheck
```

### External blockers
- DAT account approval
- DAT API key
- DAT product permissions for selected API capabilities

## 4. Truckstop integration

### Goal
Add a Truckstop adapter for load posting, search, rate, and carrier-sourcing workflows behind environment-gated configuration.

### Repository tasks
- Add `truckstopProvider` implementing the shared load-board provider contract.
- Keep DAT and Truckstop interchangeable through a provider abstraction.
- Add tests using mocked Truckstop responses only.

### Validation
```bash
pnpm -C apps/api run test -- --runInBand integrations
pnpm run typecheck
```

### External blockers
- Truckstop API approval
- Truckstop credentials
- Enabled Truckstop products/scopes

## 5. Tracking provider integration

### Goal
Normalize shipment visibility updates from providers such as project44, FourKites, Samsara, or Motive into internal shipment status events.

### Repository tasks
- Add tracking provider contract.
- Add mock tracking provider.
- Add adapter slots for project44, FourKites, Samsara, and Motive.
- Keep public tracking payload sanitized.
- Add audit event logging for inbound shipment updates.

### Validation
```bash
pnpm -C apps/api run test -- --runInBand tracking
pnpm run typecheck
```

### External blockers
- Selected tracking provider account
- API key or OAuth credentials
- Carrier/customer configuration

## 6. QuickBooks integration

### Goal
Prepare accounting sync for invoices, payment state, customer records, and settlement workflows.

### Repository tasks
- Add accounting provider contract.
- Add QuickBooks provider slot and mock provider.
- Document OAuth redirect URI and environment requirements.
- Ensure no accounting sync runs unless explicitly configured.

### Validation
```bash
pnpm -C apps/api run test -- --runInBand accounting
pnpm run typecheck
```

### External blockers
- Intuit Developer app
- QuickBooks client ID/secret
- Redirect URI registered in Intuit dashboard
- Connected company/sandbox

## 7. Messaging integration

### Goal
Support transactional SMS/email notifications for quote requests, dispatch updates, tracking changes, billing events, and customer/carrier communication.

### Repository tasks
- Add messaging provider contract.
- Add Twilio, SendGrid, and Resend provider slots.
- Add mock messaging provider.
- Add opt-out and deliverability guardrails to the implementation plan.

### Validation
```bash
pnpm -C apps/api run test -- --runInBand messaging
pnpm run typecheck
```

### External blockers
- Twilio account and sender setup
- SendGrid or Resend verified sender/domain
- Deliverability records and opt-out rules

## 8. Sentry monitoring

### Goal
Capture frontend/API runtime errors with safe release and environment tagging.

### Repository tasks
- Verify Sentry package/configuration is present where used.
- Add Sentry health/config check to connector status when enabled.
- Ensure errors do not include secrets or sensitive freight/customer/carrier payloads.

### Validation
```bash
pnpm run build
pnpm run typecheck
```

### External blockers
- Sentry organization/project
- API/frontend DSNs
- Optional release auth token

## 9. Analytics instrumentation

### Goal
Track product and business-critical events without leaking sensitive shipment, customer, carrier, or payment data.

### Recommended event taxonomy
- `quote_request_started`
- `quote_request_submitted`
- `tracking_lookup_submitted`
- `checkout_started`
- `checkout_completed`
- `login_succeeded`
- `load_created`
- `dispatch_assignment_created`
- `driver_status_updated`
- `customer_portal_opened`
- `carrier_portal_opened`

### Repository tasks
- Decide analytics provider: existing custom events, PostHog, or another approved provider.
- Add analytics wrapper that is disabled without keys.
- Add event payload schema tests.

### Validation
```bash
pnpm -C apps/web run test -- --runInBand analytics
pnpm run typecheck
```

### External blockers
- Analytics provider project/key if PostHog or another external platform is selected

## 10. Mobile driver operations

### Goal
Move mobile from planned/gated status toward real driver workflows.

### Repository tasks
- Define mobile driver auth flow.
- Define driver load assignment screen.
- Define status update workflow.
- Define POD/document upload workflow.
- Define push/SMS notification strategy.
- Ensure mobile APIs use the same tenant/RBAC/security model as web/API.

### Validation
```bash
pnpm run typecheck
pnpm run test
pnpm run build
```

### External blockers
- Mobile deployment target decision
- Push notification provider decision
- Driver test accounts and safe production test data

## Global acceptance criteria

No item should be marked production-ready until:

- Required secrets are stored in the target platform secret manager.
- CI passes with mocked providers.
- Production smoke evidence is recorded.
- Rollback or disable path is documented.
- No secrets are committed.
- Tenant isolation and RBAC rules are preserved.
- Sensitive freight, payment, carrier, customer, and driver data is not exposed in public responses or logs.
