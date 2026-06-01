# Production deployment workflow

This document describes what `.github/workflows/deploy.yml` deploys, what it only validates, which secrets it requires, and which smoke checks must pass before the workflow is considered successful.

## Trigger behavior

The workflow has three modes:

- `pull_request` targeting `main`: runs validation only. It does not deploy Netlify or Fly production from pull requests.
- `push` to `main`: validates the workspace, deploys the web app to Netlify production, deploys the API to Fly.io production, then runs production smoke checks.
- `workflow_dispatch`: manually runs the same production path as a `main` push. Use the GitHub Actions production environment approval gate for controlled manual deploys.

## Validation-only PR path

Pull requests run the `verify` job. This job installs dependencies with pnpm, runs repository safety checks, typechecks, lints, validates Prisma, runs tests, builds the workspace, and uploads the built web artifact for later production jobs.

The PR path is intentionally lightweight from a production perspective: it proves the deployable artifacts can be built, but it does not publish anything to Netlify or Fly.io.

## Production web deploy

The `deploy-netlify` job runs only for `push` to `main` or `workflow_dispatch` after `verify` passes.

It deploys `apps/web/dist` to Netlify production. The artifact is produced by the workspace build in `verify`, which includes `pnpm run build:web` through the root `pnpm run build` command.

Netlify proxy routes in `netlify.toml` send public `/api/*` traffic directly to `https://infamous-freight-api.fly.dev` so the frontend does not depend on `api.infamousfreight.com` being correctly pointed at Fly before proxied API smoke checks can pass. A host-scoped `https://api.infamousfreight.com/api/*` proxy is also present as a safety net when that hostname is temporarily attached to the Netlify site; the preferred long-term setup is still to point the API hostname at Fly.

Required GitHub Actions secrets:

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

The workflow checks that these secret names are present before invoking the Netlify deploy action. It must not print secret values.

## Production API deploy

The `deploy-fly` job runs only for `push` to `main` or `workflow_dispatch` after `verify` passes.

It deploys the root `Dockerfile` and `fly.toml` to the Fly app `infamous-freight-api` using `flyctl deploy` with a rolling, one-machine-at-a-time strategy.

Required GitHub Actions secret:

- `FLY_API_TOKEN`

The job verifies Fly CLI authentication with `flyctl auth whoami` using `FLY_API_TOKEN`, validates `fly.toml` before deploying, then checks Fly release health with `flyctl checks list -a infamous-freight-api` and a liveness probe against `https://infamous-freight-api.fly.dev/api/health/live`. The authentication step suppresses account output and must never print token values.

Do not use `flyctl config save -a infamous-freight-api --yes` in this workflow. It can rewrite known-good runtime settings.

## Production smoke checks

The `smoke-test` job depends on both production deploy jobs. It fails the workflow if any required production endpoint is unreachable or returns a non-success response.

Required endpoints:

- `https://www.infamousfreight.com`
- `https://www.infamousfreight.com/api/health`
- `https://api.infamousfreight.com/api/health`
- `https://api.infamousfreight.com/api/health/ready`

Additional checks:

- `https://api.infamousfreight.com/api/health/live`
- `https://infamous-freight-api.fly.dev/api/health/live`
- `https://infamousfreight.com` must resolve to `https://www.infamousfreight.com/` after redirects.

Readiness checks are deployment gates. If `/api/health` or `/api/health/ready` returns a non-2xx status, treat the deployment as failed or degraded and investigate dependency health, secrets, database connectivity, and API logs.

## What the workflow does not deploy

- It does not deploy production from pull requests.
- It does not run database migrations against production.
- It does not create, rotate, or print production secrets.
- It does not change DNS, Netlify domain settings, Fly custom domains, Stripe webhooks, Supabase settings, or dashboard-only configuration.
- It does not deploy Netlify Functions as the API origin; public `/api/*` traffic is proxied to the Fly-backed API according to `netlify.toml`.

## Rollback

If the web deploy fails, roll back to the previous successful Netlify production deploy from the Netlify dashboard.

If the API deploy fails, use Fly release rollback from an authenticated operator terminal, then re-run the smoke checks:

```bash
flyctl releases -a infamous-freight-api
flyctl deploy --image <previous-image> -a infamous-freight-api --strategy rolling --max-concurrent 1
curl -i https://infamous-freight-api.fly.dev/api/health/live
curl -i https://api.infamousfreight.com/api/health/ready
```

Do not paste secret values or token contents into GitHub Actions logs, issues, PRs, docs, or chat while investigating a failed deployment.
