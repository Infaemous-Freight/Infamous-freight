# Infæmous Freight — Production Deployment Blueprint

## Recommended stack

- **Frontend:** Vercel Pro
- **API + workers + Redis + Postgres:** Railway
- **Error tracking:** Sentry
- **Uptime monitoring:** UptimeRobot
- **CI/CD:** GitHub Actions
- **Environments:** development, preview, staging, production
- **Mobile distribution:** PWA first, Capacitor later if store distribution is needed

---

## Architecture

### Services

#### Vercel
- `apps/web` — Next.js frontend

#### Railway
- `apps/api` — Node/Express REST API
- `apps/worker` — background jobs, scheduled tasks, queues
- `postgres` — primary database
- `redis` — cache, queue backend, rate-limiting primitives

#### Shared packages
- `packages/shared` — common types, utils, validation, auth helpers

### Environment layout

- `development` — local Docker or local services
- `preview` — Vercel preview deployments per PR
- `staging` — Railway staging services + staging Vercel project/domain
- `production` — main public environment

### Suggested domains

- `infamousfreight.com` → web production
- `staging.infamousfreight.com` → web staging
- `api.infamousfreight.com` → API production
- `api-staging.infamousfreight.com` → API staging

---

## Required environment variables

### Shared

```bash
NODE_ENV=production
APP_ENV=production
LOG_LEVEL=info
APP_NAME=infamous-freight
```

### API / Worker

```bash
API_PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=replace-me
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=replace-me-refresh
CORS_ORIGINS=https://infamousfreight.com
API_BASE_URL=https://api.infamousfreight.com
WEB_BASE_URL=https://infamousfreight.com
SENTRY_DSN=
```

### Web

```bash
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_URL=https://api.infamousfreight.com
NEXT_PUBLIC_SENTRY_DSN=
```

### Optional integrations

```bash
STRIPE_SECRET_KEY=
SENDGRID_API_KEY=
GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
```

---

## Monorepo structure

```text
.
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
├── packages/
│   ├── shared/
│   ├── config/
│   └── ui/
├── prisma/
├── scripts/
├── .github/
│   └── workflows/
├── railway.json
├── vercel.json
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Vercel configuration

`vercel.json` (at the repository root) is configured to:
- use Next.js framework
- install dependencies with pnpm
- build `apps/web` from the monorepo root (output at `apps/web/.next`)
- enable deployments from `main` and `staging`

### Web deployment notes

- Vercel project **Root Directory** should be the repository root (the monorepo), not `apps/web` — `vercel.json` and pnpm workspace filters handle building `apps/web`
- Enable preview deployments for PRs
- Add production domain and staging subdomain
- Store only public web variables in the Vercel project for the frontend
- Keep secrets in Railway for backend services

---

## Railway configuration

`railway.json` is configured to:
- use NIXPACKS builder
- run with one replica by default
- restart on failure with capped retries

### API service settings

- Root directory: `.`
- Build command: `pnpm install --frozen-lockfile && pnpm --filter @infamous/shared build && pnpm --filter @infamous/api build`
- Start command: `pnpm --filter @infamous/api start`
- Health check path: `/health`

### Worker service settings

- Root directory: `.`
- Build command: `pnpm install --frozen-lockfile && pnpm --filter @infamous/shared build && pnpm --filter @infamous/worker build`
- Start command: `pnpm --filter @infamous/worker start`

---

## Health checks

Ensure API exposes a lightweight `/health` endpoint returning status, uptime, timestamp, host, and environment.

---

## Security hardening

- Enable Helmet with HSTS
- Restrict CORS to production and staging web domains
- Apply baseline rate limiting (for example: `300` requests / `15m`)

---

## Sentry integration

- API: initialize `@sentry/node` using `SENTRY_DSN` and environment tags
- Web: initialize `@sentry/nextjs` using `NEXT_PUBLIC_SENTRY_DSN`

---

## Database migration and backup policy

### Prisma deployment commands

```bash
pnpm prisma generate
pnpm prisma migrate deploy
```

### Backup policy

- Daily automated PostgreSQL backups
- 7 daily restores retained
- 4 weekly restores retained
- 12 monthly restores retained
- Quarterly restore drill into a temporary staging DB

### Never do this in production

- `prisma migrate dev`
- destructive schema pushes without backup
- manual hotfixes directly in the prod DB without a migration record

---

## CI/CD workflow

`.github/workflows/deploy.yml` provides:
- validation (install, lint, typecheck, test, build) on PRs and pushes
- Railway API deploy on pushes to `main` / `staging`
- Prisma migrate deploy during API deployment
- Railway worker deploy on pushes to `main` / `staging`

### Vercel deployment model

- Let Vercel deploy the web app from Git integration
- Use `main` for production
- Use `staging` for staging
- Use PRs for preview deployments

---

## GitHub secrets

### Required secrets

- `RAILWAY_TOKEN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

### Vercel-managed variables

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_SENTRY_DSN`

---

## Staging strategy

### Rules

- staging uses a separate Railway environment
- staging uses a separate database
- staging uses a separate Redis instance
- staging domains never point at production data
- staging secrets are unique from production secrets

### Branch mapping

- `main` → production
- `staging` → staging
- feature branches → preview

---

## Load testing checklist

Before launch, verify:
- login flow
- shipment creation
- dispatch updates
- document uploads
- GraphQL query latency under realistic load
- queue throughput for worker jobs
- Redis connectivity under burst traffic
- DB connection pool behavior

---

## Uptime and alerting

### UptimeRobot monitors

Create at least these:
- `https://infamousfreight.com`
- `https://api.infamousfreight.com/health`
- `https://staging.infamousfreight.com`
- `https://api-staging.infamousfreight.com/health`

### Alert routing

- email alerts for now
- Slack or PagerDuty later when team operations mature

---

## Production release checklist

### Before release

- all CI jobs green
- migrations reviewed
- env vars verified
- Sentry enabled
- health checks passing
- rollback point identified
- backup confirmed
- staging smoke test complete

### Release

1. deploy API
2. run DB migrations
3. deploy worker
4. verify worker queue connectivity
5. verify web deployment
6. test critical flows

### After release

- watch Sentry for new exceptions
- check uptime monitors
- confirm no DB migration regressions
- validate key tenant flows

---

## Immediate action plan

1. Move frontend hosting to Vercel Pro
2. Deploy API and worker as separate Railway services
3. Use Railway Postgres first to reduce moving parts
4. Add `/health` endpoints and UptimeRobot monitors
5. Add Sentry to web and API
6. Configure GitHub Actions with validate + deploy flow
7. Create a true staging environment
8. Document secrets and rollback procedure

---

## Final recommendation

Start with **Vercel + Railway**.

This combination gets Infæmous Freight into production with reliable scaling, preview deployments, monitoring, and rollback discipline while keeping operational complexity low.
