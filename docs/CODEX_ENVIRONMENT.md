# Codex Environment Setup

This document explains how to configure OpenAI Codex for the Infamous Freight repository without exposing sensitive values.

## Required Codex environment variables

Add these in the Codex **Environment variables** section when Codex needs to build, test, or run the full app:

```env
NODE_ENV=development
DATABASE_URL=[POSTGRES_CONNECTION_STRING]
STRIPE_SECRET_KEY=[STRIPE_SECRET_KEY]
STRIPE_WEBHOOK_SECRET=[STRIPE_WEBHOOK_SECRET]
STRIPE_PUBLISHABLE_KEY=[STRIPE_PUBLISHABLE_KEY]
VITE_STRIPE_PUBLIC_KEY=[STRIPE_PUBLISHABLE_KEY]
SUPABASE_URL=[SUPABASE_PROJECT_URL]
SUPABASE_SERVICE_KEY=[SUPABASE_SERVICE_KEY]
SUPABASE_ANON_KEY=[SUPABASE_ANON_KEY]
VITE_SUPABASE_URL=[SUPABASE_PROJECT_URL]
VITE_SUPABASE_PUBLISHABLE_KEY=[SUPABASE_PUBLISHABLE_KEY]
```

## Optional integration variables

Use these only when testing the related integrations:

```env
PORT=3001
CORS_ORIGINS=[ALLOWED_ORIGINS]
WEB_APP_URL=[WEB_APP_URL]
STRIPE_CHECKOUT_SUCCESS_URL=[CHECKOUT_SUCCESS_URL]
STRIPE_CHECKOUT_CANCEL_URL=[CHECKOUT_CANCEL_URL]
STRIPE_PORTAL_RETURN_URL=[CUSTOMER_PORTAL_RETURN_URL]
REDIS_HOST=[REDIS_HOST]
REDIS_PORT=6379
REDIS_PASSWORD=[REDIS_PASSWORD]
REDIS_DB=0
JWT_SECRET=[JWT_SECRET]
API_RATE_LIMIT_ENABLED=true
SENTRY_DSN=[SENTRY_DSN]
VITE_API_URL=[API_URL]
VITE_SOCKET_URL=[SOCKET_URL]
VITE_SENTRY_DSN=[PUBLIC_SENTRY_DSN]
VITE_SENTRY_ENABLED=true
SENTRY_ORG=[SENTRY_ORG]
SENTRY_PROJECT=[SENTRY_PROJECT]
SENTRY_AUTH_TOKEN=[SENTRY_AUTH_TOKEN]
DAT_API_KEY=[DAT_API_KEY]
TRUCKSTOP_API_KEY=[TRUCKSTOP_API_KEY]
LOADBOARD_API_KEY=[LOADBOARD_API_KEY]
SAMSARA_API_TOKEN=[SAMSARA_API_TOKEN]
MOTIVE_CLIENT_ID=[MOTIVE_CLIENT_ID]
MOTIVE_CLIENT_SECRET=[MOTIVE_CLIENT_SECRET]
QBO_CLIENT_ID=[QBO_CLIENT_ID]
QBO_CLIENT_SECRET=[QBO_CLIENT_SECRET]
XERO_CLIENT_ID=[XERO_CLIENT_ID]
XERO_CLIENT_SECRET=[XERO_CLIENT_SECRET]
SENDGRID_API_KEY=[SENDGRID_API_KEY]
FROM_EMAIL=[FROM_EMAIL]
RTS_API_KEY=[RTS_API_KEY]
OTR_API_KEY=[OTR_API_KEY]
APEX_API_KEY=[APEX_API_KEY]
```

## Secrets vs environment variables

Use **Environment variables** for values the app and tests need during the Codex task.

Use **Secrets** for one-time setup credentials only, such as package registry tokens or temporary install credentials.

Secrets may not be available to the Codex agent after setup, so do not put app runtime values there if tests or scripts need them.

## Safe verification command

Run this after saving the Codex environment:

```bash
npm run codex:env-check
```

For automation or preflight checks that should fail when required variables are missing, run:

```bash
npm run codex:env-check:strict
```

Or run the script directly:

```bash
bash scripts/codex-env-check.sh
bash scripts/codex-env-check.sh --strict
```

The script confirms whether variables are set and lists variable names only. It does not print secret values.

## Avoid unsafe commands

Do not run this in shared logs unless you are certain no secrets are present:

```bash
printenv | sort
```

That prints full environment variable values, including private keys.

## Recommended Codex flow

```bash
npm run env:setup
npm run codex:env-check
npm run prisma:generate
npm run build
npm run test
```

Use strict mode before declaring the environment ready:

```bash
npm run codex:env-check:strict
```

If `npm run codex:env-check` reports a missing value, add it to the Codex environment and save the environment before running Codex again.
