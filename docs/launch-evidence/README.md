# Launch Evidence Package

This directory is the Phase A production evidence workspace for Infamous Freight launch readiness.

## Purpose

Use this package to collect one complete, timestamped proof set before approving a beta or public launch gate. The package exists because production readiness must be backed by captured evidence, not roadmap status or unchecked assumptions.

## Required evidence

Create a dated evidence file from `TEMPLATE.md` and attach or link the following artifacts:

| Evidence item | Required proof | Safe storage guidance |
|---|---|---|
| Homepage screenshot | Browser screenshot of `https://www.infamousfreight.com/` loading successfully | Store as `screenshots/<date>-homepage.png` |
| Login screenshot | Browser screenshot of the login route loading and accepting a test login flow | Store as `screenshots/<date>-login.png` |
| Dashboard screenshot | Browser screenshot of the authenticated dashboard using live production data | Store as `screenshots/<date>-dashboard.png` |
| Billing screenshot | Browser screenshot of billing/subscription UI without secret values | Store as `screenshots/<date>-billing.png` |
| Tracking screenshot | Browser screenshot of shipment tracking using a controlled test shipment | Store as `screenshots/<date>-tracking.png` |
| Quote intake screenshot | Browser screenshot of quote intake submission or confirmation | Store as `screenshots/<date>-quote-intake.png` |
| Carrier portal screenshot | Browser screenshot of the carrier portal or carrier workflow entry point | Store as `screenshots/<date>-carrier-portal.png` |
| API health output | Redacted command output for web-proxied and direct Fly health checks | Store as `command-output/<date>-api-health.txt` |
| Netlify deploy ID | Current production deploy ID and deployed commit SHA | Record in the dated evidence file |
| Fly release ID | Current Fly release/deployment ID and deployed image/commit when available | Record in the dated evidence file |

Do not commit screenshots or command output that contain secrets, tokens, full customer PII, payment details, private keys, database URLs, or session cookies.

## Launch success criteria

A launch evidence package is complete only when all of these checks have a passing result or a documented blocker with owner and rollback/fallback:

- `https://www.infamousfreight.com/` loads successfully.
- `https://infamousfreight.com/` redirects to `https://www.infamousfreight.com/`.
- `https://www.infamousfreight.com/api/health` returns API health JSON, not the SPA shell.
- `https://infamous-freight-api.fly.dev/api/health/live` returns HTTP 200 from the API process.
- Quote intake submits a controlled test quote and records the test quote ID.
- Tracking loads a controlled test shipment and shows current status.
- Billing loads without exposing Stripe secrets and confirms the expected plan state.
- Login succeeds for a controlled test user with the expected tenant and role.

## Operator command sequence

Run production commands only from an authenticated operator terminal. Do not paste secret values into the evidence file.

```bash
pnpm install --frozen-lockfile
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run build
pnpm run test
flyctl auth whoami
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
curl -i https://www.infamousfreight.com/api/health
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

For Netlify deploy evidence, use the Netlify UI or CLI from an authenticated operator terminal and record only deploy ID, URL, status, and commit SHA. Do not record access tokens.

## Monitoring evidence

Before approving public launch, confirm the following monitors are configured and link their dashboard URLs in the dated evidence file:

| Tool | Required monitors/signals |
|---|---|
| Sentry | Frontend crashes, API crashes, billing failures, auth failures, release tags |
| Better Stack | API uptime, DNS uptime, SSL expiration |
| UptimeRobot | `https://www.infamousfreight.com` and `https://www.infamousfreight.com/api/health` |

## Recent generated evidence

Generated Netlify evidence files live in `docs/evidence/`. When `pnpm run production:capture-netlify-evidence` creates a new timestamped file, also add a short entry to `docs/LAUNCH_EVIDENCE_LOG.md` that records:

- which command generated the artifact,
- which public checks passed,
- which checks were skipped or blocked,
- the owner/environment needed for blocked operator checks, and
- whether the artifact changes launch approval status.

Most recent generated artifact recorded here: `docs/evidence/netlify-launch-evidence-20260601T045404Z.md`.

## Related runbooks

- `docs/LAUNCH_READINESS_INDEX.md`
- `docs/PRODUCTION_READINESS_VERIFICATION.md`
- `docs/LAUNCH_EVIDENCE_LOG.md`
- `docs/OBSERVABILITY.md`
- `docs/SENTRY-SETUP.md`
- `docs/SENTRY_API_SETUP.md`
- `docs/ROLLBACK_PLAN.md`
