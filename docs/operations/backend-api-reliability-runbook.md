# Backend API Reliability Runbook

_Last updated: April 27, 2026_

## 1) Deploy and verify

1. Push backend changes.
2. Wait for deployment completion.
3. Run deployment checks:

```bash
./scripts/verify-deployment.sh https://api.infamousfreight.com https://infamousfreight.com
```

## 2) Manual API endpoint verification

Obtain a signed JWT for a known carrier identity (e.g. via the Supabase dashboard or your
internal token-issuing endpoint).  The token must contain `tenantId` and `role` claims.

```bash
export API_URL="https://api.infamousfreight.com"
export TOKEN="<signed-jwt-for-your-smoke-tenant>"

curl -sf "$API_URL/api/health"
curl -sf -H "Authorization: Bearer $TOKEN" "$API_URL/api/loads"
curl -sf -H "Authorization: Bearer $TOKEN" "$API_URL/api/shipments"
curl -sf -H "Authorization: Bearer $TOKEN" "$API_URL/api/drivers"
```

> **Note:** `x-tenant-id` and `x-user-role` headers are no longer accepted.
> All tenant and role information must come from the verified JWT claims.

## 3) Uptime monitoring (UptimeRobot)

Create monitors:

- **HTTP(s) monitor**: `https://api.infamousfreight.com/api/health`
- **HTTP(s) monitor**: `https://infamousfreight.com`

Recommended settings:

- Check interval: **5 minutes**
- Alert contacts: on-call email + SMS bridge
- Alert threshold: alert after **2 consecutive failures**

## 4) Sentry error tracking

Set `SENTRY_DSN` in API runtime environment.

Verification checklist:

- Trigger a test error in non-production and ensure it appears in Sentry.
- Confirm environment tags are set (`production`, `staging`).
- Create alerts for error rate spikes and new issues.

## 5) Incident response

If `/api/health` fails:

1. Check latest deployment logs.
2. Check DB connectivity and `DATABASE_URL`.
3. Roll back to last healthy release if recovery exceeds 15 minutes.
4. Post incident update in ops channel.
