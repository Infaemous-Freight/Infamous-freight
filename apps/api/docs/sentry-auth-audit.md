# Sentry Authentication Audit (apps/api)

Date: 2026-04-18

## Findings

1. **DSN wiring was present and environment-gated** via `SENTRY_DSN` in `src/instrument.ts` and imported first in `src/server.ts`.
2. **Safe debug verification route existed** in non-production (`GET /debug/sentry`) and emitted `Sentry.captureException(...)`.
3. **Gap:** No first-class backend helper for **Sentry API Bearer token** usage (`SENTRY_AUTH_TOKEN`) and no endpoint for listing org projects.
4. **Gap:** No backend OAuth helper for **authorization code + PKCE** token exchange.
5. **Gap:** No backend helper for **device authorization flow** (`/oauth/device/code` + polling token endpoint).
6. **Gap:** Environment schema did not include Sentry OAuth/API credential variables.

## Changes applied

- Added `src/services/sentry-auth.service.ts` with:
  - OAuth authorization URL construction
  - PKCE generation
  - OAuth token exchange (auth code, refresh token, and device grant)
  - Device code request helper
  - Organization projects fetch with `SENTRY_AUTH_TOKEN`
- Added `src/routes/sentry-auth.ts` and mounted at `/api/sentry`.
- Extended `src/config/env.ts` with Sentry auth/OAuth env vars and validation.
- Updated API env examples with non-secret placeholders.

## Safety constraints retained

- Sentry remains disabled when `SENTRY_DSN` is not configured.
- No hard-coded DSN/auth token/client credentials were introduced.
- `/debug/sentry` behavior remains non-production and DSN-gated.
