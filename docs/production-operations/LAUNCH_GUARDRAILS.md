# Launch Guardrails

Infamous Freight should not move to public launch until the production deploy has a green health response, applied database migrations, verified live payment and notification events, and clean browser audits.

## Health And Monitoring

- Production health endpoint: `/api/production-health`
- Public fallback: `/production-health`
- Expected healthy status: HTTP 200 with `ok: true`
- Expected unhealthy status: HTTP 503 with missing check names only

Configure uptime monitoring against `/api/production-health` at a 1 minute interval during launch week and a 5 minute interval after stabilization. Alert on two consecutive failures, HTTP 5xx responses, or response times above 5 seconds.

## Launch Audit Command

Run the non-secret launch audit before go-live:

```bash
pnpm run launch:blocker-audit
```

The audit checks credential presence, frontend env exposure, Netlify Database migration state, public launch routes, the production health route, quote estimate API reachability, and tracking validation behavior. It reports names and statuses only, never credential values.

## Backup And Export Plan

Before launch, capture a production database export from the Netlify Database dashboard or the approved Netlify CLI workflow and store it in the company backup location with restricted access. Retain launch-week exports daily for 14 days, then keep weekly exports for 90 days.

Before any migration deploy:

1. Capture a fresh export.
2. Record the deploy ID and migration names.
3. Verify `/api/production-health` is healthy after deploy.
4. Run quote, carrier, tracking, notification, invoice, and payment smoke tests.

Rollback should first use Netlify deploy rollback for application code. If data rollback is required, restore only after owner approval because quote, carrier, payment, and tracking records may have changed after the export.

## Go-Live Gates

- Stripe checkout and webhook must complete with production keys.
- Quote request create/read and tracking lookup must pass against production.
- Carrier onboarding create/read/update must pass with an authorized production account.
- Notifications must create records and deliver the configured outbound email event.
- Sentry must receive a controlled production test event.
- Browser audits must include Lighthouse mobile and desktop, accessibility, broken links, console errors, form submissions, and slow-network behavior.
