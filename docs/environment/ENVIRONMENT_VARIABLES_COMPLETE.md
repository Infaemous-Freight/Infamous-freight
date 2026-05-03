# Infamous Freight environment variables

_Last updated: May 2, 2026._

This guide documents production environment-variable behavior for `apps/api` and `apps/web`.

## Required behavior

### Core
- `NODE_ENV`
- `DATABASE_URL`
- `WEB_APP_URL` in production or strict validation
- `CORS_ORIGINS` or legacy `CORS_ORIGIN` in production or strict validation

### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CHECKOUT_SUCCESS_URL`
- `STRIPE_CHECKOUT_CANCEL_URL`
- `STRIPE_PORTAL_RETURN_URL`

`VITE_STRIPE_PUBLIC_KEY` and `STRIPE_PUBLISHABLE_KEY` are optional unless the frontend billing flow is enabled.

### Supabase
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` or legacy `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- one frontend Supabase key:
  - preferred: `VITE_SUPABASE_PUBLISHABLE_KEY`
  - legacy fallback: `VITE_SUPABASE_ANON_KEY`

Do not use backend-only `SUPABASE_ANON_KEY` as a substitute for a frontend `VITE_` Supabase key.

### Rate limiting
`RATE_LIMIT_ENABLED` is the canonical flag. `API_RATE_LIMIT_ENABLED` is a legacy fallback. Rate limiting defaults to enabled unless explicitly set to `false`.

## Validation command

```bash
pnpm env:check:strict
```

Strict validation should fail when:
- core required values are missing,
- neither CORS alias is set,
- neither Supabase service key alias is set,
- neither frontend Supabase `VITE_` key is set,
- configured values still look like placeholders.

## Recommended optional integrations
Configure only when enabled:
- `VITE_SOCKET_URL`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENABLED`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `DAT_API_KEY`
- `TRUCKSTOP_API_KEY`
- `LOADBOARD_API_KEY`
- `SAMSARA_API_TOKEN`
- `MOTIVE_CLIENT_ID`
- `MOTIVE_CLIENT_SECRET`
- `QBO_CLIENT_ID`
- `QBO_CLIENT_SECRET`
- `XERO_CLIENT_ID`
- `XERO_CLIENT_SECRET`
- `SENDGRID_API_KEY`
- `FROM_EMAIL`
- `RTS_API_KEY`
- `OTR_API_KEY`
- `APEX_API_KEY`

## Source templates
- `.env.example`
- `.env.production.example`
- `apps/web/.env.example`

Do not commit real production values. Store them in the target platform secret manager.
