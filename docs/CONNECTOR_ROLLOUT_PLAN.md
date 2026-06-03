# Infamous Freight Connector Rollout Plan

_Last updated: June 3, 2026._

This plan converts the recommended Infamous Freight connector stack into an implementation-ready production sequence. It separates work that can be completed inside the repository from work that requires external vendor approval, account access, or private credentials.

## Objectives

- Keep freight, billing, tracking, and messaging integrations environment-gated.
- Avoid committing secrets or provider credentials.
- Use adapter boundaries so DAT, Truckstop, tracking providers, accounting providers, and messaging providers can be enabled independently.
- Mock external provider calls in CI.
- Record launch evidence before declaring any connector production-ready.

## Connector priority

| Priority | Connector area | Recommended providers | Product value | Status gate |
| --- | --- | --- | --- | --- |
| 1 | Auth and tenancy | Supabase | Secure user, organization, membership, and RBAC context | JWT, RLS, membership, and role checks verified |
| 1 | Billing | Stripe | Checkout, portal, subscription enforcement, webhook events | Live webhook and paid-access smoke test recorded |
| 2 | Load boards | DAT, Truckstop | Load posting, search, rates, carrier sourcing | Provider credentials approved and mocked tests pass |
| 2 | Shipment visibility | project44, FourKites, Samsara, Motive | Tracking updates, ETAs, exception visibility | Sanitized public payload and internal audit trail verified |
| 3 | Accounting | QuickBooks Online, Xero | Invoices, settlement, bookkeeping sync | OAuth app, redirect URI, and sandbox sync verified |
| 3 | Messaging | Twilio, SendGrid, Resend | SMS/email notifications, quote and dispatch updates | Deliverability test and opt-out rules verified |
| 4 | Observability | Sentry, PostHog or existing analytics | Error tracking, product usage, conversion visibility | DSN/key configured and test event captured |

## Repository-side work

These tasks can be completed without vendor credentials.

### 1. Provider abstraction

Create adapter boundaries under the API app when implementation begins:

```text
apps/api/src/integrations/
  loadBoards/
    loadBoardProvider.ts
    datProvider.ts
    truckstopProvider.ts
    mockLoadBoardProvider.ts
  tracking/
    trackingProvider.ts
    project44Provider.ts
    fourKitesProvider.ts
    samsaraProvider.ts
    motiveProvider.ts
    mockTrackingProvider.ts
  accounting/
    accountingProvider.ts
    quickBooksProvider.ts
    xeroProvider.ts
    mockAccountingProvider.ts
  messaging/
    messagingProvider.ts
    twilioProvider.ts
    sendgridProvider.ts
    resendProvider.ts
    mockMessagingProvider.ts
  observability/
    integrationHealth.ts
```

### 2. Shared connector contract

Every connector should expose the same basic lifecycle contract:

```ts
export type IntegrationHealthStatus = 'disabled' | 'configured' | 'degraded' | 'healthy';

export interface IntegrationHealthCheck {
  provider: string;
  status: IntegrationHealthStatus;
  checkedAt: string;
  message?: string;
}

export interface IntegrationProvider {
  providerName: string;
  isConfigured(): boolean;
  healthCheck(): Promise<IntegrationHealthCheck>;
}
```

### 3. Environment-gated configuration

Use the existing environment guide as the canonical source for provider variables. Required optional integration variables already include DAT, Truckstop, Samsara, Motive, QuickBooks, Xero, SendGrid, and Sentry values.

Add new variables only when a provider is actually implemented:

```bash
# Load boards
DAT_API_KEY=
TRUCKSTOP_API_KEY=
LOADBOARD_API_KEY=

# Tracking / ELD / visibility
SAMSARA_API_TOKEN=
MOTIVE_CLIENT_ID=
MOTIVE_CLIENT_SECRET=
PROJECT44_API_KEY=
FOURKITES_API_KEY=

# Accounting
QBO_CLIENT_ID=
QBO_CLIENT_SECRET=
QBO_REDIRECT_URI=
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_REDIRECT_URI=

# Messaging
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
SENDGRID_API_KEY=
RESEND_API_KEY=
FROM_EMAIL=

# Observability
SENTRY_DSN=
VITE_SENTRY_DSN=
VITE_SENTRY_ENABLED=
POSTHOG_API_KEY=
VITE_POSTHOG_KEY=
```

### 4. Integration status endpoint

Add a protected endpoint once adapters exist:

```http
GET /api/integrations/status
```

Expected response shape:

```json
{
  "success": true,
  "integrations": [
    {
      "provider": "dat",
      "status": "disabled",
      "checkedAt": "2026-06-03T00:00:00.000Z"
    }
  ]
}
```

Security rules:

- Require authenticated operator access.
- Require tenant context when the provider works with tenant-scoped data.
- Never return secrets, tokens, full provider payloads, or account credentials.
- Log provider failures without exposing sensitive values.

### 5. CI-safe mocks

All connector tests must use mocked provider responses. Do not call DAT, Truckstop, QuickBooks, Twilio, SendGrid, Sentry, project44, FourKites, Samsara, or Motive from CI.

Recommended tests:

```text
apps/api/test/integrations/loadBoardProvider.test.ts
apps/api/test/integrations/trackingProvider.test.ts
apps/api/test/integrations/accountingProvider.test.ts
apps/api/test/integrations/messagingProvider.test.ts
apps/api/test/integrations/integrationStatusRoute.test.ts
```

## Vendor-side blockers

These must be completed in each external vendor dashboard before live integration can be enabled.

| Provider | Required outside repository |
| --- | --- |
| DAT | API approval, production API key, account permission for load-board/rate/posting access |
| Truckstop | API approval, production credentials, enabled products for load posting/search/rates |
| project44/FourKites | Visibility account, carrier/customer configuration, API key or OAuth credentials |
| Samsara/Motive | Fleet/ELD account, API token or OAuth client credentials, vehicle/driver permission scopes |
| QuickBooks Online | Intuit developer app, OAuth client ID/secret, redirect URI, company connection |
| Twilio | Account SID, auth token, messaging service or sender number, opt-out compliance setup |
| SendGrid/Resend | API key, verified sender/domain, deliverability records |
| Sentry | Organization, project, DSN, release environment naming |
| PostHog | Project key, host, event taxonomy decision |

## Production rollout sequence

### Phase 1 — Prove core platform gates

- Verify Supabase auth and tenant isolation.
- Verify Stripe live checkout, billing portal, webhook delivery, and paid-access enforcement.
- Confirm production smoke tests pass before enabling external freight APIs.

### Phase 2 — Add connector health framework

- Implement `IntegrationProvider` contract.
- Add disabled/configured/healthy/degraded status checks.
- Add protected `/api/integrations/status` endpoint.
- Add CI tests using mock providers.

### Phase 3 — Enable load-board integrations

- Start with DAT or Truckstop, not both at once.
- Implement one provider behind a feature flag.
- Support create/search/rate operations only after provider credentials are verified.
- Add manual production smoke test using a safe test account or sandbox.

### Phase 4 — Enable tracking integrations

- Start with a single tracking source.
- Normalize provider events into internal shipment status events.
- Keep public tracking payload sanitized.
- Add audit events for inbound status updates.

### Phase 5 — Enable accounting and messaging

- Add QuickBooks/Xero OAuth after billing and invoice models are stable.
- Add SMS/email notifications after opt-out, sender verification, and deliverability checks are complete.

### Phase 6 — Enable observability

- Configure Sentry for API and frontend.
- Define analytics events for quote request, checkout started, checkout completed, tracking lookup, login, load creation, dispatch assignment, and customer portal usage.

## Launch evidence checklist

Record evidence in the launch evidence log for each enabled connector:

- Provider name
- Environment: sandbox or production
- Secret location: Fly, Netlify, GitHub Actions, or vendor dashboard; do not paste secret values
- Date/time tested
- Test command or route
- Expected result
- Actual result
- Screenshot/log reference if safe
- Rollback command or disable flag

## Validation commands

Run after implementation changes:

```bash
pnpm install --frozen-lockfile
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run codex:env-check:strict
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

Run from an authenticated operator machine for production verification:

```bash
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
curl -i https://www.infamousfreight.com/api/health
curl -i https://www.infamousfreight.com/api/health/live
curl -i https://www.infamousfreight.com/api/health/ready
```

## Acceptance criteria

A connector is production-ready only when:

- Required environment variables exist in the target secret manager.
- Provider account has approved access.
- Adapter is enabled by feature flag or configuration.
- CI uses mocks and passes.
- Production smoke test passes.
- Rollback/disable path is documented.
- No secrets are committed.
- No provider payload leaks sensitive freight, customer, carrier, payment, or account data.
