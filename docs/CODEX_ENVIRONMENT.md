# Codex Environment Setup

This document explains how to configure OpenAI Codex for the Infamous Freight repository without exposing sensitive values.

## What is already safe in the repo

The repository includes a safe example file and a safe environment checker:

- `.env.example` lists variable names and development placeholders only.
- `scripts/codex-env-check.sh` checks whether variables are present without printing secret values.
- `.gitignore` ignores local `.env` files while allowing checked-in example files.

Do not commit real `.env`, Stripe, Supabase, database, SendGrid, Sentry, or carrier API secret values.


## Environment scopes are separate

`pnpm run codex:env-check` reads only the current Codex/shell environment and local `.env.local`/`.env` files. It does **not** read Netlify site variables, Fly.io app secrets, GitHub Actions secrets, Stripe Dashboard secrets, or Supabase Dashboard values.

Keep these stores reconciled by variable name, but never copy values into chat, PRs, issues, screenshots, or logs:

| Store | Used by | Verification command | Notes |
| --- | --- | --- | --- |
| Codex environment | Agent builds, tests, and repo checks | `pnpm run codex:env-check` | Add values in the Codex runtime itself when checks run here. |
| Netlify environment | Production web build/runtime | `netlify env:list --context production --site <site-id>` | Netlify values do not satisfy Codex checks unless separately configured in Codex. |
| Fly.io secrets | `infamous-freight-api` runtime | `flyctl secrets list -a infamous-freight-api` | Fly secret names do not satisfy Codex checks unless separately configured in Codex. |
| Supabase dashboard | Project API/Auth/database settings | Dashboard-only for secret retrieval | Use `https://wnaievjffghrztjuvutp.supabase.co` as the project URL; do not expose service-role, JWT, or database credentials. |
| Stripe dashboard | Live API and webhook signing secrets | Dashboard-only for secret retrieval | Retrieve or rotate secret values from Stripe directly, then store them in Codex/Fly/Netlify as needed. |

The confirmed Supabase production project is **Infæmous** (`wnaievjffghrztjuvutp`) with project URL `https://wnaievjffghrztjuvutp.supabase.co`. Use that URL for `SUPABASE_URL` and `VITE_SUPABASE_URL`; keep the direct Postgres connection string only in server-side `DATABASE_URL`.

## Required Codex environment variables

Add these in the Codex **Environment variables** section when Codex needs to build, test, or run the full app:

```env
NODE_ENV=development
DATABASE_URL=[POSTGRES_CONNECTION_STRING]
STRIPE_SECRET_KEY=[STRIPE_SECRET_KEY]
STRIPE_WEBHOOK_SECRET=[STRIPE_WEBHOOK_SECRET]
SUPABASE_URL=[SUPABASE_PROJECT_URL]
VITE_SUPABASE_URL=[SUPABASE_PROJECT_URL]
SUPABASE_SERVICE_ROLE_KEY=[SUPABASE_SERVICE_ROLE_KEY]
VITE_SUPABASE_ANON_KEY=[SUPABASE_ANON_KEY]
WEB_APP_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

The checker accepts either name in each one-of group:

```env
SUPABASE_SERVICE_KEY=[SUPABASE_SERVICE_ROLE_KEY]
# or
SUPABASE_SERVICE_ROLE_KEY=[SUPABASE_SERVICE_ROLE_KEY]

VITE_SUPABASE_PUBLISHABLE_KEY=[SUPABASE_PUBLISHABLE_OR_ANON_KEY]
# or
VITE_SUPABASE_ANON_KEY=[SUPABASE_ANON_KEY]

CORS_ORIGINS=http://localhost:5173
# or
CORS_ORIGIN=http://localhost:5173
```

## Execution loop and deployment guardrails

Use this operating loop for all Codex tasks in this repository:

1. Discover
2. Build
3. Verify
4. Optimize
5. Scale

Fly.io deployment safety requirements:

- App name: `infamous-freight-api`
- Keep runtime `PORT=3000`
- Keep `fly.toml` `http_service.internal_port = 3000`
- Keep Docker runtime command as `node apps/api/dist/src/server.js`
- Liveness check path: `/api/health/live`
- Do not use `flyctl config save -a infamous-freight-api --yes` unless explicitly required.

Supabase/security guardrails:

- Supabase browser/server clients must use `SUPABASE_URL` or `VITE_SUPABASE_URL`.
- Never use `SUPABASE_DATABASE_URL` (or any `PUBLIC_`/`NEXT_PUBLIC_`/`VITE_` variant) for Supabase client setup.
- Database connection strings belong only in `DATABASE_URL` on server-side runtime.
- Production must include `SUPABASE_JWT_SECRET` or `JWT_SECRET` (prefer `SUPABASE_JWT_SECRET` when validating Supabase tokens).
- Incident response should verify tokens with `SUPABASE_JWT_SECRET` first and treat `JWT_SECRET` as legacy fallback only.

## Recommended local development defaults

Use these non-secret values for local development:

```env
NODE_ENV=development
PORT=3001
WEB_APP_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
STRIPE_CHECKOUT_SUCCESS_URL=http://localhost:5173/billing/success
STRIPE_CHECKOUT_CANCEL_URL=http://localhost:5173/billing/cancel
STRIPE_PORTAL_RETURN_URL=http://localhost:5173/billing
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=ws://localhost:3001
```

These local defaults are intentionally separate from Fly runtime requirements (`PORT=3000` and `http_service.internal_port = 3000`) used by the deployed API app.

Use test/dev keys for Stripe, Supabase, and database credentials. Do not use production credentials in local or experimental Codex environments unless the task explicitly requires production verification.

## Optional integration variables

Use these only when testing the related integrations:

```env
REDIS_HOST=[REDIS_HOST]
REDIS_PORT=6379
REDIS_PASSWORD=[REDIS_PASSWORD]
REDIS_DB=0
JWT_SECRET=[JWT_SECRET]
RATE_LIMIT_ENABLED=true
API_RATE_LIMIT_ENABLED=true
SENTRY_DSN=[SENTRY_DSN]
VITE_SENTRY_DSN=[PUBLIC_SENTRY_DSN]
VITE_SENTRY_ENABLED=true
SENTRY_ORG=[SENTRY_ORG]
SENTRY_PROJECT=[SENTRY_PROJECT]
SENTRY_AUTH_TOKEN=[SENTRY_AUTH_TOKEN]
DAT_API_KEY=[DAT_API_KEY]
TRUCKSTOP_API_KEY=[TRUCKSTOP_API_KEY]
LOADBOARD_API_KEY=[LOADBOARD_API_KEY]
SAMSARA_API_TOKEN=[SAMSARA_API_TOKEN]
MOTIVE_CLIENT_ID=[MOTIVE_CLIENT_ID]
MOTIVE_CLIENT_SECRET=[MOTIVE_CLIENT_SECRET]
QBO_CLIENT_ID=[QBO_CLIENT_ID]
QBO_CLIENT_SECRET=[QBO_CLIENT_SECRET]
XERO_CLIENT_ID=[XERO_CLIENT_ID]
XERO_CLIENT_SECRET=[XERO_CLIENT_SECRET]
SENDGRID_API_KEY=[SENDGRID_API_KEY]
FROM_EMAIL=[FROM_EMAIL]
RTS_API_KEY=[RTS_API_KEY]
OTR_API_KEY=[OTR_API_KEY]
APEX_API_KEY=[APEX_API_KEY]
```

## Secrets vs environment variables

Use **Environment variables** for values the app and tests need during the Codex task.

Use **Secrets** for one-time setup credentials only, such as package registry tokens or temporary install credentials.

Secrets may not be available to the Codex agent after setup, so do not put app runtime values there if tests or scripts need them.

## Safe verification command

Run this after saving the Codex environment:

```bash
pnpm run codex:env-check
```

For automation or preflight checks that should fail when required variables are missing, run:

```bash
pnpm run codex:env-check:strict
```

Or run the script directly:

```bash
bash scripts/codex-env-check.sh
bash scripts/codex-env-check.sh --strict
```

The script confirms whether variables are set and lists variable names only. It does not print secret values.

## Latest agent environment inventory result

_Last checked: May 30, 2026._

The final environment inventory check completed safely: it listed environment variable names only and did not print secret values.

### Current agent-environment blockers

The current agent environment is missing these required/core entries reported by `pnpm run codex:env-check`:

- `NODE_ENV`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `VITE_SUPABASE_URL`
- one of `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- one of `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`

For strict production-launch validation, also configure these production-required entries before rerunning the gate:

- `WEB_APP_URL`
- `CORS_ORIGINS` or legacy `CORS_ORIGIN`
- `SUPABASE_JWT_SECRET` (preferred) or `JWT_SECRET`

Root cause: these required runtime values are not configured in the current agent environment. Netlify environment variables, Fly.io runtime secrets, GitHub Actions secrets, Stripe secrets, Supabase dashboard values, and Codex runtime variables are separate stores. Configure the missing names in the Codex runtime itself when this check runs in Codex; configure Fly and Netlify separately for deployed runtime validation. Then rerun `pnpm run codex:env-check` or `pnpm run codex:env-check:strict`.

The environment checker now prints a names-only remediation section when required variables are missing or placeholder-looking values are configured. That output is safe to paste because it reports variable names only, but the follow-up secret-setting commands must be run from an authenticated operator terminal and must never include real values in shared logs.

### Safe remediation commands

Run secret-setting commands only from an authenticated operator terminal. Do not paste real values into chat, PRs, issues, screenshots, or shared logs, and do not copy the example labels below as literal secret values.

First verify access and list only configured Fly secret names:

```bash
flyctl auth whoami
flyctl secrets list -a infamous-freight-api
```

For API/runtime values, fetch each real value from the secure vault and import `NAME=VALUE` pairs through stdin. Keep `PORT=3000` aligned with the Fly internal port:

```bash
flyctl secrets import -a infamous-freight-api <<'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=<set-from-secure-vault>
SUPABASE_URL=<set-from-secure-vault>
SUPABASE_ANON_KEY=<set-from-secure-vault>
SUPABASE_SERVICE_ROLE_KEY=<set-from-secure-vault>
SUPABASE_JWT_SECRET=<set-from-secure-vault>
STRIPE_SECRET_KEY=<set-from-secure-vault>
STRIPE_WEBHOOK_SECRET=<set-from-secure-vault>
CORS_ORIGINS=https://www.infamousfreight.com
WEB_APP_URL=https://www.infamousfreight.com
EOF
```

Do not run the import template with placeholder labels still present. If entering inline assignments instead, use a private terminal and clear any retained shell history according to your workstation policy after setting secrets.

Use the frontend host for browser-public values only. Pass the real values from the secure vault in the authenticated operator terminal:

```bash
netlify env:set VITE_SUPABASE_URL '<real-supabase-api-url>'
netlify env:set VITE_SUPABASE_PUBLISHABLE_KEY '<real-supabase-publishable-key>'
```

Do not add `DATABASE_URL`, Supabase service-role keys, JWT secrets, Stripe secret keys, or webhook secrets to frontend env files or browser-public environment variables.

### Recommended production/operator runtime values

Before production launch validation, verify these runtime names exist in the target platform secret manager or operator environment without printing values:

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (or legacy `SUPABASE_SERVICE_KEY` where supported)
- `SUPABASE_JWT_SECRET` (preferred) or `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `REDIS_URL`
- `CORS_ORIGINS`
- `WEB_APP_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`

Risk check: do not paste real values into logs, PR comments, issues, or screenshots. Only report missing variable names and command status.

Fallback: if production validation must continue from an authenticated operator terminal, configure the missing values in the deployment environment, validate Fly configuration, then check `https://infamous-freight-api.fly.dev/api/health/live` without printing secrets. If `/api/health/live` returns `mode="fallback"`, treat that as a real API startup failure even if Fly liveness passes and inspect logs for missing secrets, database connectivity errors, or auth configuration errors.

Rollback note for the related operational metrics launch work: revert the operational metrics migration hardening and tenant-scoping changes, then rerun Prisma validation plus the focused freight operations, health, and RBAC tests before redeployment.

## Avoid unsafe commands

Do not run this in shared logs unless you are certain no secrets are present:

```bash
printenv | sort
```

That prints full environment variable values, including private keys.

## Recommended Codex flow

```bash
pnpm install --frozen-lockfile
pnpm run codex:env-check
pnpm run prisma:generate
pnpm run build
pnpm run test
```

Use strict mode before declaring the environment ready:

```bash
pnpm run codex:env-check:strict
```

If `pnpm run codex:env-check` reports a missing value, add it to the Codex environment and save the environment before running Codex again.
