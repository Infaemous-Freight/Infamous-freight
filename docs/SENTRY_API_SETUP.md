# API Sentry Setup

## Status

The API initializes Sentry from the runtime environment variable `SENTRY_DSN`.

Do **not** hardcode the DSN in source code. Configure it as a runtime secret in Fly.io or the production hosting provider.

## Production secret setup

Run this from a machine authenticated with Fly.io:

```bash
flyctl secrets set --app infamous-freight-api \
  SENTRY_DSN='<your-sentry-dsn>'
```

Then deploy or restart so the runtime sees the new secret:

```bash
pnpm run fly:deploy
# or
flyctl deploy --remote-only --config fly.toml --app infamous-freight-api
```

## Current API behavior

`apps/api/src/server.ts` imports `apps/api/src/instrument.ts` before the rest of the API bootstrap so Sentry can register Node auto-instrumentation before other application imports load. The Express Sentry error handler is registered after all API routes and before the API's JSON error response middleware.

Current behavior:

- Reads DSN from `process.env.SENTRY_DSN`.
- Does nothing if `SENTRY_DSN` is absent.
- Uses `environment: process.env.NODE_ENV ?? 'development'`.
- Uses `sendDefaultPii: false`.
- Uses `tracesSampleRate: 0`.
- Captures unexpected API errors in the final Express error handler.

## PII policy

The Sentry Node option `sendDefaultPii: true` can send default personally identifiable data such as IP addresses. Keep the API default at:

```ts
sendDefaultPii: false
```

Only enable PII after confirming:

- privacy policy coverage,
- customer notice/consent requirements,
- retention rules,
- access controls in Sentry,
- business need for collecting IP/user data.

## Verification

After setting `SENTRY_DSN`, run:

```bash
pnpm run test:api
```

Then trigger a controlled non-production test error and confirm it appears in the Sentry project.

Do not use real customer data for Sentry verification.
