# 27 Environment Variables - Configuration Snapshot

_Last updated: May 1, 2026._

This snapshot reflects the 27 configured variables currently tracked for Infamous Freight and highlights where placeholder values still block production readiness.

## Important status clarification

Even though all 27 variable **names** are configured, the environment is **not production-ready** while placeholder values remain (for example `placeholder_*`, sample Supabase values, and sample Sentry DSNs).

## Backend variables (22)

1. `NODE_ENV`
2. `PORT`
3. `DATABASE_URL`
4. `CORS_ORIGINS`
5. `WEB_APP_URL`
6. `STRIPE_SECRET_KEY`
7. `STRIPE_WEBHOOK_SECRET`
8. `STRIPE_CHECKOUT_SUCCESS_URL`
9. `STRIPE_CHECKOUT_CANCEL_URL`
10. `STRIPE_PORTAL_RETURN_URL`
11. `SUPABASE_URL`
12. `SUPABASE_SERVICE_KEY`
13. `REDIS_HOST`
14. `REDIS_PORT`
15. `REDIS_PASSWORD`
16. `REDIS_DB`
17. `DAT_API_KEY`
18. `TRUCKSTOP_API_KEY`
19. `LOADBOARD_API_KEY`
20. `SAMSARA_API_TOKEN`
21. `SENTRY_DSN`
22. `RATE_LIMIT_ENABLED`

## Frontend variables (5)

23. `VITE_API_URL`
24. `VITE_SUPABASE_URL`
25. `VITE_SUPABASE_PUBLISHABLE_KEY`
26. `VITE_SUPABASE_ANON_KEY`
27. `VITE_SENTRY_DSN`

## Required replacements before production

Replace placeholders with real credentials for:

- `REDIS_PASSWORD`
- `DAT_API_KEY`
- `TRUCKSTOP_API_KEY`
- `LOADBOARD_API_KEY`
- `SAMSARA_API_TOKEN`
- `SENTRY_DSN`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`

## Redis production recommendation

Avoid `REDIS_HOST=localhost` in production unless Redis runs in the same container/runtime.
Prefer managed Redis with explicit host/password and connectivity checks.

## Validation commands

```bash
pnpm run codex:env-check
pnpm run codex:env-check:strict
pnpm -C apps/api run test
```

Use strict mode as a release gate: any missing required values or placeholder-like values should block promotion.
