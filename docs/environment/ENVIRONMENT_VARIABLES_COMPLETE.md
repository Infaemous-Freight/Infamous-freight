# How to Get All 27 Environment Variables (Infamous Freight)

_Last updated: May 1, 2026._

This is the production-oriented setup guide for every environment variable currently expected across `apps/api` and `apps/web`.

## Variable inventory (27 total)

### Core (5)
1. `NODE_ENV`
2. `PORT`
3. `DATABASE_URL`
4. `CORS_ORIGINS`
5. `WEB_APP_URL`

### Stripe (5)
6. `STRIPE_SECRET_KEY`
7. `STRIPE_WEBHOOK_SECRET`
8. `STRIPE_CHECKOUT_SUCCESS_URL`
9. `STRIPE_CHECKOUT_CANCEL_URL`
10. `STRIPE_PORTAL_RETURN_URL`

### Supabase (5)
11. `SUPABASE_URL`
12. `SUPABASE_SERVICE_KEY`
13. `VITE_SUPABASE_URL`
14. `VITE_SUPABASE_PUBLISHABLE_KEY`
15. `VITE_SUPABASE_ANON_KEY` (legacy-compatible fallback)

### Redis (4)
16. `REDIS_HOST`
17. `REDIS_PORT`
18. `REDIS_PASSWORD`
19. `REDIS_DB`

### Load boards (3)
20. `DAT_API_KEY`
21. `TRUCKSTOP_API_KEY`
22. `LOADBOARD_API_KEY`

### ELD (1)
23. `SAMSARA_API_TOKEN`

### Observability + protection (2)
24. `SENTRY_DSN`
25. `RATE_LIMIT_ENABLED` (runtime flag used by API code)

### Frontend connectivity (2)
26. `VITE_API_URL`
27. `VITE_SENTRY_DSN`

> Note: Some templates still show `API_RATE_LIMIT_ENABLED`; runtime checks currently reference `RATE_LIMIT_ENABLED`. Set `RATE_LIMIT_ENABLED=true` in production to avoid ambiguity.

---

## Step-by-step: where to get each value

### 1) Core values
- `NODE_ENV=production`
- `PORT=3000` (Fly/host may inject this automatically)
- `DATABASE_URL`: PostgreSQL connection URI (Supabase/AWS RDS/DigitalOcean)
- `CORS_ORIGINS`: comma-separated frontend origins, no spaces
- `WEB_APP_URL`: canonical frontend URL, no trailing slash

### 2) Stripe (billing)
From Stripe Dashboard (`Developers`):
- `STRIPE_SECRET_KEY`: use `sk_test_...` for staging, `sk_live_...` for production
- `STRIPE_WEBHOOK_SECRET`: `whsec_...` from your webhook endpoint
- Redirects:
  - `STRIPE_CHECKOUT_SUCCESS_URL=https://www.infamousfreight.com/billing/success`
  - `STRIPE_CHECKOUT_CANCEL_URL=https://www.infamousfreight.com/billing/cancel`
  - `STRIPE_PORTAL_RETURN_URL=https://www.infamousfreight.com/billing`

### 3) Supabase (auth/data)
From Supabase Project Settings → API:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (server-only secret)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (preferred frontend key)
- `VITE_SUPABASE_ANON_KEY` (compatibility fallback)

### 4) Redis (cache/queues)
From Redis Cloud / AWS ElastiCache / DigitalOcean Managed Redis:
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB=0` (default)

### 5) Load board integrations
Collect from each vendor portal:
- `DAT_API_KEY`
- `TRUCKSTOP_API_KEY`
- `LOADBOARD_API_KEY`

### 6) ELD integration
From Samsara API tokens page:
- `SAMSARA_API_TOKEN`

### 7) Observability and abuse protection
- `SENTRY_DSN` (backend DSN)
- `RATE_LIMIT_ENABLED=true`

### 8) Frontend runtime
- `VITE_API_URL` (use `/api` behind reverse proxy, or absolute URL for direct API)
- `VITE_SENTRY_DSN` (frontend DSN)

---

## Production template

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/infamous_freight
CORS_ORIGINS=https://www.infamousfreight.com,https://app.infamousfreight.com
WEB_APP_URL=https://www.infamousfreight.com

STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
STRIPE_CHECKOUT_SUCCESS_URL=https://www.infamousfreight.com/billing/success
STRIPE_CHECKOUT_CANCEL_URL=https://www.infamousfreight.com/billing/cancel
STRIPE_PORTAL_RETURN_URL=https://www.infamousfreight.com/billing

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY

REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
REDIS_DB=0

DAT_API_KEY=YOUR_DAT_KEY
TRUCKSTOP_API_KEY=YOUR_TRUCKSTOP_KEY
LOADBOARD_API_KEY=YOUR_LOADBOARD_KEY
SAMSARA_API_TOKEN=YOUR_SAMSARA_TOKEN

SENTRY_DSN=https://YOUR_KEY@sentry.io/PROJECT_ID
RATE_LIMIT_ENABLED=true

VITE_API_URL=/api
VITE_SENTRY_DSN=https://YOUR_KEY@sentry.io/PROJECT_ID
```

## Quick verification

```bash
test -n "$DATABASE_URL" && echo "✓ DATABASE_URL set"
test -n "$STRIPE_SECRET_KEY" && echo "✓ STRIPE_SECRET_KEY set"
test -n "$SUPABASE_URL" && echo "✓ SUPABASE_URL set"
test -n "$RATE_LIMIT_ENABLED" && echo "✓ RATE_LIMIT_ENABLED set"
```

## Source-of-truth templates
- Root backend template: `.env.example`
- Web template: `apps/web/.env.example`
- Deployment baseline: `.env.production.example`


---

## What is currently present vs missing/needed

Based on current runtime references in `apps/api/src`, `apps/web/src`, and local env templates:

### Present in runtime code (actively referenced)
- Backend/runtime: `NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGINS`, `WEB_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CHECKOUT_SUCCESS_URL`, `STRIPE_CHECKOUT_CANCEL_URL`, `STRIPE_PORTAL_RETURN_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `DAT_API_KEY`, `TRUCKSTOP_API_KEY`, `LOADBOARD_API_KEY`, `SAMSARA_API_TOKEN`, `SENTRY_DSN`, `RATE_LIMIT_ENABLED`.
- Frontend/runtime: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (preferred), `VITE_SUPABASE_ANON_KEY` (fallback), `VITE_SENTRY_DSN`.

### Present in env templates but not currently required by runtime code
These are optional/integration/deployment convenience variables and can be set only when needed:
- Auth/integration legacy: `JWT_SECRET`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- Frontend/deploy extras: `VITE_SOCKET_URL`, `VITE_STRIPE_PUBLIC_KEY`, `VITE_SENTRY_ENABLED`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SENTRY_DSN`
- Platform/deploy metadata: `SITE_URL`, `PUBLIC_SITE_URL`, `FRONTEND_URL`, `API_PUBLIC_URL`, `FLY_API_TOKEN`
- Sentry CI/source map upload: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- Additional vendor integrations: `MOTIVE_CLIENT_ID`, `MOTIVE_CLIENT_SECRET`, `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `SENDGRID_API_KEY`, `FROM_EMAIL`, `RTS_API_KEY`, `OTR_API_KEY`, `APEX_API_KEY`

### Missing/needed for a production deployment
Set all 27 runtime variables listed in this document. At minimum, production is blocked without:
- `DATABASE_URL`
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
- `VITE_API_URL` + `VITE_SUPABASE_URL` + one frontend Supabase key (`VITE_SUPABASE_PUBLISHABLE_KEY` recommended)
- `CORS_ORIGINS` + `WEB_APP_URL`
- `RATE_LIMIT_ENABLED=true`

### Naming mismatches to resolve in your secret manager
- Prefer `RATE_LIMIT_ENABLED` (runtime). Keep `API_RATE_LIMIT_ENABLED` only as a temporary compatibility value if older tooling still reads it.
- Prefer `SUPABASE_SERVICE_KEY` for API runtime. Some templates still mention `SUPABASE_SERVICE_ROLE_KEY`; map both to the same secret value if needed during transition.
