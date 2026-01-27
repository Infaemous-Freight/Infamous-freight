# Deployment Guide (100%)

**Last Updated:** January 17, 2026

This guide outlines a complete, production-ready deployment using Docker Compose with PostgreSQL, Redis, API, and Web services.

## Prerequisites
- A Linux host with Docker and Docker Compose v2
- A production `.env` file at repo root with real secrets
- Open ports: 80/443 (via reverse proxy), `API_PORT` (default 4000), `WEB_PORT` (default 3000)

## 1) Prepare Environment
1. Copy `.env.example` to `.env` and set production values:
   - `APP_URL`, `API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_BASE`
   - `JWT_SECRET` (32+ char random string)
   - `DATABASE_URL` (managed Postgres or local via Compose)
   - `REDIS_URL` (managed Redis or local via Compose)
   - `CORS_ORIGINS` including your web domain(s)
2. Optional: set Stripe/PayPal keys and Sentry/Datadog.

## 2) Build and Start
Build shared, then bring up the stack:

```bash
pnpm --filter @infamous-freight/shared build
docker compose --profile prod up -d --build
```

The `docker-compose.yml` will:
- Start Postgres and Redis
- Build and start the API (`API_PORT`, default 4000)
- Build and start the Web (`WEB_PORT`, default 3000)

## 3) Database Migrations
Inside the `api` container, run Prisma migrations:

```bash
docker compose exec api sh -lc 'cd src/apps/api && pnpm prisma:migrate:deploy && pnpm prisma:generate'
```

## 4) Reverse Proxy (Optional but recommended)
Use Nginx/Caddy to route:
- `https://api.yourdomain.com` → API container `API_PORT`
- `https://app.yourdomain.com` → Web container `WEB_PORT`
Add your domains to `CORS_ORIGINS` in `.env`.

## 5) Health & Smoke Tests
Run the included smoke test after startup:

```bash
bash scripts/smoke-test.sh
```

Expected:
- API `/api/health` returns JSON with `status: ok`
- Web returns HTML on `/`

## 6) Environment Matrix
- API in Docker maps to `API_PORT` external; defaults to 4000
- Web maps to `WEB_PORT`; defaults to 3000
- Compose health checks poll both services for readiness

## 7) CI/CD (Optional)
Infamous Freight uses a multi-platform CI/CD pipeline with Netlify handling the primary web deployment layer.

### Web (Netlify)
- Automatic deploys on every push to `main`
- Locked dependency install via `pnpm install --frozen-lockfile`
- pnpm workspace monorepo build order enforced
- Shared packages build before web app
- Next.js runtime with Netlify Edge + Functions support

### API (Fly.io)
- Deployed via GitHub Actions
- Prisma migrations validated per release
- Zero-downtime rolling deploys

### Mobile (Expo EAS)
- OTA updates enabled
- Release channels aligned with GitHub environments

## 8) Troubleshooting
- Update shared types after changes: `pnpm --filter @infamous-freight/shared build`
- Check service logs:

```bash
docker compose logs -f api
# or
docker compose logs -f web
```

- Verify CORS settings allow your web origin(s).
- Ensure `JWT_SECRET` and other secrets are set in `.env` before starting.

## 9) Rollback & Updates
- Rebuild and restart safely:

```bash
docker compose pull && docker compose --profile prod up -d --build
```

- To rollback, redeploy previous image tags or revert code to the last known good commit and rebuild.
