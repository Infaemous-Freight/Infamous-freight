# Owner Remediation Tracker

This tracker records production actions that require owner dashboard access or private secrets and cannot be safely completed from source control alone.

## Stripe

Connected account: `INFAMOUS FREIGHT`

Required actions:

- Confirm the active API secret key is set privately in Fly.io runtime secrets.
- Confirm the active API secret key is set privately in the Codex or operator shell only when running billing verification.
- Confirm the webhook signing secret is set privately in Fly.io runtime secrets.
- Confirm the webhook signing secret is set privately in Netlify only if Netlify Functions are re-enabled for billing webhooks.
- Run the live billing verification script after secrets are set.

Validation commands:

```bash
bash scripts/codex-env-check.sh
node scripts/verify-stripe-live-billing.mjs
```

Do not paste Stripe secret values into GitHub issues, pull requests, docs, logs, screenshots, or chat.

## Supabase

Connected project:

- Name: Infæmous
- Project ref: wnaievjffghrztjuvutp
- Region: us-east-2

Required actions:

- Enable leaked password protection in Supabase Auth password security settings.
- Review performance advisor warnings for RLS initialization plans.
- Optimize RLS policies by wrapping repeated auth calls with `select` forms where applicable.
- Review any service-role or JWT values that were exposed outside private dashboards and rotate if exposure occurred.

Validation commands:

```bash
# Supabase dashboard/advisor validation is required for password protection.
# Re-run advisors after changes.
```

## Fly.io

Required actions:

- Confirm production runtime secrets are set for API service.
- Confirm database URL is a true Postgres connection string, not a Supabase REST URL.
- Confirm Stripe secret and webhook secret are present in Fly runtime only as secrets.
- Confirm Supabase service role and JWT secret are present only as secrets.
- Run Fly health diagnostics after secret changes.

Validation commands:

```bash
pnpm run fly:health
pnpm run production:smoke-test
```

## Netlify

Verified connector state:

- Project exists: infamousfreight
- Production deploy is ready
- Forms are enabled
- Redirect/header rules deployed successfully
- Latest deploy secret scan reported no matches

Required actions:

- Rotate any sensitive values if they appeared in non-secret environment fields or external logs.
- Confirm public browser variables are limited to publishable/anon values only.
- Keep API secrets out of browser build scope.

## Completion Gate

Production hardening can be marked owner-complete only when:

- Stripe live billing verification passes.
- Supabase security advisor no longer reports leaked password protection disabled.
- Fly runtime health succeeds after secret rotation.
- Production smoke test passes.
- Launch evidence log is updated with timestamped proof.
