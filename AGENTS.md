# Agent Operating Guide

This repository is configured for AI-assisted development. Use this guide before making changes so agents, maintainers, and automation all follow the same safe loop.

## Primary repo

- Repository: `Infaemous-Freight/Infamous-freight`
- Default branch: `main`
- Package manager: `pnpm`
- Runtime: Node.js 22
- App layout: pnpm monorepo
- Production API app: `infamous-freight-api`
- Production API health: `https://infamous-freight-api.fly.dev/api/health/live`

## Mission

Infamous Freight is an AI-driven freight operations platform covering dispatch execution, shipment visibility, driver coordination, compliance workflows, billing, and logistics automation.

## Codex Infamous execution profile

When acting as the Codex execution agent for this repo, optimize for operationally safe freight-platform delivery:

- Be direct, do not guess, and cite the exact files or commands used when answering repo questions.
- Keep the app deployable on Fly.io before, during, and after every patch.
- Never weaken security, tenant isolation, Supabase JWT verification, Stripe webhook verification, or approval gates just to make a build pass.
- Prefer small, reversible commits that can be reviewed and rolled back independently.
- Use free, legal, open-source tooling first.
- Never expose secrets in logs, commits, screenshots, issues, comments, PRs, or chat output.
- Before code changes, inspect the relevant files, identify the likely root cause, make the smallest safe patch, and avoid broad rewrites.
- After code changes, run the narrowest relevant checks first, then broader checks when behavior, build, deployment, or security posture changed.

## Operating loop

Every change should follow this sequence:

1. Discover — inspect the relevant app, package, script, workflow, and docs before editing.
2. Build — make the smallest useful change that solves the stated outcome.
3. Verify — run the narrowest relevant checks first, then broader validation when needed.
4. Optimize — remove duplication, document operational impact, and keep changes focused.
5. Scale — leave repeatable scripts, templates, tests, or docs when they reduce future work.

## PR-first workflow

Agents should prefer pull requests over direct commits to `main`.

Use this flow for repo-side work:

1. Create a short-lived branch from `main`.
2. Make focused code, config, documentation, or test changes on that branch.
3. Open a draft PR for risky, production-impacting, database, auth, billing, deployment, or infrastructure changes.
4. Include validation steps, production impact, and rollback notes in the PR body.
5. Let CI and human review run before merge.
6. Use issues only for work that cannot be represented as a repo diff, such as dashboard-only settings, external account configuration, or operational follow-up requiring credentials.

Direct commits to `main` should be avoided except for emergency fixes explicitly requested by the repository owner.

## Repo map

- `apps/api` — Express 5 API, TypeScript, Prisma, operational backend services.
- `apps/web` — React 19 + Vite frontend, TypeScript operator surfaces.
- `netlify/functions` — retained Netlify function entrypoints and fallbacks.
- `docs` — architecture, operations, production, deployment, and launch documentation.
- `scripts` — setup, validation, deployment, health, and environment tooling.
- `.github` — CI, repository automation, issue templates, and PR templates.

## Required commands

Use `pnpm`, not npm or yarn. Do not bypass `pnpm install --frozen-lockfile` as the default dependency fix; prefer syncing `package.json` with `pnpm-lock.yaml` or updating the lockfile intentionally.

```bash
pnpm install --frozen-lockfile
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run lint
pnpm run typecheck
pnpm run check:prisma-versions
pnpm run prisma:validate
pnpm run build
pnpm run test
pnpm run codex:env-check
```

For smaller checks:

```bash
pnpm -C apps/api run test -- --runInBand
pnpm -C apps/web run test
pnpm -C apps/web run typecheck
pnpm -C apps/api run lint
```

## Codex completion checklist

For repo changes, record each applicable result in the PR or final response. If a command cannot run because it needs an authenticated operator terminal or a missing local tool, mark it as an environment limitation and provide the exact command for the operator to run.

1. Dependency integrity: `pnpm install --frozen-lockfile`.
2. Frontend secret safety: `pnpm run env:check:frontend`.
3. Supabase client safety: `pnpm run env:check:supabase-client`.
4. Static analysis: `pnpm run lint`.
5. TypeScript validation: `pnpm run typecheck`.
6. Build validation: `pnpm run build`.
7. Behavior validation when code behavior changes or when the PR description recommends it: `pnpm run test`.
8. Fly config validation when `fly.toml`, `Dockerfile`, deployment scripts, ports, processes, health checks, or runtime env behavior change: `flyctl config validate --config fly.toml`.
9. Authenticated Fly checks from an operator terminal when production health or deployment state is in scope: `flyctl checks list -a infamous-freight-api`.
10. Production liveness smoke check when production health is in scope: `curl -i https://infamous-freight-api.fly.dev/api/health/live`.

## Production validation commands

Run these only from an authenticated operator terminal with Fly.io access:

```bash
flyctl auth whoami
flyctl secrets list -a infamous-freight-api
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

Do not paste secret values into tickets, PRs, logs, Codex output, or chat. Report only missing secret names and command status.

## Required production secret names

The Fly app should have these runtime secrets/config values present where the API requires them:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `REDIS_URL`
- `CORS_ORIGINS`
- `WEB_APP_URL`
- `NODE_ENV`
- `PORT`

Use `flyctl secrets set` from an authenticated terminal only. Never commit real values.

## Safety rules

- Do not commit secrets, tokens, `.env` files, private keys, database dumps, or production credentials.
- Do not bypass CI, auth, payments, compliance controls, or approval gates.
- Do not introduce hidden network calls, credential collection, spam, scraping abuse, or unauthorized data access.
- Keep migrations immutable once applied.
- Document any environment variable, deployment, database, or billing impact in the PR.

## Auth, tenant, and RBAC rules

- Do not rely on client-supplied `x-tenant-id`, `x-user-role`, or `subscription-status` as final production authority.
- Prefer verified Supabase JWT claims plus database-backed organization membership checks.
- Preserve tenant-aware and role-aware behavior in API, UI, realtime, and database access.
- Enforce `organization_id` on tenant-scoped queries, service methods, realtime filters, RLS policies, and indexes.
- Preserve the platform roles: `admin`, `owner`, `dispatcher`, `sales`, `accounting`, `shipper`, `carrier`, and `driver`.

## Supabase and RLS rules

- `createClient()` must use `SUPABASE_URL` or `VITE_SUPABASE_URL`, never `SUPABASE_DATABASE_URL`.
- Browser/public variables must use Supabase API URLs, not Postgres database URLs.
- Server-only database URLs belong in `DATABASE_URL` or server-side secret stores only.
- Never create or use `VITE_SUPABASE_DATABASE_URL`, `PUBLIC_SUPABASE_DATABASE_URL`, or `NEXT_PUBLIC_SUPABASE_DATABASE_URL`.
- `SUPABASE_JWT_SECRET` or `JWT_SECRET` is required in production; prefer `SUPABASE_JWT_SECRET` when verifying real Supabase tokens.
- Tenant-scoped tables need `FOR SELECT` policies tied to verified organization membership.
- Realtime subscriptions for dispatch surfaces must filter by `organization_id`.
- Add indexes for `organization_id` and common foreign keys used by tenant/RLS predicates.

## Stripe webhook rules

- Verify `stripe-signature` with `STRIPE_WEBHOOK_SECRET`.
- Preserve raw request body for webhook verification.
- Process Stripe events idempotently by event ID.
- Do not expose `STRIPE_SECRET_KEY` or webhook secrets to browser code.
- Success and cancel URLs should come from environment configuration.

## Deployment rules

- Keep Fly internal API port aligned with `PORT=3000` unless the app and Fly config are changed together.
- Keep the API process as `node apps/api/dist/src/server.js`.
- Keep `fly.toml` for `infamous-freight-api` on `http_service.internal_port = 3000`.
- Keep the root `Dockerfile` API image on `ENV PORT=3000`, `EXPOSE 3000`, and `CMD ["node", "apps/api/dist/src/server.js"]`.
- Do not run or recommend `flyctl config save -a infamous-freight-api --yes` unless explicitly requested; it can regenerate unsafe `fly.toml` values.
- When reconciling failed or split Fly deployments, deploy one machine at a time with `--strategy rolling --max-concurrent 1`.
- If using shared Fly machines, keep `cpu_kind = "shared"`, `memory = "512mb"`, `memory_mb = 512`, and `size = "shared-cpu-1x"`.
- If intentionally moving to performance Fly machines, keep `cpu_kind = "performance"`, `memory = "2gb"`, `memory_mb = 2048`, and `size = "performance-1x"`.
- Preserve Netlify redirects/proxy behavior for API routes.
- Keep liveness/readiness checks explicit so `/api/health/live` returns 200 when the process is alive, while `/api/health` may return 503 when dependencies are degraded.
- If `/api/health/live` returns `mode="fallback"`, Fly health may pass but real API startup still failed; check logs for missing secrets, database errors, or auth configuration errors.
- Prefer non-destructive deploy validation before applying production changes.

## Change standards

- Keep changes focused and reversible.
- Update docs when behavior, setup, deployment, env vars, or operator flows change.
- Add or update tests for business logic and regression fixes.
- Use existing scripts before inventing new ones.
- Favor explicit TypeScript types and clear error handling.

## Git hygiene

- Confirm the remote before pulling or pushing with `git remote -v`.
- If `origin` is missing, add `https://github.com/Infaemous-Freight/Infamous-freight.git`.
- Prefer short-lived branch names like `codex/infamous-{feature}-{date}` for agent work unless a higher-priority instruction requires staying on the current branch.
- Use direct, operational commit messages.

## PR checklist for agents

Before opening or updating a PR, include:

- Summary of what changed.
- Commands run and results, including explicit pass, fail, or environment-limited status for each relevant Codex completion checklist command.
- Production impact.
- Rollback plan for deployment or database changes.
- Screenshots or logs when UI/deployment behavior changed.
- Linked issue when applicable.
- Risk check and fallback or rollback path.

## Response standards

- Be direct and include exact commands.
- Do not guess about production, credentials, secrets, or external account state.
- If a step requires the user's authenticated Fly.io or GitHub terminal, say so and provide the exact command.
- Include a risk check and fallback for operational changes.

## Recommended automation path

1. Convert user requests into scoped implementation tasks.
2. Create a short-lived branch per task.
3. Patch the smallest relevant file set.
4. Run focused checks.
5. Open a PR using the repository PR template.
6. Let CI validate before merge.
7. Capture dashboard-only or credentials-required follow-up work as separate issues only when no repo diff is possible.
