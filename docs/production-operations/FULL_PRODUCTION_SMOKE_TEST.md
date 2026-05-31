# Full Production Smoke Test

Use this runbook after a release, before paid launch decisions, and whenever the operating focus shifts from building to customer acquisition. The goal is to verify the real Netlify → Fly.io → Supabase/Stripe production path as a real user without exposing secrets or customer data.

## Scope

- **Frontend:** `https://www.infamousfreight.com`
- **API app:** `infamous-freight-api`
- **Fly health path:** `https://infamous-freight-api.fly.dev/api/health/live`
- **Production path:** Netlify frontend and redirects/proxies to the Fly API.
- **Evidence storage:** `docs/launch-evidence/` for sanitized screenshots and command output.

## Safety Rules

- Use controlled production test accounts, controlled demo loads, and Stripe test-mode data unless an owner explicitly approves a live billing test.
- Never paste secrets, session cookies, payment details, private customer PII, database URLs, or bearer tokens into evidence.
- Record only command status, sanitized response snippets, deploy IDs, release IDs, test entity IDs, and screenshots with sensitive values redacted.
- Treat any skipped test as **Unknown**, not passing.
- If `/api/health/live` returns `mode="fallback"`, treat Fly liveness as passing but API startup as degraded until logs prove the real API started.

## Required Operator Context

| Item | Value |
|---|---|
| Test date/time |  |
| Operator |  |
| Launch owner |  |
| Rollback owner |  |
| Web deploy ID / commit |  |
| Fly release ID / image |  |
| Stripe mode tested | Test / Live |
| Controlled test organization |  |
| Controlled test user email |  |
| Controlled test shipment/load IDs |  |

## Automated Baseline Checks

Run these first from a trusted terminal. Fly commands require authenticated operator access.

```bash
pnpm install --frozen-lockfile
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run build
pnpm run test
pnpm run production:smoke-test
flyctl auth whoami
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

| Check | Expected result | Actual result | PASS / FAIL / UNKNOWN | Evidence |
|---|---|---|---|---|
| Install | Lockfile installs without mutation |  |  |  |
| Frontend env safety | No forbidden public DB URL variables |  |  |  |
| Supabase client env safety | Client uses Supabase API URL only |  |  |  |
| Build | API and web build pass |  |  |  |
| Tests | Test suites pass or known non-blockers documented |  |  |  |
| Production smoke script | Canonical web, redirects, API health, quote preflight, invalid tracking pass |  |  |  |
| Fly auth | Operator identity confirmed without secrets |  |  |  |
| Fly config | `internal_port = 3000` remains valid |  |  |  |
| Fly checks | Machines/checks healthy |  |  |  |
| API liveness | HTTP 200 from `/api/health/live` |  |  |  |

## Public User Smoke Tests

| Flow | Steps | Expected result | Actual result | PASS / FAIL / UNKNOWN | Evidence |
|---|---|---|---|---|---|
| Homepage | Open `https://www.infamousfreight.com/`; hard refresh; check console. | Page renders, assets load, no fatal console errors. |  |  |  |
| Quote request | Submit a controlled quote with clearly marked test data. | Confirmation appears and quote is recorded for operator follow-up. |  |  |  |
| Load board | Open the load board route as a public or permitted user. | Load board route renders expected empty/demo/live state without leaking private tenant data. |  |  |  |
| Tracking lookup | Look up a controlled tracking number. | Shipment status, origin, destination, and last update display correctly. |  |  |  |
| Pricing page | Open pricing; review plan CTA behavior. | Plans render, CTA routes work, no Stripe secret values appear. |  |  |  |
| Contact form | Submit controlled contact request. | Confirmation appears and request reaches the expected operator queue/log. |  |  |  |

## Authenticated Freight Workflow Smoke Tests

| Flow | Steps | Expected result | Actual result | PASS / FAIL / UNKNOWN | Evidence |
|---|---|---|---|---|---|
| Register | Create a controlled user in a controlled organization. | User registration succeeds with expected tenant/role. |  |  |  |
| Login | Log in as the controlled user. | Dashboard loads and API calls use the production backend. |  |  |  |
| Create load | Create a controlled test load from an approved quote or dashboard workflow. | Load record is created with the correct organization scope. |  |  |  |
| Assign driver | Assign a controlled driver/carrier to the test load. | Assignment is saved and visible only to authorized roles. |  |  |  |
| Update shipment status | Progress status through pickup/in-transit/delivered test states. | Timeline updates persist and customer-visible tracking reflects allowed statuses only. |  |  |  |
| Upload POD | Upload a sanitized test POD file. | File uploads, links to the load, and remains access-controlled. |  |  |  |
| Generate invoice | Generate invoice for the controlled completed shipment. | Invoice is generated with expected amount, customer, and shipment references. |  |  |  |

## Billing Smoke Tests

Use Stripe test mode unless explicitly approved for a live micro-charge by the launch owner and rollback owner.

| Flow | Steps | Expected result | Actual result | PASS / FAIL / UNKNOWN | Evidence |
|---|---|---|---|---|---|
| Subscribe | Start checkout for the selected plan using a controlled test customer. | Checkout session opens; success returns to the app; subscription state updates. |  |  |  |
| Upgrade | Upgrade to the next plan. | Stripe and app subscription state reflect the upgraded plan. |  |  |  |
| Downgrade | Downgrade to the previous plan. | Stripe and app subscription state reflect downgrade timing correctly. |  |  |  |
| Cancel | Cancel the subscription. | Access state follows the configured cancellation policy. |  |  |  |
| Stripe portal access | Open customer portal from the app. | Portal opens for the correct customer without exposing secrets. |  |  |  |
| Webhook audit | Review Stripe events for the billing test run. | Expected events are delivered once or handled idempotently; failed webhooks are investigated. |  |  |  |

## Go / No-Go Decision

| Decision item | Status |
|---|---|
| All critical public flows passed |  |
| All critical authenticated flows passed |  |
| Billing state and webhooks verified |  |
| No unresolved critical blockers |  |
| Rollback plan confirmed |  |
| Customer acquisition can proceed | YES / NO |

## Blocker Log

| Severity | Flow | Symptom | Owner | Fallback / rollback | Retest date | Status |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## Cleanup

- Remove or archive controlled test data that is not needed as launch evidence.
- Disable test users that should not remain active.
- Confirm no screenshots or logs contain secrets, cookies, bearer tokens, private customer PII, or payment details.
- Link the completed evidence file from `docs/LAUNCH_EVIDENCE_LOG.md` or the active PR/issue.
