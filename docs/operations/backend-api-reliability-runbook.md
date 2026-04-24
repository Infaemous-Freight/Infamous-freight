# Backend API Reliability Runbook

_Last updated: April 24, 2026_

## 1) Deploy and verify

1. Push backend changes.
2. Wait for deployment completion.
3. Run deployment checks:

```bash
./scripts/verify-deployment.sh https://api.infamousfreight.com https://infamousfreight.com
```

## 2) Manual API endpoint verification

Use a tenant and role header so tenant isolation and RBAC are validated.

```bash
export API_URL="https://api.infamousfreight.com"
export TENANT_ID="deployment-smoke-tenant"
export ROLE="dispatcher"

curl -sf "$API_URL/api/health"
curl -sf -H "x-tenant-id: $TENANT_ID" -H "x-user-role: $ROLE" "$API_URL/api/loads"
curl -sf -H "x-tenant-id: $TENANT_ID" -H "x-user-role: $ROLE" "$API_URL/api/shipments"
curl -sf -H "x-tenant-id: $TENANT_ID" -H "x-user-role: $ROLE" "$API_URL/api/drivers"
```

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
