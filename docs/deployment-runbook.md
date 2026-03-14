# Deployment Runbook

This runbook covers baseline deployment steps for the monorepo apps:

- `apps/web` (Vercel)
- `apps/api` (Railway)
- `apps/worker` (Railway)

## 1. Pre-deploy checks

1. Install dependencies:
   - `pnpm install --frozen-lockfile`
2. Validate quality gates:
   - `pnpm lint`
   - `pnpm test`
3. Run smoke checks locally:
   - `scripts/release-smoke-check.sh`

## 2. Environment variables

Copy and fill environment templates:

- Root: `.env.example`
- Web: `apps/web/.env.example`
- API: `apps/api/.env.example`
- Worker: `apps/worker/.env.example`

Set secrets in Vercel/Railway dashboards and keep local secrets out of git.

## 3. Deploy web (Vercel)

1. Ensure `vercel.json` settings match the active workspace names.
2. Trigger preview deploy via PR.
3. Merge to `main` for production deployment.

## 4. Deploy API + Worker (Railway)

1. Confirm `railway.json` references the right service names and startup commands.
2. Deploy API service and verify `/health` endpoint.
3. Deploy worker service and inspect startup logs.

## 5. Post-deploy validation

- Confirm API health endpoint returns success.
- Confirm web home page renders.
- Confirm worker service is running and emitting expected startup/heartbeat logs.
- Run `scripts/release-smoke-check.sh` against production URLs.

## 6. Rollback

- Vercel: rollback to previous deployment from project dashboard.
- Railway: redeploy previous successful build for API/worker.
- Re-run smoke checks after rollback.
