# Deployment Guide

This document covers environment setup, secrets management, and platform-specific deployment for Infæmous Freight.

## Prerequisites

- Node.js 22.x (`nvm use` or `nvm install 22`)
- pnpm 9.x (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- PostgreSQL database (local or managed)
- Required environment variables (see [Environment Variables](#environment-variables))

---

## Environment Variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

**Never commit `.env` or any file containing real credentials.**

Core variables required by the API:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | API server port (default: `3001`) |

Additional variables are documented in `.env.example` and `docs/ENVIRONMENT_VARIABLES.md` (if present).

---

## Local Development

Bootstrap the environment from scratch:

```bash
bash scripts/setup.sh
```

This script will:
1. Enable Corepack and activate the pinned pnpm version.
2. Copy `.env.example` to `.env` if `.env` does not exist.
3. Install all workspace dependencies.
4. Build all packages.

Start all services simultaneously:

```bash
bash scripts/dev-all.sh
# or
make dev-all
```

Start individual services:

```bash
pnpm dev:api      # Express API on :3001
pnpm dev:web      # Next.js dashboard on :3000
pnpm dev:mobile   # Expo mobile app
```

---

## CI / CD

The CI pipeline (`.github/workflows/ci.yml`) runs on every pull request and push to `main`:

1. **sanity** — validates repo standards, builds shared package.
2. **lint** — ESLint across all workspaces.
3. **typecheck** — TypeScript checking across all workspaces.
4. **test** — unit tests with coverage upload.
5. **build** — production build of all apps (gated on lint + typecheck + test).

Merging to `main` is blocked until all CI checks pass.

---

## Secrets Management

All sensitive values are stored as **GitHub repository secrets** and injected as environment variables in CI workflows. They are never hardcoded in source code.

Required secrets for CI:

| Secret | Used by |
|---|---|
| `DATABASE_URL` | Test jobs that run against a real or ephemeral database |
| `JWT_SECRET` | API test suite |

For production deployments, secrets are managed via the target platform's secret store (e.g. Railway environment variables, Vercel environment settings, Fly.io secrets, Kubernetes Secrets).

---

## Platform Deployment

### API (Railway / Render / Fly.io)

```bash
# Build the API
pnpm --filter @infamous/api build

# Start
pnpm --filter @infamous/api start
```

Detailed runbooks:
- [`docs/deployment/DEPLOY_ACTION.md`](deployment/DEPLOY_ACTION.md) — GitHub Actions deploy workflow
- [`docs/deployment/DEPLOYMENT_RUNBOOK.md`](deployment/DEPLOYMENT_RUNBOOK.md) — step-by-step procedures

### Web (Vercel)

The Next.js app deploys automatically via the Vercel integration on push to `main`.

- [`docs/deployment/WEB_DEPLOYMENT_VERCEL.md`](deployment/WEB_DEPLOYMENT_VERCEL.md)

### Mobile (EAS / Expo)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build
eas build --platform all
```

- [`docs/deployment/MOBILE_DEPLOYMENT.md`](deployment/MOBILE_DEPLOYMENT.md) (if present)

---

## Database Migrations

Run Prisma migrations:

```bash
# Development
pnpm --filter @infamous/api exec prisma migrate dev

# Production
pnpm --filter @infamous/api exec prisma migrate deploy
```

Always test migrations in a staging environment before running them in production.

Migration files live in `apps/api/prisma/migrations/`. Supabase-specific SQL migrations are in `supabase/migrations/`.

---

## Rollback

If a deployment introduces regressions:

1. Revert the merged PR on `main`.
2. The CI pipeline will re-run on the revert commit.
3. Once CI passes, the previous build will be promoted.

For database rollbacks, see `apps/api/prisma/migrations/` for the Prisma migration history and coordinate a safe rollback with the on-call engineer.

---

## Further Reading

- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — system architecture
- [`docs/deployment/`](deployment/) — platform-specific runbooks
- [`docs/ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) — full env var reference (if present)
