# Release Operations (Phase 5)

This guide documents production release, rollback, migration, and monitoring practices for Infæmous Freight.

## Release Versioning

- Use SemVer tags for release tracking.
  - Feature releases: `v2.2.0`, `v2.3.0`
  - Patch releases: `v2.2.1`
- Update package versions via the root scripts:
  - `pnpm release:patch`
  - `pnpm release:minor`
  - `pnpm release:major`
- After versioning, create and push a tag that matches the release version.

## GitHub Releases

Tag pushes (`v*.*.*`) trigger the Release workflow to generate GitHub release notes automatically.

## Rollback Strategy

### Web (Netlify)

- Every production deploy maps to a Git commit SHA.
- If a deploy is broken, roll back to the last known-good deploy in Netlify.

### API (Fly.io)

- Fly keeps a release history. Revert quickly with:
  ```bash
  fly releases -a infamous-freight-api
  fly releases revert <RELEASE_ID> -a infamous-freight-api
  ```

## Safe Database Migrations (Production Only)

### Rules

- Do **not** run migrations on preview environments.
- Run migrations only for production releases.

### Deploy-time Order

1. `prisma generate`
2. `prisma migrate deploy`
3. Start the API server

### Fly One-off Migration Command

```bash
fly ssh console -a infamous-freight-api -C "pnpm --filter api db:migrate:deploy"
```

## Health Checks + Deploy Gates

The API exposes a health endpoint for deploy verification:

- `GET /health` (public)
- `GET /api/health` (API base)

Minimum response fields:

- `status`
- `version` (git SHA)
- `uptime`

## Monitoring + Alerts

### Uptime Monitoring

Configure a pinger service (UptimeRobot, Better Uptime, StatusCake):

- Web: `https://infamousfreight.netlify.app`
- API: `https://infamous-freight-api.fly.dev/health`

### Error Tracking

Use Sentry (web + API) for production error reporting and stack traces.

## Deploy Checklist

- CI green (lint/typecheck/build)
- Env validation passed
- Migrations applied (if needed)
- `/health` returns 200 post-deploy
- Monitoring checks green for 5–10 minutes
