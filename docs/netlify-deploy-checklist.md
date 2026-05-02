# Netlify Production Deploy Checklist

Use this checklist for every production deploy of `infamousfreight`.

## 1) Confirm Netlify environment variables

In Netlify Dashboard → **Site configuration** → **Environment variables**, confirm these are present:

### Required for web build/runtime
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL`

### Required only for CLI-triggered deploys
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

### Recommended compatibility fallback
- `VITE_SUPABASE_ANON_KEY`

### Required for backend/API integrations
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CORS_ORIGINS`
- `WEB_APP_URL`
- `RATE_LIMIT_ENABLED=true`

## 2) Validate locally (or in CI)

Run the one-command automation (recommended):

```bash
pnpm netlify:production:readiness
```

Or run the commands manually:

```bash
pnpm install --no-frozen-lockfile
pnpm prisma:generate
pnpm lint
pnpm -w test --runInBand
pnpm env:check:strict
pnpm -C apps/web run build
pnpm docker:build
```

## 3) Keep lockfile stable

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "Update pnpm lockfile"
git push
```

If set previously, remove temporary Netlify workaround:

- `PNPM_FLAGS=--no-frozen-lockfile`

## 4) Trigger production deploy

Netlify UI path:

1. `Netlify`
2. `infamousfreight`
3. `Deploys`
4. `Trigger deploy`
5. `Deploy site`

## 5) Post-deploy production verification

Run both canonical checks first:

```bash
curl -I https://infamousfreight.com
curl -fsS https://www.infamousfreight.com/api/health
```

Optional direct API domain checks (if `api.infamousfreight.com` is configured to the API origin):

```bash
curl -fsS https://api.infamousfreight.com/health
curl -fsS https://api.infamousfreight.com/api/health
```

If direct API-domain checks return `404`, validate DNS/routing for `api.infamousfreight.com` and keep production smoke checks pointed at `https://www.infamousfreight.com/api/health` until fixed.

Also verify in browser:
- Homepage loads.
- No Supabase key error in console.
- API requests are not blocked by CORS.
- Forms still work.
- Billing/auth flows load (if enabled).
