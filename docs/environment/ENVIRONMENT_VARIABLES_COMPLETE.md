# Infamous Freight environment variables

_Last updated: May 2, 2026._

This document is the production environment-variable guide for the API and web app. Exact variable names are maintained in the source templates and validation script:

- `.env.example`
- `.env.production.example`
- `apps/web/.env.example`
- `scripts/codex-env-check.sh`

## Validation rules

The strict environment check must match runtime behavior.

### Frontend Supabase rule

The web app requires one frontend Supabase credential. The preferred frontend publishable value and the legacy frontend anon value are alternatives. Do not require both. A backend-only anon value is not enough for the web runtime.

### Server Supabase rule

The API requires one server-side Supabase credential. The canonical server value should be preferred. The legacy service-role value remains supported as a migration fallback.

### CORS rule

Production and strict validation require one CORS origin configuration. The canonical plural form should be preferred. The legacy singular form remains supported as a fallback.

### Stripe frontend rule

The frontend Stripe public value is optional unless the frontend billing flow is enabled. Do not make it a strict production requirement for deployments that do not enable frontend billing.

### Rate-limit rule

Rate limiting defaults to enabled unless explicitly disabled. The runtime toggle should be set in production for clarity, but missing the toggle does not mean the API starts with rate limiting disabled.

## Deployment checklist

Before production deploy:

```bash
pnpm lint
pnpm -w test --runInBand
pnpm env:check:strict
```

After production deploy:

- Verify the API health endpoint returns HTTP 200.
- Verify the frontend starts without a missing Supabase frontend credential error.
- Verify browser requests are allowed by the configured CORS origins.

## Recommended integrations

Configure optional integration variables only when those integrations are enabled:

- frontend billing
- socket routing
- Sentry release automation
- alternate ELD providers
- accounting providers
- email delivery
- factoring providers

## Operational rule

Do not commit real production values. Store production values in the target platform secret manager.
