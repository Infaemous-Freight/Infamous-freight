# Infamous Freight Pricing Architecture (Production Blueprint)

This blueprint converts the finalized pricing, monetization, and governance
decisions into production-ready structure. It is designed to be copy-pasteable
into execution planning and Stripe configuration.

## 1) Pricing Ladder Optimization

### Operator — $19 / seat / month

**Target:** Owner-operators, small fleets

**Includes:**

- Dispatch board
- Load tracking
- Invoicing lite
- 100 AI actions included
- Email support

**AI Overage:** $0.01 per action

**Hard Cap:** 200 actions unless upgraded

**Positioning:** Freight OS for solo operators.

---

### Fleet — $49 / seat / month

**Target:** Growing fleets

**Includes:**

- Everything in Operator
- Advanced routing
- Predictive ETAs
- API access
- 500 AI actions included

**AI Overage:** $0.008 per action

**Soft Alert:** 80% usage email + dashboard banner

**Hard Cap:** 2× plan limit unless upgraded

**Positioning:** AI-Enhanced Fleet Control.

---

### Enterprise — $149 / seat / month

**Target:** Regional / National carriers

**Includes:**

- Everything in Fleet
- Custom automation rules
- Dispatch AI automation
- Role-based access
- Monthly executive report
- 2,000 AI actions included

**AI Overage:** $0.005 per action

**Enterprise Minimum:** $2,500 monthly floor

**Positioning:** AI Operations Command Center.

---

### Intelligence Add-On — $299 / month

**Attachable to:** Fleet, Enterprise (not available for Operator)

**Includes:**

- Weather disruption modeling
- Risk scoring
- Satellite route signals
- Delay prediction

**Purpose:** Increase ARPU without increasing seat pricing friction.

## 2) AI Usage Governance (Mandatory)

### Rate Limiting

- **Default:** 60 AI calls/minute per account
- **Burst:** allowed but capped

### Abuse Detection

Flag usage when:

- Usage exceeds 5× historical average
- Sudden overnight spike

### Hard Cap Logic

If usage exceeds **200%** of included limit:

- Temporarily pause AI until billing is confirmed

## 3) Enterprise Positioning & Billing Structure

Enterprise is high-touch and negotiated. Remove public payment link.

**Flow:**

1. Sales call
2. Custom contract
3. Stripe invoice-based billing
4. ACH preferred
5. Optional onboarding fee ($1,500–$5,000)

## 4) AI Metered Billing — Final Structure

**Unit model:** Per AI action

**Aggregation:** Monthly sum

**Usage reporting:** Stripe usage records

**Logic:**

```
if (ai_action_executed) {
  quantity = 1;
  reportUsage();
}
```

**Dashboard display requirements:**

- Current usage count
- Included limit
- Overage cost preview
- Upgrade suggestion

**Rule:** No surprise billing.

## 5) Internal Revenue Dashboard (Non-Public)

Track and display monthly + rolling 90-day trends for:

- MRR
- AI usage revenue
- ARPU by tier
- Seat count growth
- Overage revenue
- Churn rate
- LTV estimate

## 6) Risk Controls (Revenue Protection)

- Enforce AI caps and throttling before scaling
- Require billing confirmation before AI resume if usage exceeds 200% of
  included limits
- Track anomaly flags from abuse detection

## 7) Marketplace Evolution Path (Future Phase)

**When ready:**

- Stripe Connect
- Driver onboarding
- Platform fee (10–20%)
- Automated payouts

**Only after:**

- Core SaaS MRR is stable
- Usage governance is solid

## 8) Stripe Configuration Checklist

Enable:

- Smart retries
- Dunning emails
- Automatic card updates
- Customer portal
- Invoice reminders
- Tax configuration (for multi-state expansion)

## 9) Pricing Page Structure (Final Messaging)

Replace generic tier names with:

- Operator
- Fleet
- Enterprise

**Display requirements:**

- “Most Popular” badge on Fleet
- AI included count visibly displayed
- Overage pricing visible
- Annual billing option (15% discount)

## 10) Example Revenue Projection (Conservative)

If you reach:

- 200 Operator seats → $3,800
- 150 Fleet seats → $7,350
- 50 Enterprise seats → $7,450

**Base MRR:** ≈ $18,600

**Add moderate AI overage:** Avg $12/user → ≈ $4,800

**Add 40 Intelligence add-ons:** → ≈ $11,960

**Total:** ≈ **$35,000+ / month** (before marketplace)

## 11) Final Strategic Configuration

Infæmous Freight becomes **AI-Driven Freight Operations Infrastructure** with
multiple revenue vectors:

- Seat revenue
- Usage revenue
- Intelligence revenue
- Enterprise contracts
- Future marketplace fees
