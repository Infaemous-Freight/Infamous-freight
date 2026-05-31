# Stripe Live Billing Verification Framework

Use this framework to verify Infamous Freight billing end to end before paid beta, public launch, or any production Stripe catalog/webhook change.

## Safety rules

- Run live-payment steps only from an approved operator terminal.
- Do not paste `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Supabase JWTs, Checkout URLs, customer emails, card details, or receipt links into issues, PRs, logs, or chat.
- Keep the live payment amount low and refund or void the payment after evidence is recorded when business policy requires it.
- Treat Stripe as the money-movement source of truth; the app database must reconcile to Stripe, not the reverse.

## Automated non-secret verification

The repo includes a live billing verification script that checks production API liveness and, when operator credentials are present, verifies Stripe account mode, Price IDs, webhook endpoint configuration, Checkout Session creation, and completed Checkout Session payment state.

```bash
pnpm run billing:verify-live
```

Default targets:

```text
BILLING_VERIFY_API_BASE_URL=https://infamous-freight-api.fly.dev
BILLING_VERIFY_FLY_APP=infamous-freight-api
BILLING_VERIFY_WEBHOOK_URL=https://infamous-freight-api.fly.dev/api/billing/webhook
BILLING_VERIFY_PLAN=starter
BILLING_VERIFY_INTERVAL=month
BILLING_VERIFY_CREATE_CHECKOUT=false
BILLING_VERIFY_REQUIRE_CREDENTIALS=false
BILLING_VERIFY_REQUIRE_PAYMENT=false
```

The script never prints secret values. It redacts Checkout URLs and returned Stripe account, webhook, and Checkout Session identifiers by default. Checkout Session creation is disabled unless `BILLING_VERIFY_CREATE_CHECKOUT=true` is explicitly set after live-payment approval. Set `BILLING_VERIFY_REQUIRE_CREDENTIALS=true` when skipped Stripe account/catalog/webhook credential checks should fail the command instead of warn. Set `BILLING_VERIFY_REQUIRE_PAYMENT=true` only after a controlled live Checkout Session is expected and missing payment verification should fail.

## Operator credential checks

Run these in an authenticated operator terminal only:

```bash
flyctl auth whoami
flyctl secrets list -a infamous-freight-api
flyctl config validate --config fly.toml
flyctl checks list -a infamous-freight-api
curl -i https://infamous-freight-api.fly.dev/api/health/live
```

Confirm these required Stripe/Fly values are present by name only:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CHECKOUT_SUCCESS_URL
STRIPE_CHECKOUT_CANCEL_URL
STRIPE_PORTAL_RETURN_URL
WEB_APP_URL
```

Do not print secret values.

## Stripe account, catalog, and webhook verification

Run with the live Stripe secret key exported only in the operator shell:

```bash
export STRIPE_SECRET_KEY=<live secret key from secret manager>
export STRIPE_ACCOUNT_ID=<expected Stripe account id>
pnpm run billing:verify-live
```

Expected results:

- Stripe account check passes with `livemode=true`.
- All server-side subscription and one-time add-on Price IDs exist, are active, and are live-mode prices.
- The live webhook endpoint is enabled for these app-handled billing events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `charge.refunded`
  - `charge.dispute.created`

## Controlled live Checkout Session creation

Use an owner/admin Supabase JWT for an internal test organization that is approved for billing validation. The JWT must identify an existing organization membership with role `owner` or `admin`.

```bash
export STRIPE_SECRET_KEY=<live secret key from secret manager>
export STRIPE_ACCOUNT_ID=<expected Stripe account id>
export BILLING_VERIFY_BEARER_TOKEN=<owner-or-admin-supabase-jwt>
export BILLING_VERIFY_PLAN=starter
export BILLING_VERIFY_INTERVAL=month
export BILLING_VERIFY_CREATE_CHECKOUT=true
pnpm run billing:verify-live
```

By default, the script prints only a redacted Checkout Session ID. To open Checkout in the same approved terminal, explicitly allow URL output:

```bash
BILLING_VERIFY_CREATE_CHECKOUT=true BILLING_VERIFY_PRINT_CHECKOUT_URL=true pnpm run billing:verify-live
```

Complete the live payment only after business approval. Record the Checkout Session ID, Stripe event ID, and non-secret app status evidence.

## Completed payment verification

After the approved live checkout completes, verify the Checkout Session payment state from Stripe:

```bash
export STRIPE_SECRET_KEY=<live secret key from secret manager>
export BILLING_VERIFY_CHECKOUT_SESSION_ID=<cs_live_session_id>
export BILLING_VERIFY_REQUIRE_PAYMENT=true
pnpm run billing:verify-live
```

Expected result: `payment_status=paid` and `livemode=true`.

Then verify app-side billing state with an owner/admin JWT:

```bash
curl -sS https://infamous-freight-api.fly.dev/api/billing/status \
  -H "Authorization: Bearer ${BILLING_VERIFY_BEARER_TOKEN}"
```

Expected result: the response includes `hasStripeCustomer: true`. Do not paste customer IDs into public channels.

## Webhook evidence to capture

In Stripe Dashboard, confirm the webhook event created by the live payment delivered successfully to:

```text
https://infamous-freight-api.fly.dev/api/billing/webhook
```

Record only non-secret evidence:

- event type
- event ID
- delivery status
- HTTP response code
- app request ID if available
- redacted carrier/test organization reference
- pass/fail status

## Risk check

- If `/api/health/live` fails, stop billing verification and diagnose Fly process health first.
- If the script reports a test-mode Stripe key, stop and switch to the approved live key.
- If webhook events are missing or disabled, do not complete a live payment until the Stripe Dashboard webhook is corrected.
- If Checkout creates a session but webhooks do not update the app, do not grant manual access until app state is reconciled and root cause is documented.

## Fallback and rollback

- Refund or void the controlled live payment in Stripe when required by policy.
- Disable or rotate any exposed Stripe credentials immediately.
- If a production billing deploy caused the issue, roll back to the previous known-good Fly image and rerun API liveness plus webhook delivery checks.
- If Stripe and app state disagree, treat Stripe as source of truth, reconcile app state through approved admin tooling, and record the correction in the launch evidence log.

## Evidence template

Add a non-secret entry to `docs/LAUNCH_EVIDENCE_LOG.md`:

```markdown
## Test
Stripe live billing end-to-end verification

## Date/Time
YYYY-MM-DD HH:MM UTC

## Owner
<operator>

## Command or Action
Ran `pnpm run billing:verify-live`; completed approved low-dollar live Checkout; verified Stripe webhook delivery and app billing status.

## Expected Result
Live API is healthy, Stripe account/catalog/webhook checks pass, Checkout Session completes, webhook delivery succeeds, and app billing state reflects the live Stripe customer.

## Actual Result
<non-secret result summary>

## Status
PASS / FAIL

## Severity
None / Low / Medium / High / Critical

## Follow-Up
<issue link, rollback, refund status, or N/A>

## Notes
Do not include secret values, full Checkout URLs, customer PII, or card details.
```
