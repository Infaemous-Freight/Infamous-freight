# Stripe Billing Automation

Date: April 27, 2026
Status: App-side Stripe webhook and customer portal foundation added

## Purpose

This runbook documents the Stripe billing automation required after the Stripe catalog cleanup.

The implementation adds:

- Stripe webhook verification
- Subscription/customer sync to `Carrier`
- Owner/admin customer portal endpoint
- Billing event tests

## API endpoints

### Stripe webhook

```http
POST /api/billing/webhook
```

This endpoint expects Stripe's raw request body and validates the `stripe-signature` header with `STRIPE_WEBHOOK_SECRET`.

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

## Required environment variables

API:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PORTAL_RETURN_URL=https://app.infamousfreight.com/settings
```

Optional fallback:

```env
WEB_APP_URL=https://app.infamousfreight.com
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

## Metadata requirement for backend-created Checkout Sessions

When the app moves away from static Payment Links to backend-created Checkout Sessions, include metadata:

```ts
metadata: {
  carrierId,
  plan,
  billingInterval,
}
```

Without `carrierId` metadata, webhook sync can still update by known `stripeCustomerId` for invoice/subscription events, but first-time checkout mapping is weaker.

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

## Launch validation

After deployment:

1. Add API env vars.
2. Configure Stripe live webhook endpoint.
3. Trigger a test event from Stripe Dashboard.
4. Confirm `/api/billing/webhook` returns `200`.
5. Complete a test checkout using an internal carrier.
6. Confirm the carrier row has:
   - `stripeCustomerId`
   - correct `subscriptionTier`
   - correct `status`
7. Open customer portal from the app as owner/admin.

## Notes

This foundation intentionally avoids usage-based metering until the backend has reliable AI usage tracking. Continue using one-time AI add-on packs for launch.
