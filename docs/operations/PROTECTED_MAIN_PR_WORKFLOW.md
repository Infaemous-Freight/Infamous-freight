# Protected `main` PR Workflow (Infamous Freight)

This runbook documents the required path when direct pushes to `main` are blocked by GitHub branch protection.

## Why this exists

The repository enforces protection gates on `main` (required status checks, production deployment gate, and security scans). Direct writes to `main` are expected to fail.

## Safe execution flow

1. Create a short-lived branch from latest `main`:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout -b codex/infamous-<feature>-<YYYY-MM-DD>
```

2. Make the smallest reversible change.
3. Run required verification commands using `pnpm`.
4. Push the feature branch and open a PR.
5. Wait for required checks/deployment/security scans.
6. Merge only after all required branch protection gates pass.

## Required verification commands

```bash
pnpm install --frozen-lockfile
pnpm run env:check:frontend
pnpm run env:check:supabase-client
pnpm run build
pnpm run test
```

## Fly validation commands (authenticated operator terminal)

```bash
flyctl auth login
flyctl auth whoami
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

If browser-based login is unavailable in your shell, use a short-lived token in your own terminal session:

```bash
export FLY_ACCESS_TOKEN="<token from flyctl auth token>"
flyctl auth whoami
```

## Security and deployment guardrails

- Do not disable branch protection globally.
- Do not bypass required checks to force a merge.
- Keep runtime/Fly port alignment at `3000` (`PORT=3000`, `internal_port=3000`).
- Do not expose secrets in output, logs, commits, screenshots, or PR comments.
- Do not run `flyctl config save -a infamous-freight-api --yes` unless explicitly requested.
- Reconcile split/failed Fly deploys one machine at a time: `--strategy rolling --max-concurrent 1`.

## Health check expectations

- `/api/health/live` should return HTTP `200` when the process is alive.
- `/api/health` may return HTTP `503` when dependencies are degraded.
- If liveness reports fallback mode, inspect app logs for missing secrets, database failures, or auth configuration errors before promotion.

## Rollback

If a feature branch introduces risk:

1. Revert the PR before merge, or
2. Merge a focused revert commit immediately.

Keep rollback scope narrow and auditable.
