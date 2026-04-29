# Sentry setup for `apps/web` (Vite + React)

Infamous Freight `apps/web` is a **Vite + React** app, not Vue.
Use React/Vite Sentry configuration only.

## Current implementation

- Frontend SDK initialization is in `apps/web/src/main.tsx`.
- Source-map upload is configured in `apps/web/vite.config.ts` via `@sentry/vite-plugin`.
- Runtime env defaults are documented in `apps/web/.env.example`.

## Required env vars

Runtime (client):

- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENABLED` (`true` / `false`)

Build/CI (source maps):

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

Optional deploy monitor for Fly deploy workflow:

- `SENTRY_FLY_DEPLOY_MONITOR_URL` (repository secret)

## Verify

1. Run the web app and trigger a handled error through the existing Sentry error boundary path.
2. Confirm events appear in Sentry Issues.
3. For production builds, verify source maps upload in CI logs when Sentry build env vars are configured.
