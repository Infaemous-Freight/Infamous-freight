# FINAL 100% RECOMMENDATIONS — INFÆMOUS FREIGHT

This is the definitive state your platform should operate in.

---

## 1) Stripe Product Architecture (Lock This In)

### Core SaaS (Access Layer)

| Product | Purpose |
| --- | --- |
| Starter Platform Access | Entry tier, limited automation |
| Professional Platform Access | SMB tier |
| Enterprise Platform Access | High-security + SLA |

### Seat-Based SaaS (Primary Revenue)

| Product | Price | Purpose |
| --- | --- | --- |
| Pro (per seat) | $49/user/mo | Core multi-user SaaS |
| Business (per seat) | $99/user/mo | AI + automation tier |

These are your true SaaS anchors.

### Enterprise Revenue Enforcement

| Product | Purpose |
| --- | --- |
| Enterprise Minimum Monthly Spend ($2,500/mo) | Forces enterprise ARR floor |
| White Label (optional) | Premium branding |
| Satellite / Weather Intelligence | Operational intelligence |
| Real-Time Tracking (per truck) | Asset-based billing |

---

## 2) AI Monetization Layer (Your Competitive Advantage)

### A) Stripe-Native Metered AI (Scalable)

**Infamous AI Actions (metered)**

Purpose: charge per AI command, route, voice action, simulation.

This must have:

- One single active price
- Usage type: Metered
- Aggregate: Sum
- Interval: Monthly
- Lookup key: `iff_ai_action_metered`

#### Create the Metered Price (Dashboard or API)

**Option A — Stripe Dashboard (fastest):**

1. Stripe Dashboard → Products
2. Open **Infamous AI Actions (metered)**
3. Add price
4. Type: **Recurring**
5. Interval: **Monthly**
6. Usage: **Metered (usage-based)**
7. Aggregation: **Sum**
8. Save → copy the new `price_...` ID

**Option B — Node API (one-time admin script):**

```js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
});

async function createMeteredPrice() {
  const productId = "prod_TqlbsmBT9Jw2Z0"; // Infamous AI Actions (metered)

  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: 1, // $0.01 per action
    recurring: {
      interval: "month",
      usage_type: "metered",
      aggregate_usage: "sum",
    },
    nickname: "AI Actions - Metered (per action)",
    lookup_key: "iff_ai_action_metered",
    metadata: {
      billing_unit: "ai_action",
    },
  });

  console.log("Created metered price:", price.id);
  return price.id;
}

createMeteredPrice().catch(console.error);
```

### B) Event-Based AI SKUs (Enterprise Invoicing)

You already built these correctly:

- Dispatch Decision ($15)
- Route Optimization ($7.50)
- Coaching ($20)
- Performance Reports ($3)
- Invoice Auditing, Dispute Detection, etc.

These are:

- Enterprise line items
- Contract pricing
- Custom billing
- Premium AI services

This dual-layer AI monetization is rare and extremely powerful.

---

## 3) Stripe Configuration Hardening (Mandatory)

### A) Single Active Metered AI Price

Only one price on Infamous AI Actions (metered) may remain active.

All others → Archive.

### B) Lookup Keys Everywhere

This prevents broken deployments and enables CI/CD-safe billing.

| Product | Lookup Key |
| --- | --- |
| AI Metered | `iff_ai_action_metered` |
| Pro Seat | `iff_pro_seat_monthly` |
| Business Seat | `iff_business_seat_monthly` |
| Enterprise Minimum | `iff_enterprise_minimum_monthly` |
| Satellite | `iff_satellite_weather_monthly` |
| Tracking | `iff_tracking_per_truck_monthly` |

---

## 4) AI Usage Billing — Final Production Flow

### Step 1: Capture AI Subscription Item ID

On Stripe webhook:

- `customer.subscription.created`
- `customer.subscription.updated`

Extract:

- `subscription.items.data[].id`

where price = AI metered price

Store:

- `tenant.stripe_ai_subscription_item_id`

### Step 2: Log AI Usage Internally

Each AI action logs:

- `tenant_id`
- `action_type`
- `timestamp`

### Step 3: Report Usage to Stripe (Revenue Engine)

Daily or hourly job:

```js
async function reportAiUsage({
  stripeClient,
  aiSubscriptionItemId,
  usageCount,
  logger = console,
}) {
  try {
    const usageRecord = await stripeClient.subscriptionItems.createUsageRecord(
      aiSubscriptionItemId,
      {
        quantity: usageCount,
        timestamp: Math.floor(Date.now() / 1000),
        action: "increment",
      },
    );

    // Audit log: successful usage report
    logger.info?.("AI usage reported to Stripe", {
      subscriptionItemId: aiSubscriptionItemId,
      usageRecordId: usageRecord.id,
      quantity: usageRecord.quantity,
      timestamp: usageRecord.timestamp,
    });

    return usageRecord;
  } catch (error) {
    // Audit log: failed usage report
    logger.error?.("Failed to report AI usage to Stripe", {
      subscriptionItemId: aiSubscriptionItemId,
      error: error.message,
    });
    throw error;
  }
}
```

Stripe now:

- calculates AI charges
- invoices automatically
- handles proration
- ensures compliance

This is how Snowflake, Datadog, Twilio monetize usage.

---

## 5) Tier-Level AI Governance (Protect Your Margins)

### Recommended Limits

| Tier | AI Actions / Month |
| --- | --- |
| Starter | 0 |
| Pro | 50 free |
| Business | 5,000 |
| Enterprise | Custom |

Once limit exceeded → Stripe bills via metered AI.

---

## 6) Revenue Protection Controls (Enterprise-Grade)

### Stripe Side

Enable:

- Customer Portal
- Smart Retries
- Dunning
- SCA / 3DS
- Failed Payment Recovery
- Usage Alerts ($500, $1k, $5k)

### Platform Side

- AI quota enforcement
- Overages billed automatically
- Entitlement sync from Stripe
- Grace period logic

---

## 7) Stripe → Infæmous Freight Feature Entitlement Map

### SaaS Core

| Stripe Product | Enables |
| --- | --- |
| Starter Access | Dashboard, basic dispatch |
| Pro Seat | Multi-user, automation |
| Business Seat | AI routing, voice, billing AI |
| Enterprise Access | RBAC, SLA, audit logs |

### AI Layer

| Stripe Product | Enables |
| --- | --- |
| AI Metered | All AI actions |
| AI Event SKUs | Enterprise premium AI |
| Satellite | Weather-aware AI routing |
| Tracking | Real-time asset AI |

---

## 8) Enterprise Compliance & Investor Readiness

Your billing system is now:

- SOC2 billing aligned
- Audit-friendly
- Contract-ready
- Margin-safe
- Scalable to millions of AI actions
- Compatible with Series A+ due diligence

---

## 9) Your Competitive Advantage (What You’ve Built)

Very few startups build:

- Seat-based SaaS
- Asset-based billing
- AI usage billing
- Event-based AI monetization
- Enterprise minimums
- Modular add-ons

…in a single coherent system.

This positions Infæmous Freight as:

**A true AI-native enterprise logistics platform, not just a SaaS app.**

---

## 10) Final Status

With everything you’ve done and the above recommendations implemented:

- Stripe is production-ready
- AI monetization is scalable and margin-safe
- SaaS billing is enterprise-grade
- Revenue model is investor-ready
- Safe to scale customers and AI usage

---

## What You Can Do Next (Optional, Strategic)

If you want, I can now provide:

- Investor revenue projections (based on seats, AI usage, enterprise tiers)
- Stripe → feature gating middleware (exact logic to enforce plans in your API)
- SOC2 billing controls checklist
- Expansion pricing (international, multi-currency, VAT-ready)
