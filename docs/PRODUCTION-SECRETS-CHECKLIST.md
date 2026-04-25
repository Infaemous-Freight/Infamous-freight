# Production Secrets Checklist

This checklist tracks production secrets and environment values that must exist outside the repo. Do not commit real secrets.

## Canonical domain

Use one production website everywhere:

```text
https://www.infamousfreight.com
```

The bare domain must redirect to the canonical host:

```text
https://infamousfreight.com -> https://www.infamousfreight.com
```

## GitHub Actions secrets

Required:

```text
FLY_API_TOKEN=<rotated Fly deploy token>
```

Recommended repository variables or secrets where needed by builds:

```text
SITE_URL=https://www.infamousfreight.com
PUBLIC_SITE_URL=https://www.infamousfreight.com
VITE_SITE_URL=https://www.infamousfreight.com
NEXT_PUBLIC_SITE_URL=https://www.infamousfreight.com
VITE_API_URL=/api
```

## Netlify production environment

```text
NEXT_PUBLIC_SITE_URL=https://www.infamousfreight.com
VITE_SITE_URL=https://www.infamousfreight.com
PUBLIC_SITE_URL=https://www.infamousfreight.com
VITE_API_URL=/api
```

## Fly.io API runtime secrets

Set with `flyctl secrets set` for app `infamous-freight`:

```text
SITE_URL=https://www.infamousfreight.com
PUBLIC_SITE_URL=https://www.infamousfreight.com
FRONTEND_URL=https://www.infamousfreight.com
CORS_ORIGIN=https://www.infamousfreight.com
API_PUBLIC_URL=https://infamous-freight.fly.dev
DATABASE_URL=<production postgres connection string>
```

Optional, depending on enabled integrations:

```text
SENTRY_DSN=<api sentry dsn>
STRIPE_SECRET_KEY=<stripe secret key>
STRIPE_WEBHOOK_SECRET=<stripe webhook signing secret>
SUPABASE_URL=<supabase project url>
SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>
SUPABASE_JWT_SECRET=<supabase jwt secret>
REDIS_URL=<redis connection string>
```

## Stripe Dashboard URLs

```text
Business website: https://www.infamousfreight.com
Webhook endpoint: https://www.infamousfreight.com/api/stripe/webhook
Checkout success URL: https://www.infamousfreight.com/billing/success
Checkout cancel URL: https://www.infamousfreight.com/billing/cancel
Customer portal return URL: https://www.infamousfreight.com/billing
```

## Supabase/Firebase auth URLs

```text
https://www.infamousfreight.com
https://www.infamousfreight.com/*
```

Keep bare-domain entries only for redirect compatibility if required.

## Verification

Run after every production deploy:

```bash
./scripts/production-smoke-test.sh
```

Expected:

- canonical frontend returns HTTP 200
- bare domain redirects to `https://www.infamousfreight.com/`
- Fly API health returns HTTP 200
- proxied API health returns HTTP 200

## Secret rotation policy

Rotate any secret that is pasted into chat, committed, exposed in logs, or shared outside the owning platform. Treat exposed secrets as compromised even if deleted afterward.
