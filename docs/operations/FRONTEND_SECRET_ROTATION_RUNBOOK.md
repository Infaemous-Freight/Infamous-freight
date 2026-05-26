# Frontend Secret Rotation Runbook (.env.production exposure)

## Scope

Use this runbook when a frontend environment file (for example `apps/web/.env.production`) is tracked in git, appears in PR diffs, or is exposed in logs.

Reference change stack layer: `app_config_metadata`.

## Root cause pattern

A production env file was committed or tracked, exposing browser-facing provider values that must be managed in deployment dashboards, not in repository files.

## Immediate containment (git)

1. Ensure ignore coverage exists in root `.gitignore`:

```bash
printf '\n.env.production\n**/.env.production\n' >> .gitignore
```

2. Remove tracked file from index without deleting local copy:

```bash
git rm --cached apps/web/.env.production
```

3. Verify file is no longer tracked:

```bash
git ls-files apps/web/.env.production
```

4. Commit and push containment change:

```bash
git add .gitignore
git commit -m "security: stop tracking frontend production env file"
git push
```

## Rotation and redeploy steps (dashboard-auth required)

> These steps require authenticated dashboard access and must be run by an authorized operator in Supabase/Netlify.

1. **Supabase** (Project Settings → API): rotate the publishable/anon key.
2. **Netlify** (Site settings → Environment variables): set/update production values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (new rotated value)
   - `VITE_STRIPE_PUBLIC_KEY`
3. Trigger a production redeploy from Netlify after env updates are saved.

## Required verification

Run standard local checks after env updates:

```bash
pnpm install --frozen-lockfile
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run build
```

Run deployment/runtime checks:

```bash
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

Expected health behavior:

- `/api/health/live` should return `200` if process liveness is healthy.
- `/api/health` may return `503` if dependencies are degraded.
- If `/api/health/live` returns `mode="fallback"`, investigate startup logs for missing secrets, DB failures, or auth configuration errors.

## Risk check

- If Supabase key rotation is not synchronized with Netlify variable updates and redeploy, frontend auth or API initialization can fail.
- Public/browser-exposed keys are still incident-sensitive and should be rotated after exposure.

## Rollback

- Roll back frontend deployment to last known good Netlify release.
- Re-apply correct rotated values in Netlify and redeploy.
- Do **not** reintroduce `.env.production` into git tracking.

## Prevent recurrence

- Keep `.env.production` ignored repo-wide.
- Store production values only in provider dashboards (Netlify/Supabase/Stripe), not tracked files.
- Add PR review guardrails for `.env*` additions in tracked files.
- Periodically verify no frontend env files are tracked:

```bash
git ls-files | rg '\.env(\.|$)'
```
