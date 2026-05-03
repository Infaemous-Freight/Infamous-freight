# Infamous Freight Deployment Checklist

## Status

Production code is buildable. Production readiness still requires environment configuration, database migration, Stripe verification, deployment, and health-check confirmation.

## Build artifacts

- API: `apps/api/dist/src/server.js`
- Web: `apps/web/dist/`

## Production entrypoints

| Component | Entry point | Start command | Port |
| --- | --- | --- | --- |
| Backend API | `apps/api/src/server.ts` | `npm --prefix apps/api run start:prod` | `$PORT`, default `3000` |
| Frontend Web | `apps/web/dist/index.html` | Serve static files | `80/443` |

## Backend environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | Yes | Server port. Fly should route to `3000`. |
| `NODE_ENV` | Yes | Set to `production`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `STRIPE_SECRET_KEY` | Yes | Stripe API key. |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook verification secret. |
| `STRIPE_CHECKOUT_SUCCESS_URL` | Yes | Redirect after checkout success. |
| `STRIPE_CHECKOUT_CANCEL_URL` | Yes | Redirect after checkout cancellation. |
| `STRIPE_PORTAL_RETURN_URL` | Yes | Stripe billing portal return URL. |
| `WEB_APP_URL` | Yes | Public frontend URL. |
| `CORS_ORIGINS` | Yes | Allowed browser origins. |
| `SENTRY_DSN` | Optional | Error tracking. |
| `RATE_LIMIT_ENABLED` | Optional | Defaults to enabled if implemented. |

## Frontend environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Public backend API URL. |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable/anon key. |
| `VITE_SENTRY_DSN` | Optional | Frontend error tracking. |
| `VITE_SENTRY_ENABLED` | Optional | Enable or disable Sentry. |

## Health checks

Expected endpoints:

```bash
curl -i https://infamous-freight.fly.dev/health
curl -i https://infamous-freight.fly.dev/api/health
```

Expected status:

```txt
HTTP 200 OK
```

Expected body shape:

```json
{
  "status": "ok",
  "timestamp": "2026-04-28T17:30:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

## Critical blockers before go-live

### 1. Database setup

- [ ] PostgreSQL database provisioned
- [ ] `DATABASE_URL` configured in the API deployment platform
- [ ] Prisma schema generated successfully
- [ ] Database migrations applied
- [ ] API can connect to the database from production

Recommended commands:

```bash
npm run prisma:generate --workspace apps/api
npm run build --workspace apps/api
```

Run migrations using the repository's actual migration command once confirmed. Do not assume a missing script exists.

### 2. Stripe integration

- [ ] Stripe account configured for intended mode: test or live
- [ ] `STRIPE_SECRET_KEY` configured
- [ ] Webhook endpoint registered in Stripe dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` configured
- [ ] Checkout success/cancel URLs configured
- [ ] Billing portal return URL configured
- [ ] Test webhook event succeeds
- [ ] Test checkout/payment flow succeeds end-to-end

### 3. Frontend/backend communication

- [ ] `VITE_API_URL` points to deployed backend
- [ ] `WEB_APP_URL` points to deployed frontend
- [ ] `CORS_ORIGINS` includes deployed frontend origin
- [ ] Browser can call backend without CORS failure

### 4. Domain and TLS

- [ ] Frontend domain configured
- [ ] Backend domain configured or Fly domain confirmed
- [ ] TLS/SSL active
- [ ] DNS records verified

### 5. Secrets management

- [ ] All required backend variables set in deployment platform
- [ ] All required frontend variables set in deployment platform
- [ ] No production secrets committed to git
- [ ] Exposed Fly token rotated
- [ ] GitHub Actions `FLY_API_TOKEN` updated with the rotated token

## Deployment sequence

### Backend API on Fly.io

```bash
flyctl deploy --config fly.toml -a infamous-freight
flyctl status -a infamous-freight
flyctl logs -a infamous-freight
```

### Frontend static build

```bash
npm run build --workspace apps/web
```

Deploy `apps/web/dist/` to Netlify, Vercel static hosting, or equivalent.

## Verification commands

Run from repo root:

```bash
npm install
npm audit --workspaces --audit-level=high
npm audit --workspaces --omit=dev --audit-level=high
npm run prisma:generate --workspace apps/api
npm run build --workspace apps/api
npm test --workspace apps/api
npm run build --workspace apps/web
flyctl deploy --config fly.toml -a infamous-freight
curl -i https://infamous-freight.fly.dev/health
curl -i https://infamous-freight.fly.dev/api/health
flyctl status -a infamous-freight
flyctl logs -a infamous-freight
```

## Production readiness gate

Only mark Infamous Freight fully operational after:

- [ ] API build passes
- [ ] API tests pass
- [ ] Web build passes
- [ ] Docker image builds
- [ ] Fly deploy succeeds
- [ ] `/health` returns 200
- [ ] `/api/health` returns 200
- [ ] Database connection is confirmed
- [ ] Stripe webhook test passes
- [ ] Payment flow test passes
- [ ] Email/notification flow is verified if enabled
- [ ] Monitoring/logs are confirmed
- [ ] No unresolved high/critical production dependency vulnerabilities remain
- [ ] Exposed Fly token has been rotated
