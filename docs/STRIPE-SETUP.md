# Infamous Freight — Stripe Products Setup

This guide configures your Stripe products and prices for the Infamous Freight platform.

---

## Your Stripe Credentials

| Key | Value |
|-----|-------|
| Publishable Key | `REDACTED_PUBLISHABLE_KEY` |
| Secret Key | `REDACTED_SECRET_KEY` |
| Webhook Secret | `REDACTED_WEBHOOK_SECRET` |

Dashboard: https://dashboard.stripe.com

---

## Step 1: Create Products

In your Stripe Dashboard, create these products:

### Product 1: Starter Plan
```
Name: Infamous Freight — Starter
Description: Perfect for owner-operators and small fleets
```

**Monthly Price:**
```
Price: $49.00 / month
Billing: Recurring
Trial period: 14 days
```

**Annual Price:**
```
Price: $470.40 / year (20% off = $39.20/month equivalent)
Billing: Recurring
Trial period: 14 days
```

### Product 2: Growth Plan (Most Popular)
```
Name: Infamous Freight — Growth
Description: For growing fleets with dispatch teams
```

**Monthly Price:**
```
Price: $99.00 / month
Billing: Recurring
Trial period: 14 days
```

**Annual Price:**
```
Price: $950.40 / year (20% off = $79.20/month equivalent)
Billing: Recurring
Trial period: 14 days
```

### Product 3: Enterprise
```
Name: Infamous Freight — Enterprise
Description: For large fleets with custom needs
```

This is a **contact sales** tier — no fixed price. Set as:
```
Price: Custom (don't create a fixed price)
```

### Product 4: Pay Per Load
```
Name: Infamous Freight — Pay Per Load
Description: Flexibility for occasional haulers
```

**Price:**
```
Price: $2.99 / load
Billing: One-time (metered usage)
```

---

## Step 2: Create the Founding 50 Coupon

Create a limited coupon for your first 50 customers:

```
Coupon Code: FOUNDING50
Type: Percentage off
Amount: 40% off
Duration: Forever (locks in price)
Redemption limit: 50 redemptions
```

This gives early customers:
- Starter: $29.40/mo forever (vs $49)
- Growth: $59.40/mo forever (vs $99)

---

## Step 3: Webhook Endpoint

In Stripe Dashboard → Developers → Webhooks:

1. Click **Add endpoint**
2. Endpoint URL: `https://api.infamousfreight.com/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

4. Copy the **Signing secret** — this is your `STRIPE_WEBHOOK_SECRET`

---

## Step 4: Customer Portal Settings

In Stripe Dashboard → Settings → Customer Portal:

Enable:
- [x] Allow customers to update payment methods
- [x] Allow customers to update subscriptions
- [x] Allow customers to cancel subscriptions
- [x] Show billing history

Cancel behavior: **Allow cancel + offer retention** (show offer before canceling)

---

## Step 5: Test the Flow

### Test Card Numbers (Stripe Test Mode)

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 0341` | Requires 3D Secure |

Use any future expiry date and any 3-digit CVC.

### Test the Checkout

```bash
curl -X POST https://api.infamousfreight.com/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_xxx",
    "customerEmail": "test@example.com",
    "successUrl": "https://infamousfreight.com/success",
    "cancelUrl": "https://infamousfreight.com/cancel"
  }'
```

---

## Price IDs Reference

After creating products, update these IDs in your code:

### `apps/api/src/stripe/stripe.service.ts`
```typescript
const PRICE_IDS = {
  starter_monthly: 'price_xxx',      // Replace with your price ID
  starter_annual: 'price_xxx',       // Replace with your price ID
  growth_monthly: 'price_xxx',       // Replace with your price ID
  growth_annual: 'price_xxx',        // Replace with your price ID
  pay_per_load: 'price_xxx',         // Replace with your price ID
};
```

### `apps/web/.env.production`
```
VITE_STRIPE_PUBLIC_KEY=REDACTED_PUBLISHABLE_KEY
```

---

## Revenue Projections

| Plan | Monthly Price | Annual Price | Target Customers |
|------|-------------|-------------|-----------------|
| Starter | $49/mo | $470/yr | 200 |
| Growth | $99/mo | $950/yr | 100 |
| Enterprise | Custom | Custom | 20 |
| Pay Per Load | $2.99/load | — | 500+ |

**Projected MRR at 100 customers:** ~$7,500/month
**Projected ARR at 500 customers:** ~$450,000/year

---

## Quick Checklist

- [ ] Products created in Stripe Dashboard
- [ ] Monthly + annual prices set for each plan
- [ ] Founding 50 coupon created (40% off, 50 redemptions)
- [ ] Webhook endpoint configured (`/stripe/webhook`)
- [ ] Customer portal enabled
- [ ] Price IDs copied to code
- [ ] Test checkout flow works
- [ ] Production environment variables set
