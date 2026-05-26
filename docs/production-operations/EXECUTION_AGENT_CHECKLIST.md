# Execution Agent Checklist (Discover → Build → Verify → Optimize → Scale)

This checklist is the standard operating flow for execution tasks in Infamous Freight.

## Discover

1. Confirm git remote and branch:

```bash
git remote -v
git branch --show-current
```

If `origin` is missing:

```bash
git remote add origin https://github.com/Infaemous-Freight/Infamous-freight.git
```

2. Create a short-lived branch:

```bash
git checkout -b codex/infamous-<feature>-$(date +%Y%m%d)
```

3. Confirm deployment invariants before edits:

```bash
rg -n "internal_port\s*=\s*3000" fly.toml
rg -n "ENV PORT=3000|EXPOSE 3000|CMD \[\"node\", \"apps/api/dist/src/server.js\"\]" Dockerfile
```

4. Confirm Supabase client env safety before edits:

```bash
rg -n "SUPABASE_DATABASE_URL|VITE_SUPABASE_DATABASE_URL|PUBLIC_SUPABASE_DATABASE_URL|NEXT_PUBLIC_SUPABASE_DATABASE_URL|createClient\(" apps scripts
```


Critical Fly config safety rule:

```bash
# Do NOT run unless explicitly instructed by owner
# flyctl config save -a infamous-freight-api --yes
```

## Install required CLIs and configure runtime environment variables

Run one command to install required CLIs and apply canonical runtime env values when `FLY_API_TOKEN` is present:

```bash
bash scripts/provision-ctl-and-runtime-env.sh
```

Manual equivalent (if you need step-by-step control):

```bash
bash scripts/install-required-clis.sh
export PATH="$(pwd)/.tools/bin:$PATH"
bash scripts/verify-required-clis.sh
export FLY_API_TOKEN=<token>
bash scripts/production-canonical-env.sh
```

Required production auth secret check (do not print values):

```bash
flyctl secrets list -a infamous-freight-api | rg "SUPABASE_JWT_SECRET|JWT_SECRET"
```

## Build

- Make the smallest safe patch that addresses the root cause.
- Do not weaken auth, compliance, billing, or CI controls.
- Keep runtime and Fly port contract at `3000`.
- Do not expose secret values in code, logs, or screenshots.

## Verify

Run narrow checks first, then broader checks:

```bash
pnpm install --frozen-lockfile
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run build
pnpm run test
```

Run full repo recommended validation before PR handoff:

```bash
pnpm run lint
pnpm run typecheck
pnpm run check:prisma-versions
pnpm run prisma:validate
pnpm run codex:env-check
```

Run Fly checks (authenticated Fly terminal required):

```bash
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

## Optimize

- Keep each commit focused and reversible.
- Reuse existing scripts for validation.
- Document production impact, rollback plan, and any required follow-up.

## Scale

Use this PR-ready summary template:

- Summary of changes
- Commands run + result
- Production impact
- Rollback plan
- Follow-up items requiring credentials/dashboard-only access

## Fly Health Failure Triage

- `GET /api/health/live` should return `200` when process is alive.
- `GET /api/health` may return `503` if dependencies are degraded.
- If `/api/health/live` shows `mode=\"fallback\"`, treat as startup failure and inspect logs for:
  - missing `SUPABASE_JWT_SECRET` or `JWT_SECRET`
  - database connectivity errors
  - auth/bootstrap configuration failures

## Deployment Guardrail

When reconciling split/failed deploys (one machine at a time):

```bash
flyctl deploy -a infamous-freight-api --strategy rolling --max-concurrent 1
```
