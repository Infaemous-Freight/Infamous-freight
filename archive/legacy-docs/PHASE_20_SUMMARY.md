# Phase 20: Quick Reference — Revenue & Billing

**Status**: ✅ 100% Complete | **Production Ready**

---

## ⚡ Quick Start

### 1. Set Up Stripe

```bash
# Create Stripe account (if not already done)
# Go to Stripe Dashboard → Products

# Create 3 recurring products:
# 1. Starter: $99/month
# 2. Growth: $499/month
# 3. Enterprise: $2,500/month

# Copy price IDs to .env
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

### 2. Configure Environment

```bash
# Copy from .env.example
cp .env.example .env

# Edit .env with your Stripe keys
STRIPE_API_SECRET=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

### 3. Run Migrations

```bash
cd apps/api
pnpm prisma migrate deploy
pnpm prisma generate
```

### 4. Start Services

```bash
# Terminal 1: API
pnpm api:dev

# Terminal 2: Web
pnpm web:dev
```

### 5. Test Subscription

```bash
# Create subscription
curl -X POST http://localhost:4000/api/billing/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"plan": "STARTER"}'

# Get billing portal
curl -X GET http://localhost:4000/api/billing/portal \
  -H "Authorization: Bearer <token>"
```

---

## 📊 Pricing Models

### By Job (Per-Delivery Commission)

| Vehicle | Base | %   |
| ------- | ---- | --- |
| Car     | $5   | 8%  |
| Van     | $8   | 10% |
| Truck   | $15  | 12% |
| Semi    | $25  | 15% |

### By Plan (Monthly Subscription)

| Plan       | Cost   | Jobs      | Overage   |
| ---------- | ------ | --------- | --------- |
| Starter    | $99    | 100       | $1.50/job |
| Growth     | $499   | 1,000     | $1.50/job |
| Enterprise | $2,500 | Unlimited | $0        |

---

## 🔌 Core Modules

### `apps/api/src/billing/stripeSync.ts`

**Subscription Lifecycle**

```typescript
// Create subscription
const sub = await createStripeSubscription(orgId, name, "STARTER");

// Upgrade plan
await updateSubscriptionPlan(orgId, "GROWTH");

// Cancel subscription
await cancelSubscription(orgId, false); // false = 30-day delay

// Get details
const details = await getSubscriptionDetails(orgId);
```

### `apps/api/src/billing/usage.ts`

**Track Jobs & Calculate Fees**

```typescript
// When job completes
await recordJobCompletion(orgId, jobId, "VAN", 150); // $150 job

// Get monthly usage
const usage = await getMonthlyUsage(orgId, "2025-01");
// { jobs: 95, revenue: 892.50, overageJobs: 5, overageCharge: 7.50 }

// Get date range
const summary = await getUsageSummary(orgId, "2024-12", "2025-01");
```

### `apps/api/src/billing/invoicing.ts`

**Generate Monthly Invoices**

```typescript
// Generate invoice for specific month
const invoice = await generateOrgInvoice(orgId, "2025-01");

// Batch generate all orgs (runs 1st of month)
await generateMonthlyInvoices();

// Retrieve invoice
const inv = await getInvoice(orgId, "2025-01");

// Mark paid
await markInvoicePaid(orgId, "2025-01");
```

### `apps/api/src/billing/documents.ts`

**Generate Compliance Docs**

```typescript
// DPA (Data Processing Agreement)
const dpa = await generateDPAPDF(orgId, "Acme Corp");

// SOC2 Compliance Certificate
const soc2 = await generateSOC2PDF("Acme Corp");

// Store both in Stripe
const docs = await storeComplianceDocuments(orgId, orgName, customerId);
```

### `apps/api/src/routes/billing.ts`

**API Endpoints**

| Endpoint                      | Method | Purpose                      |
| ----------------------------- | ------ | ---------------------------- |
| `/api/billing/portal`         | GET    | 🔗 Link to billing dashboard |
| `/api/billing/subscribe`      | POST   | ➕ New subscription          |
| `/api/billing/upgrade`        | POST   | ⬆️ Upgrade plan              |
| `/api/billing/cancel`         | POST   | ❌ Cancel subscription       |
| `/api/billing/subscription`   | GET    | 📋 Get details               |
| `/api/billing/usage`          | GET    | 📊 Current month usage       |
| `/api/billing/invoice/:month` | GET    | 📄 Get invoice               |
| `/api/billing/pricing`        | GET    | 💵 Public pricing            |

---

## 🚀 Workflows

### New Organization Signup

```
1. POST /api/orgs/create
   └─ Create organization record

2. POST /api/billing/subscribe
   ├─ Create Stripe customer
   ├─ Create subscription (default: STARTER)
   └─ Create OrgBilling record

3. Auto-generated:
   ├─ DPA PDF
   ├─ SOC2 Certificate
   └─ Compliance docs stored in Stripe metadata
```

### Job Completion & Revenue Tracking

```
1. Job status → COMPLETED
   └─ recordJobCompletion(orgId, jobId, vehicleType, price)

2. Calculate platform fee:
   Fee = baseFee + (price × commissionPercent)

3. Update OrgUsage:
   ├─ Increment jobs counter
   ├─ Add to revenue
   └─ Detect overage if jobs > quota

4. Report to Stripe:
   └─ Update metered usage for billing
```

### Monthly Invoicing (1st of Month)

```
1. BullMQ job triggers (00:00 UTC)
   └─ generateMonthlyInvoices()

2. For each active organization:
   ├─ Query OrgUsage (previous month)
   ├─ Query OrgBilling (plan details)
   ├─ Calculate: baseFee + overageCharge
   ├─ Create Stripe invoice items
   ├─ Finalize invoice
   └─ Save to OrgInvoice

3. Notifications:
   ├─ Slack alert (stats)
   └─ Email reminders (optional)
```

---

## 💼 Database Schema

### OrgBilling (Links org to Stripe)

```
organizationId  │ Customer's org ID
stripeCustomerId│ Stripe customer ID
stripeSubId     │ Stripe subscription ID
plan            │ STARTER | GROWTH | ENTERPRISE
monthlyBase     │ Plan base fee
monthlyQuota    │ Job quota for plan
nextBillingDate │ When next invoice due
```

### OrgUsage (Monthly usage tracking)

```
organizationId  │ Customer's org ID
month           │ YYYY-MM format
jobs            │ Total jobs completed
revenue         │ Total platform fees collected
overageJobs     │ Jobs beyond quota
overageCharge   │ Total overage fee
```

### OrgInvoice (Generated invoices)

```
organizationId  │ Customer's org ID
month           │ YYYY-MM format
baseFee         │ Plan monthly cost
overageCharge   │ Additional fees
totalAmount     │ baseFee + overageCharge
stripeInvoiceId │ Stripe invoice ID
pdfUrl          │ PDF download link
stripeStatus    │ paid | open | draft | etc.
```

---

## 🧪 Testing Endpoints

### Create Subscription

```bash
curl -X POST http://localhost:4000/api/billing/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"plan": "STARTER"}'
```

### Get Current Usage

```bash
curl http://localhost:4000/api/billing/usage \
  -H "Authorization: Bearer eyJhbGc..."
```

### Upgrade Plan

```bash
curl -X POST http://localhost:4000/api/billing/upgrade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"plan": "GROWTH"}'
```

### Cancel Subscription

```bash
curl -X POST http://localhost:4000/api/billing/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"immediately": false}'
```

### Get Invoice

```bash
curl http://localhost:4000/api/billing/invoice/2025-01 \
  -H "Authorization: Bearer eyJhbGc..."
```

### View Billing Portal

```bash
curl http://localhost:4000/api/billing/portal \
  -H "Authorization: Bearer eyJhbGc..."
# Returns: { "url": "https://billing.stripe.com/..." }
```

---

## 🔧 Configuration Checklist

- [ ] Stripe account created
- [ ] 3 products + pricing configured
- [ ] Price IDs copied to `.env`
- [ ] `STRIPE_API_SECRET` set
- [ ] `STRIPE_PUBLISHABLE_KEY` set
- [ ] `.env` updated with all Stripe vars
- [ ] `pnpm prisma migrate deploy` run
- [ ] `pnpm prisma generate` run
- [ ] API server started
- [ ] BullMQ scheduled (1st of month job)
- [ ] Slack webhook configured (optional)
- [ ] Invoice auto-send enabled (optional)

---

## 🐛 Common Issues

| Issue                   | Fix                                     |
| ----------------------- | --------------------------------------- |
| "No billing found"      | `POST /api/billing/subscribe` to create |
| "Invalid price ID"      | Check STRIPE*PRICE*\* in `.env`         |
| Invoices not generating | Verify Redis + BullMQ running           |
| Webhook errors          | Check STRIPE_WEBHOOK_SECRET             |
| Stripe fails silently   | Check API logs, verify API key          |

---

## 📈 Monitoring Commands

```bash
# Check Redis connection
redis-cli ping

# View BullMQ job status
redis-cli LRANGE bull:monthly-invoicing:completed 0 -1

# Test Stripe API
curl https://api.stripe.com/v1/customers \
  -u sk_test_...:

# Trigger manual invoice generation (admin)
curl -X POST http://localhost:4000/api/admin/billing/invoices/generate \
  -H "Authorization: Bearer <admin_token>"
```

---

## 🔒 Security Notes

- 🔐 **Stripe Keys**: Always in `.env`, never committed
- 🔐 **Customer Data**: Encrypted at rest (Phase 19 KMS)
- 🔐 **API Auth**: All endpoints require JWT + `authenticate` middleware
- 🔐 **Audit Logging**: All billing actions logged + audit trail

---

## 📚 Files Created

| File                                    | Purpose            | Lines |
| --------------------------------------- | ------------------ | ----- |
| `apps/api/src/billing/stripeSync.ts`    | Subscription mgmt  | 250+  |
| `apps/api/src/billing/usage.ts`         | Usage tracking     | 300+  |
| `apps/api/src/billing/invoicing.ts`     | Invoice generation | 350+  |
| `apps/api/src/billing/documents.ts`     | DPA/SOC2 PDFs      | 350+  |
| `apps/api/src/routes/billing.ts`        | API endpoints      | 400+  |
| `apps/api/src/jobs/monthlyInvoicing.ts` | BullMQ job         | 400+  |
| `PHASE_20_COMPLETE.md`                  | Full docs          | 600+  |

---

## 🎯 Success Metrics

After Phase 20 is deployed, you can track:

- **Monthly Recurring Revenue (MRR)**: Total subscription + overage fees
- **Org Churn Rate**: % of subscriptions canceled
- **ARPU** (Average Revenue Per User): MRR / # of orgs
- **Overage Rate**: % of orgs hitting quota
- **Invoice Collection**: % of invoices paid on time

---

## ✅ Status

Phase 20: ✅ **100% COMPLETE**

All components:

- ✅ Stripe integration complete
- ✅ Usage metering implemented
- ✅ Invoice generation automated
- ✅ Compliance docs generated
- ✅ BullMQ job scheduled
- ✅ API endpoints available
- ✅ Documentation complete

**Ready for**: Production deployment, sales enablement, customer go-to-market

---

Next: **Phase 21 — Sales Enablement & Go-To-Market**

- Landing page
- Pitch deck generator
- ROI calculator
- Demo environment

Generated: 2025-01-15
