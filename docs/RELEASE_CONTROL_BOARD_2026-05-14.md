# Infamous Freight Release Control Board — 2026-05-14

## Decision

**Private beta only. Do not approve paid beta or public launch until every release gate below is closed and verified.**

## Repo

`Infaemous-Freight/Infamous-freight`

## Confirmed repo facts

- Package manager: `pnpm@10.0.0`
- Node engine: `>=22.0.0 <23.0.0`
- Prisma: `7.8.0`
- Main production smoke script: `scripts/production-smoke-test.sh`
- Fly deploy wrapper: `.github/workflows/deploy-fly.yml`
- Reusable API deploy workflow: `.github/workflows/deploy-api.yml`
- Smoke test workflow: `.github/workflows/smoke-test.yml`
- API app default: `infamous-freight-api`
- Production smoke API URL default: `https://infamous-freight-api.fly.dev`

## GitHub release blocker

| Issue | Gate | Status |
|---|---|---|
| #2212 | Verify API health, Fly deploy, and smoke-test alignment | Open |

## Release gates

### Gate 1 — API health and smoke tests

Required proof:

```bash
pnpm run fly:health
pnpm run production:preflight
pnpm run production:smoke-test
```

Expected production smoke checks:

- `https://www.infamousfreight.com`
- `https://infamousfreight.com` redirects to `https://www.infamousfreight.com/`
- `https://infamous-freight-api.fly.dev/api/health/live`
- `https://infamous-freight-api.fly.dev/api/health/ready`

Pass condition:

- Production smoke script passes locally or in GitHub Actions.
- Smoke Test workflow passes after deploy.
- Evidence is recorded in `docs/LAUNCH_EVIDENCE_LOG.md`.

### Gate 2 — Deploy workflow

Required proof:

```bash
pnpm run fly:deploy
```

Or run GitHub Actions workflow:

- `Deploy Fly API`

Pass condition:

- Deploy completes.
- `scripts/fly-post-deploy-check.sh` passes.
- Smoke Test workflow passes after deploy.

### Gate 3 — Database / Prisma

Required proof:

```bash
pnpm run prisma:generate
pnpm run prisma:validate
pnpm -C apps/api exec prisma migrate status --schema prisma/schema.prisma
```

Pass condition:

- Production database target is confirmed.
- No pending or failed migrations remain.
- Migration status is recorded in `docs/LAUNCH_EVIDENCE_LOG.md`.

### Gate 4 — Backup and restore

Required proof:

```bash
pnpm run production:backup-postgres
pnpm run production:restore-postgres
```

Pass condition:

- Backup exists.
- Latest backup restores to non-production database.
- Restore time and sanity proof are recorded.

### Gate 5 — Stripe / billing

Required proof:

```bash
flyctl secrets list --app infamous-freight-api
```

Do not print secret values into logs.

Pass condition:

- Intended Stripe mode is confirmed in Stripe Dashboard.
- Webhook signing secret is configured in production runtime.
- Duplicate webhook replay is idempotent.
- Failed payment does not grant access.
- App subscription/payment state matches Stripe state.

### Gate 6 — Manual app QA

Required proof:

- Signup.
- Login.
- Logout.
- Password reset.
- Unauthorized API rejection.
- Create test load or shipment.
- Assign test operator/driver.
- Update status lifecycle.
- Upload/download test document.
- Close test shipment/load.
- Delete or clean up test data.

Pass condition:

- Full test completed with disposable test data only.
- Evidence recorded in `docs/LAUNCH_EVIDENCE_LOG.md`.

## Daily execution loop

```bash
git fetch origin
git status
pnpm install --frozen-lockfile
pnpm run check:prisma-versions
pnpm run prisma:validate
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run production:preflight
pnpm run production:smoke-test
```

## Paid beta approval rule

Paid beta is approved only when:

- Issue #2212 is closed with proof.
- `docs/LAUNCH_EVIDENCE_LOG.md` contains fresh evidence.
- Smoke test passes.
- Fly deploy health checks pass.
- Prisma migration status is verified.
- Backup restore proof exists.
- Stripe mode and webhooks are verified.
- Manual auth/freight workflows are verified.

## Fallback path

If `https://infamous-freight-api.fly.dev` is not the final public API path, choose one canonical path and align all of these:

- `scripts/production-smoke-test.sh`
- `.github/workflows/smoke-test.yml`
- `.github/workflows/deploy-api.yml`
- `docs/LAUNCH_EVIDENCE_LOG.md`
- Netlify/API proxy settings

Do not leave CI and production traffic checking different API paths.
