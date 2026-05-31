# Launch Evidence Package — YYYY-MM-DD

## Run metadata

| Field | Value |
|---|---|
| Environment | Production |
| Launch gate | Private Beta / Paid Beta / Public Launch |
| Evidence owner |  |
| Technical owner |  |
| Rollback owner |  |
| Support owner |  |
| Started at UTC |  |
| Completed at UTC |  |
| Git branch |  |
| Git commit SHA |  |
| Netlify deploy ID |  |
| Netlify deploy URL |  |
| Fly app | infamous-freight-api |
| Fly release/deployment ID |  |

## Risk check

| Area | Result | Notes / blocker link |
|---|---|---|
| JWT authentication | Unknown |  |
| Tenant isolation | Unknown |  |
| RBAC | Unknown |  |
| Stripe billing | Unknown |  |
| Audit logs | Unknown |  |
| Rate limiting | Unknown |  |
| Security headers | Unknown |  |
| Error boundaries | Unknown |  |
| Monitoring | Unknown |  |
| Backups | Unknown |  |
| Production evidence | Unknown |  |

Result values: `Pass`, `Fail`, `Blocked`, or `Unknown`. Unknown critical or high-risk items block public launch.

## Screenshot evidence

| Surface | Screenshot path or artifact URL | Test account/data used | Result | Notes |
|---|---|---|---|---|
| Homepage | `docs/launch-evidence/screenshots/YYYY-MM-DD-homepage.png` | Public | Unknown |  |
| Login | `docs/launch-evidence/screenshots/YYYY-MM-DD-login.png` | Controlled test user | Unknown |  |
| Dashboard | `docs/launch-evidence/screenshots/YYYY-MM-DD-dashboard.png` | Controlled test tenant | Unknown | Confirm live data, not sample-only data. |
| Billing | `docs/launch-evidence/screenshots/YYYY-MM-DD-billing.png` | Controlled billing test account | Unknown | Do not expose Stripe secrets or payment details. |
| Tracking | `docs/launch-evidence/screenshots/YYYY-MM-DD-tracking.png` | Controlled test shipment | Unknown |  |
| Quote intake | `docs/launch-evidence/screenshots/YYYY-MM-DD-quote-intake.png` | Controlled quote request | Unknown | Record quote ID only. |
| Carrier portal | `docs/launch-evidence/screenshots/YYYY-MM-DD-carrier-portal.png` | Controlled carrier test account | Unknown |  |

## Production route checks

| Check | Command | Expected result | Actual result | Result |
|---|---|---|---|---|
| Canonical web loads | `curl -I https://www.infamousfreight.com/` | HTTP 200 |  | Unknown |
| Apex redirects | `curl -I https://infamousfreight.com/` | 301/308 to `https://www.infamousfreight.com/` |  | Unknown |
| Web-proxied API health | `curl -i https://www.infamousfreight.com/api/health` | API JSON response |  | Unknown |
| Direct Fly liveness | `curl -i https://infamous-freight-api.fly.dev/api/health/live` | HTTP 200 liveness JSON |  | Unknown |

## Auth and tenant checks

| Check | Evidence | Result | Notes |
|---|---|---|---|
| Login succeeds for controlled user |  | Unknown |  |
| User lands in expected organization |  | Unknown |  |
| User has expected role |  | Unknown |  |
| Unauthorized route access is denied |  | Unknown |  |
| No client-supplied tenant header is trusted as final authority |  | Unknown |  |

## Freight workflow checks

| Workflow | Test record ID | Evidence | Result | Notes |
|---|---|---|---|---|
| Quote intake |  |  | Unknown |  |
| Tracking |  |  | Unknown |  |
| Dashboard live data |  |  | Unknown | Verify Operations Dashboard, Analytics Dashboard, KPI widgets, and dispatch board metrics pull live API data. |
| Billing |  |  | Unknown |  |
| Carrier portal |  |  | Unknown |  |

## Monitoring checks

| Tool | Signal | Dashboard/monitor URL | Alert destination | Result | Notes |
|---|---|---|---|---|---|
| Sentry | Frontend crashes |  |  | Unknown |  |
| Sentry | API crashes |  |  | Unknown |  |
| Sentry | Billing failures |  |  | Unknown |  |
| Sentry | Auth failures |  |  | Unknown |  |
| Better Stack | API uptime |  |  | Unknown |  |
| Better Stack | DNS uptime |  |  | Unknown |  |
| Better Stack | SSL expiration |  |  | Unknown |  |
| UptimeRobot | `https://www.infamousfreight.com` |  |  | Unknown |  |
| UptimeRobot | `https://www.infamousfreight.com/api/health` |  |  | Unknown |  |

## Command output index

Store redacted outputs under `docs/launch-evidence/command-output/` or link to private CI artifacts.

| Command | Artifact path or URL | Result | Notes |
|---|---|---|---|
| `pnpm install --frozen-lockfile` |  | Unknown |  |
| `pnpm run env:check:frontend` |  | Unknown |  |
| `pnpm run env:check:supabase-client` |  | Unknown |  |
| `pnpm run build` |  | Unknown |  |
| `pnpm run test` |  | Unknown |  |
| `flyctl auth whoami` |  | Unknown | Do not record sensitive account details beyond authenticated status. |
| `flyctl config validate --config fly.toml` |  | Unknown |  |
| `flyctl checks list -a infamous-freight-api` |  | Unknown | Requires authenticated Fly operator terminal. |
| `curl -i https://www.infamousfreight.com/api/health` |  | Unknown |  |
| `curl -i https://infamous-freight-api.fly.dev/api/health/live` |  | Unknown |  |

## Production impact

- User-facing impact:
- API impact:
- Database impact:
- Billing impact:
- Monitoring impact:
- Required secrets/config changes:

## Rollback and fallback

- Rollback trigger:
- Rollback command or owner action:
- Customer/operator fallback:
- Follow-up issue/PR:

## Final launch decision

| Decision | Owner | Timestamp UTC | Notes |
|---|---|---|---|
| Not approved / Approved for private beta / Approved for paid beta / Approved for public launch |  |  |  |
