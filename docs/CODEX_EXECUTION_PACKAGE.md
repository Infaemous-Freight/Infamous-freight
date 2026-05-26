# Codex Execution Package

This guide standardizes Codex-driven execution for Infamous Freight using the operating loop:

**Discover → Build → Verify → Optimize → Scale**

## Branch and workflow policy

- Create short-lived branches from `main` using:
  - `codex/infamous-{feature}-{date}`
- Keep commits small, reversible, and operationally clear.
- Avoid direct commits to `main` except explicit emergency instructions from owners.

## Security and secrets

- Never commit tokens, `.env` files, private keys, or credential dumps.
- Never print secret values in logs, comments, screenshots, or issues.
- Do not weaken auth, payments, compliance, or tenant isolation controls to pass CI.

## Platform invariants

### Fly.io API runtime

- App: `infamous-freight-api`
- Health path: `/api/health/live`
- Runtime process: `node apps/api/dist/src/server.js`
- Port invariants:
  - `PORT=3000`
  - `fly.toml` internal port `3000`
  - Dockerfile includes:
    - `ENV PORT=3000`
    - `EXPOSE 3000`
    - `CMD ["node", "apps/api/dist/src/server.js"]`


### Fly deployment safeguards

- Do **not** run `flyctl config save -a infamous-freight-api --yes` unless explicitly requested.
- When reconciling split/failed deployments, roll one machine at a time:
  - `fly deploy --strategy rolling --max-concurrent 1`
- Shared machine profile:
  - `cpu_kind = "shared"`
  - `memory = "512mb"`
  - `memory_mb = 512`
  - `size = "shared-cpu-1x"`
- Performance machine profile:
  - `cpu_kind = "performance"`
  - `memory = "2gb"`
  - `memory_mb = 2048`
  - `size = "performance-1x"`

### Supabase and token safety

- Supabase client must use `SUPABASE_URL` or `VITE_SUPABASE_URL`.
- Never use `SUPABASE_DATABASE_URL` for `createClient()`.
- Direct Postgres URLs only belong in server-side `DATABASE_URL`.

- Never introduce frontend/public variants of direct DB URL variables, including:
  - `VITE_SUPABASE_DATABASE_URL`
  - `PUBLIC_SUPABASE_DATABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_DATABASE_URL`
- Required production secret: `SUPABASE_JWT_SECRET` (preferred) or `JWT_SECRET`.
- Incident-response precedence: validate Supabase JWTs with `SUPABASE_JWT_SECRET` first; use `JWT_SECRET` only for legacy fallback paths.


## Git and branch bootstrap

Run these in an authenticated terminal before branch work when needed:

```bash
git remote -v
git remote add origin https://github.com/Infaemous-Freight/Infamous-freight.git
git checkout main
git pull origin main
git checkout -b codex/infamous-{feature}-{date}
git push -u origin codex/infamous-{feature}-{date}
```

## Verification checklist

Run the narrowest relevant checks first, then expand:

> Note: `flyctl checks list` and remote health curls can require authenticated network access from your terminal/session.


```bash
pnpm install --frozen-lockfile
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run prisma:validate
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run test
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

## Fly health incident triage

- `/api/health/live` is process liveness (should return `200` when process is alive).
- `/api/health` can return `503` for degraded dependencies.
- If live endpoint reports fallback mode, inspect startup logs for:
  - missing secrets
  - database connectivity/auth errors
  - Supabase/JWT configuration faults

## PR content requirements

Every Codex PR should include:

- change summary
- commands run + outcomes
- production impact
- rollback plan
- screenshots/logs for UI or deployment behavior changes
- linked issue (if applicable)

## Recommended automation loop

1. Convert request into scoped implementation tasks.
2. Patch smallest relevant file set.
3. Run focused checks.
4. Open PR with risk summary.
5. Let CI and human review complete before merge.
