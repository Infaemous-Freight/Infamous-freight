# Recommended actions runbook — 2026-05-20

This document tracks owner/admin actions that cannot be safely mutated from a repo patch.

## Repo-side fixes applied by this branch

- apps/web axios dependency set to `~1.15.2`.
- apps/api and apps/web Node typings aligned to the Node 22 runtime baseline with `@types/node@^22`.
- pnpm lockfile should be regenerated with `pnpm install`.
- README status/source-of-truth note is kept idempotent.

## Admin-only actions

### Netlify frontend secrets

- Remove server-only secrets from the frontend Netlify deploy surface unless a deployed function truly requires them.
- Rotate any secret that may have been exposed in frontend or broad Netlify scope.
- Keep browser-safe values only, such as public `VITE_*` values and public Supabase anon values.
- Confirm `VITE_API_URL=/api`.
- Verify with `pnpm run env:check:frontend` and `pnpm run netlify:production:readiness`.

### Supabase leaked password protection

- Enable leaked password protection in the active Supabase Auth settings.
- Confirm the advisor warning clears or document a deliberate exception.
- Add the check to weekly security review.

### GitHub rulesets / coding agent

- Keep `main` protected.
- Allow only the minimum bypass/exception needed for Copilot/Codex/openai-code-agent to create feature branches and PRs.
- Do not grant broad direct-push bypass to production branches.

### infamousfreight.co redirect

- Configure Manus, registrar forwarding, or DNS/web forwarding so `https://infamousfreight.co/*` redirects to `https://www.infamousfreight.com/:splat`.
- Prefer 301 Permanent Redirect and preserve path/query strings where supported.
- Verify with `curl -I https://infamousfreight.co` and `curl -I https://infamousfreight.co/pricing`.

### Release and operations evidence

Run from trusted CI/local environment with required secrets:

```bash
pnpm run build:api
pnpm run test:api
pnpm run fly:deploy
pnpm run production:smoke-test
```

Also run GitHub Actions workflows where present:

- Release Command Run
- Release Gate
- Deploy Fly API
- Smoke Test
- Operations Validation Suite

Record successful evidence in `docs/LAUNCH_EVIDENCE_LOG.md` before paid beta/public launch.

### Runtime/load monitoring

- Review Fly logs for OOM/restarts.
- Review Prisma pool/timeout errors.
- Review Socket.io reconnect spikes.
- Review p95 latency, CPU, and memory.
- Scale memory to 1gb before raising concurrency if pressure appears.

### Dashboards and KPIs

- Document dashboard URLs and owners for API latency, deploy health, dispatch/shipments, Stripe webhook failures, Socket.io reconnects, and AI usage.
- Route Sentry alerts for repeated production exceptions.

### Safe stress testing

- Prefer staging for heavier tests.
- In production, limit to smoke tests, health checks, Socket.io handshake/reconnect checks, and controlled low-rate k6 runs.
- Do not run destructive or excessive production load tests.
