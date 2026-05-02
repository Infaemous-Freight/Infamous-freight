# Netlify Production Deploy Checklist

Use this checklist for every production deploy of `infamousfreight`.

## 1) Confirm environment variables

Backend secrets (database URL, Supabase service key, Stripe keys, etc.) belong on the API host (Fly.io) — **not** in the Netlify site config — because `netlify.toml` proxies `/api/*` to `https://infamous-freight.fly.dev`. Keep the Netlify environment limited to what the Vite build/runtime needs.

### Netlify (web) environment variables

In Netlify Dashboard → **Site configuration** → **Environment variables**, confirm these are present:

#### Required for web build/runtime
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL`

#### Required only for CLI-triggered deploys
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

#### Recommended compatibility fallback
- `VITE_SUPABASE_ANON_KEY`

> Do **not** add backend secrets such as `SUPABASE_SERVICE_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` to the Netlify environment. They are not used by the static web build and exposing them in a frontend host's UI broadens their blast radius.

### Fly.io API environment variables

In Fly.io (`fly secrets list -a infamous-freight`), confirm these are present on the API runtime:

| Name | Example value |
| --- | --- |
| `DATABASE_URL` | _(Postgres connection string)_ |
| `SUPABASE_URL` | _(Supabase project URL)_ |
| `SUPABASE_SERVICE_KEY` | _(Supabase service role key)_ |
| `STRIPE_SECRET_KEY` | _(Stripe secret key)_ |
| `STRIPE_WEBHOOK_SECRET` | _(Stripe webhook signing secret)_ |
| `CORS_ORIGINS` | `https://www.infamousfreight.com` |
| `WEB_APP_URL` | `https://www.infamousfreight.com` |
| `RATE_LIMIT_ENABLED` | `true` |

## 2) Validate locally (or in CI)

Run the one-command automation (recommended):

```bash
pnpm netlify:production:readiness
```

Or run the commands manually:

```bash
pnpm install --frozen-lockfile
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

If a lockfile-bypass workaround was previously set on Netlify, remove it. Netlify's build command in this repo is `npm run build` (see `netlify.toml`), so the variable Netlify actually reads is:

- `NPM_FLAGS` (e.g. a temporary `--legacy-peer-deps` or `--no-package-lock` value) — clear any ad-hoc lockfile-bypass value once the lockfile is healthy.

## 4) Trigger production deploy

Netlify UI path:

1. `Netlify`
2. `infamousfreight`
3. `Deploys`
4. `Trigger deploy`
5. `Deploy site`

## 5) Post-deploy production verification

Run both canonical checks first. Use the canonical `https://www.infamousfreight.com` host (apex redirects to it per `netlify.toml`) and curl flags that fail on non-2xx responses, follow redirects, and retry transient errors — matching `.github/workflows/smoke-test.yml`:

```bash
curl --fail --show-error --location --head \
  --retry 5 --retry-delay 10 --retry-connrefused \
  https://www.infamousfreight.com

curl --fail --show-error --silent \
  --retry 5 --retry-delay 10 --retry-connrefused \
  https://www.infamousfreight.com/api/health
```

Optional direct API domain checks (if `api.infamousfreight.com` is configured to the API origin):

```bash
curl --fail --show-error --silent \
  --retry 5 --retry-delay 10 --retry-connrefused \
  https://api.infamousfreight.com/health

curl --fail --show-error --silent \
  --retry 5 --retry-delay 10 --retry-connrefused \
  https://api.infamousfreight.com/api/health
```

If direct API-domain checks return `404`, validate DNS/routing for `api.infamousfreight.com` and keep production smoke checks pointed at `https://www.infamousfreight.com/api/health` until fixed.

Also verify in browser:
- Homepage loads.
- No Supabase key error in console.
- API requests are not blocked by CORS.
- Forms still work.
- Billing/auth flows load (if enabled).
