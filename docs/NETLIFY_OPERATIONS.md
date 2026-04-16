# Netlify Operations & Production Controls

This document defines the required operational baseline for the Netlify-hosted web surface.

## 1) Deploy strategy and merge protection

- **Deploy previews**: enabled for every PR via Netlify Git integration and CI workflow `Netlify Preview Validation`.
- **Required checks before merge**:
  - `Netlify Preview Validation / netlify preview deploy`
  - `Netlify Preview Validation / preview quality checks`
- **Branch deploys**: enabled for long-lived QA branches (`develop`, `staging`, `release/*`) in Netlify site settings.

## 2) Build reproducibility

- Build command is pinned in `netlify.toml`:
  - `pnpm install --frozen-lockfile && pnpm --filter web build`
- Publish directory is explicitly set:
  - `apps/web/.next`
- Node and pnpm are pinned:
  - `.nvmrc` = `24`
  - `netlify.toml` `NODE_VERSION=24`
  - `netlify.toml` `PNPM_VERSION=10.33.0`
- Lockfile enforcement is mandatory (`--frozen-lockfile`) for CI and Netlify builds.
- Dependency caching is enabled in CI through `actions/setup-node` cache for pnpm.

## 3) Environment variable governance

Never commit secrets. Store secrets in Netlify environment variables only.

### Context scoping

| Variable | Purpose | Owner | Production | Deploy Preview | Branch Deploy |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical site URL | Web Platform | ✅ | ⚠️ preview URL override | ⚠️ branch URL override |
| `NEXT_PUBLIC_API_URL` | browser API base URL | API Platform | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_API_BASE_URL` | browser API base URL alias | API Platform | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client billing key | Billing | ✅ | optional test key | optional test key |
| `SENTRY_DSN` | frontend error telemetry | Platform Observability | ✅ | optional | optional |
| `JWT_SECRET` | server-side auth secret for serverless handlers | Security | ✅ | ✅ (preview secret) | ✅ (branch secret) |
| `NETLIFY_AUTH_TOKEN` | CI deploy token | Platform DevOps | CI secret only | CI secret only | CI secret only |
| `NETLIFY_SITE_ID` | Netlify target site | Platform DevOps | CI secret only | CI secret only | CI secret only |

### Secret rotation schedule

- Rotate **deploy tokens and integration tokens every 90 days**.
- Rotate **high-risk auth secrets every 30 days** or immediately after personnel/incident events.
- Rotation owner: **Platform DevOps on-call**.
- Evidence required: ticket link + timestamp + impacted systems + validation of successful redeploy.

## 4) Security and traffic controls

- Security headers (CSP, HSTS, X-Frame-Options, etc.) are defined centrally in `netlify.toml`.
- Redirects and rewrites are centralized in `netlify.toml`.
- Canonical redirects enforce apex/http -> `https://www.infamousfreight.com`.
- Abuse controls:
  - use Netlify + upstream WAF/rate-limiting rules for `/api`, `/auth`, `/admin`.
  - protect internal/admin routes with role checks in backend middleware.

## 5) Performance controls

- Lighthouse validation runs on each deploy preview.
- Accessibility checks (`pa11y`) run on each deploy preview.
- Compression is verified in preview (`br` or `gzip` content-encoding).
- Cache policy:
  - fingerprinted static assets: immutable / 1 year.
  - HTML entry points: `max-age=0, must-revalidate`.

### Payload budgets

Use these budgets in PR reviews and Lighthouse triage:

- JavaScript (initial): **<= 170 KB gzip**.
- CSS (initial): **<= 70 KB gzip**.
- Above-the-fold images per route: **<= 250 KB compressed**.

## 6) Functions and edge guidance

- Netlify Functions are preferred for logic that must not execute client-side.
- Validate and parse request bodies at every function entry with explicit schema checks.
- Use **Background Functions** for long-running async jobs.
- Use **Scheduled Functions** for maintenance jobs (cleanup, sync, periodic health checks).
- Use **Edge Functions** only for latency-sensitive or request-time personalization needs.
- Keep edge logic deterministic, minimal, and side-effect constrained.

## 7) Observability, alerting, and incident response

- Function logs should be structured JSON and include request/correlation IDs.
- Route function-level errors to Sentry/alerting with environment tags.
- Configure deploy notifications to Slack/email for:
  - production success
  - production failure
  - preview failures
- Run synthetic uptime checks for:
  - `/`
  - `/auth/sign-in`
  - API health endpoint

## 8) Runbooks and review cadence

- Rollback runbook: `docs/runbooks/NETLIFY_ROLLBACK_RUNBOOK.md`.
- Incident template: `docs/templates/INCIDENT_POSTMORTEM_TEMPLATE.md`.
- Monthly operational review must include:
  - median/95th build time
  - error rate and top causes
  - traffic trends and cache hit behavior
  - dependency freshness and vulnerability backlog

