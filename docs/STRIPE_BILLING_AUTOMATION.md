# Stripe Billing Automation

Date: April 27, 2026
Status: Checkout, webhook sync, customer portal, and AI usage ledger foundation added

## Purpose

This runbook documents Stripe billing automation for Infamous Freight after catalog cleanup.

The implementation adds:

- Backend-created Stripe Checkout Sessions
- Stripe webhook verification
- Subscription/customer sync to `Carrier`
- Owner/admin customer portal endpoint
- AI usage ledger API and database table
- Billing UI in Settings
- Billing and usage tests

## API endpoints

### Stripe webhook

```http
POST /api/billing/webhook
```

This endpoint expects Stripe's raw request body and validates the `stripe-signature` header with `STRIPE_WEBHOOK_SECRET`.

### Checkout Session

```http
POST /api/billing/checkout-session
```

Required headers:

```text
x-tenant-id: <carrier id>
x-user-role: owner | admin
```

Request:

```json
{
  "plan": "professional",
  "billingInterval": "month"
}
```

Supported plans:

```text
starter
professional
enterprise
```

Supported billing intervals:

```text
month
year
```

### Customer portal

```http
POST /api/billing/customer-portal
```

Required headers:

```text
x-tenant-id: <carrier id>
x-user-role: owner | admin
```

Response:

```json
{
  "data": {
    "url": "https://billing.stripe.com/..."
  }
}
```

### Billing status

```http
GET /api/billing/status
```

Returns whether the carrier has a linked Stripe customer.

### AI usage event

```http
POST /api/ai-usage/events
```

Required headers:

```text
x-tenant-id: <carrier id>
x-user-role: owner | admin | dispatcher
```

Request:

```json
{
  "feature": "dispatch-assistant",
  "actionCount": 1,
  "documentScans": 0,
  "voiceMinutes": 0,
  "inputTokens": 100,
  "outputTokens": 40,
  "estimatedCost": 0.25,
  "idempotencyKey": "unique-event-id"
}
```

### AI usage summary

```http
GET /api/ai-usage/summary
```

Returns aggregate usage totals for the current carrier.

## Required environment variables

API:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PORTAL_RETURN_URL=https://app.infamousfreight.com/settings
STRIPE_CHECKOUT_SUCCESS_URL=https://app.infamousfreight.com/settings?checkout=success
STRIPE_CHECKOUT_CANCEL_URL=https://app.infamousfreight.com/settings?checkout=canceled
```

Optional fallback:

```env
WEB_APP_URL=https://app.infamousfreight.com
```

Web:

```env
VITE_API_URL=https://<api-domain>
```

## Required Stripe webhook events

Configure a live webhook endpoint in Stripe Dashboard:

```text
https://<api-domain>/api/billing/webhook
```

Subscribe to:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
```

## Billing sync behavior

The webhook syncs these `Carrier` fields:

```text
stripeCustomerId
subscriptionTier
status
```

Supported subscription tiers:

```text
starter
professional
enterprise
```

Supported billing statuses:

```text
active
trial
past_due
canceled
unpaid
incomplete
inactive
```

## Checkout metadata

Backend-created Checkout Sessions include metadata:

```ts
metadata: {
  carrierId,
  plan,
  billingInterval,
}
```

Subscription metadata also receives the same values so future subscription events can preserve plan mapping.

## Customer portal setup

In Stripe Dashboard:

```text
Settings → Billing → Customer portal
```

Configure:

- Allowed subscription changes
- Payment method updates
- Invoice history
- Cancellation behavior
- Return URL

## AI usage ledger

The `AiUsageEvent` table is a ledger, not a metered billing implementation. Use it to build confidence in usage tracking before enabling Stripe metered billing.

Recommended launch limits:

```text
Starter: 500 AI actions / month
Professional: 5,000 AI actions / month
Enterprise: 25,000 AI actions / month
```

Keep AI add-ons as one-time packs until the ledger has proven accuracy in production.

## Launch validation

After deployment:

1. Add API env vars.
2. Configure Stripe live webhook endpoint.
3. Trigger a test event from Stripe Dashboard.
4. Confirm `/api/billing/webhook` returns `200`.
5. Start checkout from Settings → Billing & Plans using an internal carrier.
6. Complete checkout.
7. Confirm the carrier row has:
   - `stripeCustomerId`
   - correct `subscriptionTier`
   - correct `status`
8. Open customer portal from Settings as owner/admin.
9. Record one AI usage event and confirm it appears in Settings → Billing & Plans.

## Notes

This foundation intentionally avoids Stripe metered billing until the backend has reliable AI usage tracking. Continue using one-time AI add-on packs for launch.
