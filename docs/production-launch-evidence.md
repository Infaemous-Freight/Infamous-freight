# Production launch evidence checklist

_Last updated: June 2026._

This document is the operator-facing evidence log for approving Infamous Freight production launch readiness. Do not mark a gate complete from assumptions, local-only checks, or screenshots without matching production evidence.

## Approval rule

A public launch is approved only when every critical gate below has dated production evidence, the operator who collected it is named, and the result is reproducible from an authenticated production environment.

If any critical gate is incomplete, the launch status remains **not approved**.

## Evidence standards

For each gate, record:

- date and time with timezone
- operator name
- production URL, workflow, or command used
- sanitized result summary
- artifact location, such as screenshot path, CI run URL, Stripe event ID, Fly release ID, or log reference
- follow-up issue or PR if failed

Never paste secrets, tokens, customer payment details, raw JWTs, full database URLs, private keys, or service-role keys into this document.

## Critical gates

| Gate | Required evidence | Status | Evidence link / notes |
| --- | --- | --- | --- |
| Repository validation | `pnpm install --frozen-lockfile`, env safety checks, Prisma validation, typecheck, lint, test, and build pass on the launch commit. | Pending | |
| GitHub Actions deploy | Main deploy workflow completes verify, Netlify deploy, Fly deploy, and production smoke test. | Pending | |
| Fly API health | Authenticated operator confirms Fly app, release/check status, `/api/health/live`, `/api/health`, and `/api/health/ready`. | Pending | |
| Netlify web health | `https://www.infamousfreight.com` returns HTTP 200 and apex redirects to canonical www URL. | Pending | |
| Same-origin API proxy | `https://www.infamousfreight.com/api/health` returns expected API health through Netlify proxy. | Pending | |
| Production database migrations | Operator confirms pending migrations are reviewed and applied, or explicitly confirms no pending migrations for the launch commit. | Pending | |
| Public quote/contact intake | Submit a controlled production test lead and verify it is received by the backend/system of record. | Pending | |
| Public tracking negative cases | Malformed and unknown tracking numbers return expected safe errors. | Pending | |
| Public tracking positive case | A known-safe production tracking number returns a sanitized public shipment payload. | Pending | |
| Registration | A controlled production user can register without manual backend intervention. | Pending | |
| Login/session | The controlled production user can log in and maintain an authenticated session. | Pending | |
| Tenant isolation | Controlled production users cannot access another tenant's records. | Pending | |
| Load creation | A controlled production tenant can create a load record through the live app/API path. | Pending | |
| Dispatch workflow | A controlled production tenant can move a load through the documented dispatch workflow without demo data. | Pending | |
| Shipment/tracking workflow | A controlled production tenant can update shipment/tracking state and verify expected visibility. | Pending | |
| Billing Checkout | Stripe live Checkout can be started for an eligible production tenant. | Pending | |
| Billing Customer Portal | A Stripe-linked production tenant can open the Customer Portal. | Pending | |
| Stripe webhook delivery | Live Stripe webhook events are delivered, signature-verified, idempotently processed, and reflected in backend state. | Pending | |
| Paid access gate | Paid/unpaid account state produces the expected app access behavior. | Pending | |
| Demo-data controls | Production build confirms public demo freight records are disabled unless intentionally enabled for a controlled demo/sandbox. | Pending | |
| Not-ready route gating | `/driver-app`, messaging, and unfinished operational routes are gated or clearly marked according to `apps/web/src/lib/routeReadiness.ts`. | Pending | |
| Security headers | Production web responses include the expected security headers from `netlify.toml`. | Pending | |
| Secret exposure check | No secrets are exposed in browser env, built assets, logs, docs, or committed files. | Pending | |
| Rollback path | Operator confirms the previous known-good Netlify deploy and Fly release can be restored. | Pending | |

## High-risk non-launch blockers to track

These do not automatically block a marketing/controlled beta launch if they are visibly gated, but they block claiming full operational production readiness.

| Area | Required before full production operations | Status | Notes |
| --- | --- | --- | --- |
| `/ops` | Replace demo-backed dashboard data with live API-backed services and production tests. | Pending | |
| `/loads` | Replace demo-backed load-board records with live tenant-scoped load services. | Pending | |
| `/dispatch` | Replace demo-backed dispatch workflow with auditable live workflow state transitions. | Pending | |
| `/ops/drivers` | Replace demo-backed driver roster/performance widgets with live services. | Pending | |
| `/invoices` | Complete production invoice/billing integration and tests. | Pending | |
| `/analytics` | Replace demo-backed metrics with verified production analytics queries. | Pending | |
| `/compliance` | Connect compliance views to source systems and validate records. | Pending | |
| `/carriers` | Complete carrier onboarding and approval source of truth. | Pending | |
| `/accounting` | Complete QuickBooks/Xero or accounting-system integration. | Pending | |
| AI dispatch automation | Add freight-domain guardrails, audit logs, approval controls, and rollback behavior. | Pending | |
| Mobile driver app | Build, test, and gate mobile/driver workflows before live dispatch use. | Pending | |

## Operator command bundle

Run from an authenticated production operator terminal only.

```bash
pnpm install --frozen-lockfile
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run check:prisma-versions
pnpm run prisma:validate
bash scripts/check-fly-docker-config.sh
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run test
```

```bash
flyctl auth whoami
flyctl config validate --config fly.toml
flyctl secrets list -a infamous-freight-api
flyctl checks list -a infamous-freight-api
curl -i https://infamous-freight-api.fly.dev/api/health/live
curl -i https://infamous-freight-api.fly.dev/api/health
curl -i https://infamous-freight-api.fly.dev/api/health/ready
curl -i https://api.infamousfreight.com/api/health/live
curl -i https://api.infamousfreight.com/api/health
curl -i https://api.infamousfreight.com/api/health/ready
curl -i https://www.infamousfreight.com
curl -i https://www.infamousfreight.com/api/health
```

Do not run `flyctl config save -a infamous-freight-api --yes` unless an operator explicitly intends to rewrite Fly configuration.

## Evidence entry template

```md
### Gate: <gate name>

- Date/time:
- Operator:
- Launch commit:
- Production target:
- Command/workflow:
- Result:
- Artifact/evidence:
- Follow-up issue/PR:
- Decision: Pass / Fail / Blocked
```
