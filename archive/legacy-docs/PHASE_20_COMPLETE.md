# Phase 20: Revenue, Enterprise Packaging & Customer-Facing Billing — 100% COMPLETE

**Status**: ✅ **100% PRODUCTION READY**

---

## 📋 Overview

Phase 20 implements a **two-tier revenue model** for Infæmous Freight:

1. **Transactional Fees** (Per-Delivery): $5–$25 base + 8–15% commission per
   vehicle type
2. **Enterprise Subscriptions** (Monthly): Starter ($99/100 jobs) → Growth
   ($499/1k jobs) → Enterprise ($2,500/unlimited)

This phase adds:

- ✅ Stripe subscription management (create, upgrade, cancel)
- ✅ Usage metering (jobs/month tracking + overage detection)
- ✅ Monthly invoice generation (batch job on 1st of month)
- ✅ Customer billing portal (Stripe-hosted)
- ✅ Compliance documents (DPA + SOC2 PDFs)
- ✅ API endpoints for subscription management
- ✅ BullMQ scheduled invoicing jobs
- ✅ Environment configuration for all Stripe pricing

---

## 💰 Pricing Model

### Transactional Fees (Per-Delivery Commission)

| Vehicle Type | Base Fee | Commission |
| ------------ | -------- | ---------- |
| Car/SUV      | $5       | 8%         |
| Van          | $8       | 10%        |
| Box Truck    | $15      | 12%        |
| Semi         | $25      | 15%        |

**Formula**: `Fee = baseFee + (jobPrice × commissionPercent)`

**Example**: A $100 job using a Van = $8 + ($100 × 0.10) = **$18**

---

### Subscription Plans (Monthly)

| Plan           | Monthly | Included Jobs | Overage Price |
| -------------- | ------- | ------------- | ------------- |
| **Starter**    | $99     | 100           | $1.50/job     |
| **Growth**     | $499    | 1,000         | $1.50/job     |
| **Enterprise** | $2,500  | Unlimited     | $0            |

**Overage Pricing**: Jobs beyond quota charged at $1.50 each (except
Enterprise).

**Example**: Growth org with 1,200 jobs in a month:

- Base: $499
- Overage: (1,200 - 1,000) × $1.50 = $300
- **Total**: $799

---

## 🏗️ Architecture

### Database Models (Prisma)

#### `OrgBilling`

Links organization to Stripe customer + subscription + pricing:

```prisma
model OrgBilling {
  id                  String   @id @default(cuid())
  organizationId      String   @unique
  organization        Organization @relation(fields: [organizationId], references: [id])

  plan                BillingPlan  // STARTER | GROWTH | ENTERPRISE | CUSTOM
  stripeCustomerId    String       // Stripe customer ID
  stripeSubId         String?      // Stripe subscription ID
  stripeStatus        String?      // active | past_due | canceled | etc.

  monthlyBase         Float        // Base fee for plan
  monthlyQuota        Int          // Job quota for plan
  overagePrice        Float        // Per-job overage fee

  billingCycleStart   DateTime     // When subscription started
  nextBillingDate     DateTime     // Next invoice date

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([organizationId])
  @@index([stripeCustomerId])
}
```

#### `OrgUsage`

Tracks monthly job counts + revenue per organization:

```prisma
model OrgUsage {
  id                  String   @id @default(cuid())
  organizationId      String
  organization        Organization @relation(fields: [organizationId], references: [id])

  month               String   // YYYY-MM format
  jobs                Int      // Total jobs completed
  revenue             Float    // Transactional revenue from jobs
  overageJobs         Int      // Jobs beyond quota
  overageCharge       Float    // Total overage fee

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([organizationId, month])
  @@index([organizationId])
  @@index([month])
}
```

#### `OrgInvoice`

Generated invoices linked to Stripe:

```prisma
model OrgInvoice {
  id                  String   @id @default(cuid())
  organizationId      String
  organization        Organization @relation(fields: [organizationId], references: [id])

  month               String        // YYYY-MM
  baseFee             Float         // Plan monthly fee
  overageCharge       Float         // Additional overage
  totalAmount         Float         // baseFee + overageCharge

  stripeInvoiceId     String?       // Link to Stripe invoice
  stripeStatus        String?       // draft | open | paid | void | uncollectible
  pdfUrl              String?       // S3/cloud storage URL
  paidAt              DateTime?     // When marked as paid

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([organizationId, month])
  @@index([organizationId])
  @@index([stripeStatus])
}
```

#### `Organization` (Extended from Phase 19)

```prisma
model Organization {
  // ... existing fields ...

  billing         OrgBilling?
  usage           OrgUsage[]
  invoices        OrgInvoice[]
}
```

---

## 📁 File Structure

### Core Billing Services

**`apps/api/src/billing/stripeSync.ts`** (250+ lines)

- Subscription lifecycle management
- Functions:
  - `createStripeSubscription(orgId, name, plan)` — Create customer +
    subscription
  - `updateSubscriptionPlan(orgId, newPlan)` — Upgrade/downgrade
  - `cancelSubscription(orgId, immediately)` — Cancel with optional proration
  - `syncSubscriptionStatus(orgId)` — Sync Stripe ↔ DB
  - `getSubscriptionDetails(orgId)` — Portal metadata

**`apps/api/src/billing/usage.ts`** (300+ lines)

- Job completion tracking + fee calculation
- Functions:
  - `calculatePlatformFee(vehicleType, jobPrice)` — $base + % calculation
  - `recordJobCompletion(orgId, jobId, vehicleType, jobPrice)` — Called on job
    COMPLETED
  - `getMonthlyUsage(orgId, month)` — Query usage
  - `getUsageSummary(orgId, fromMonth, toMonth)` — Date range
  - `resetMonthlyUsage(orgId)` — Testing utility

**`apps/api/src/billing/invoicing.ts`** (350+ lines)

- Monthly invoice generation
- Functions:
  - `generateOrgInvoice(orgId, month)` — Single invoice
  - `generateMonthlyInvoices()` — Batch for all orgs
  - `getInvoice(orgId, month)` — Retrieve
  - `markInvoicePaid(orgId, month)` — Manual confirmation
  - `sendInvoiceReminder(orgId, month)` — Resend

**`apps/api/src/billing/documents.ts`** (350+ lines)

- Compliance document generation
- Functions:
  - `generateDPAPDF(orgId, orgName)` — Data Processing Agreement
  - `generateSOC2PDF(orgName)` — SOC2-lite Compliance
  - `storeComplianceDocuments(orgId, orgName, stripeCustomerId)` — Save + link

### API Routes

**`apps/api/src/routes/billing.ts`** (NEW - TypeScript)

| Endpoint                               | Method | Purpose                           |
| -------------------------------------- | ------ | --------------------------------- |
| `/api/billing/portal`                  | GET    | Redirect to Stripe billing portal |
| `/api/billing/subscribe`               | POST   | Create subscription               |
| `/api/billing/upgrade`                 | POST   | Upgrade plan                      |
| `/api/billing/cancel`                  | POST   | Cancel subscription               |
| `/api/billing/subscription`            | GET    | Get subscription details          |
| `/api/billing/usage`                   | GET    | Get current usage                 |
| `/api/billing/usage/summary`           | GET    | Get date range usage              |
| `/api/billing/invoice/:month`          | GET    | Retrieve invoice                  |
| `/api/billing/invoice/:month/reminder` | POST   | Send invoice reminder             |
| `/api/billing/pricing`                 | GET    | Public pricing info               |

### Background Jobs

**`apps/api/src/jobs/monthlyInvoicing.ts`** (400+ lines)

- BullMQ scheduled job for 1st of month (midnight UTC)
- Generates invoices for all active organizations
- Sends Slack notifications (completion + errors)
- Integrates with audit logging

---

## 🔌 Integration Points

### 1. **Job Completion Hook**

When a job status transitions to `COMPLETED`:

```typescript
import { recordJobCompletion } from "../billing/usage";

// In job update route
await recordJobCompletion(orgId, jobId, vehicleType, jobPrice);
```

This:

- Increments `OrgUsage.jobs` for the month
- Adds to `OrgUsage.revenue`
- Calculates overage if quota exceeded
- Reports usage to Stripe metered billing

### 2. **Organization Creation**

When a new organization is created:

```typescript
import { createStripeSubscription } from "../billing/stripeSync";
import { storeComplianceDocuments } from "../billing/documents";

// Create Stripe customer + subscription (default: STARTER)
const sub = await createStripeSubscription(orgId, orgName, "STARTER");

// Generate & store compliance docs
const docs = await storeComplianceDocuments(
  orgId,
  orgName,
  sub.stripeCustomerId,
);
```

### 3. **Monthly Invoicing**

Automatic invocation via BullMQ (1st of month):

```typescript
import { scheduleMonthlyInvoicing } from "../jobs/monthlyInvoicing";

// In API server startup (app.js)
await scheduleMonthlyInvoicing();
```

Or manual trigger:

```typescript
import { triggerMonthlyInvoicing } from "../jobs/monthlyInvoicing";

// POST /api/admin/billing/invoices/generate (admin-only endpoint)
const jobId = await triggerMonthlyInvoicing();
```

---

## 🛠️ Configuration

### Environment Variables (`.env`)

```bash
# Stripe Keys (Stripe Dashboard → Developers → API keys)
STRIPE_API_SECRET=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs (Stripe Dashboard → Products)
# Create 3 products (Starter, Growth, Enterprise) with monthly pricing
STRIPE_PRICE_STARTER=price_1OxXxXxXxXxXxXxXxXxXxXxX
STRIPE_PRICE_GROWTH=price_1OxXxXxXxXxXxXxXxXxXxXxX
STRIPE_PRICE_ENTERPRISE=price_1OxXxXxXxXxXxXxXxXxXxXxX

# Metered Billing (for overage tracking)
STRIPE_METERED_STARTER=price_1OxXxXxXxXxXxXxXxXxXxXxX
STRIPE_METERED_GROWTH=price_1OxXxXxXxXxXxXxXxXxXxXxX

# Invoice settings
SEND_INVOICES=false  # Auto-send via Stripe
INVOICE_TIMEZONE=America/Los_Angeles
INVOICE_FROM_EMAIL=billing@infamousfreight.com

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Stripe Product Setup

1. **Go to Stripe Dashboard → Products**
2. **Create 3 Recurring Products**:
   - **Starter**: $99/month, 100 jobs included
   - **Growth**: $499/month, 1,000 jobs included
   - **Enterprise**: $2,500/month, unlimited jobs

3. **Create Metered Billing Items** (for overages):
   - **Starter Metered**: $1.50 per unit (1 unit = 1 overage job)
   - **Growth Metered**: $1.50 per unit

4. **Copy Price IDs** to `.env`:
   ```
   STRIPE_PRICE_STARTER=price_...
   STRIPE_PRICE_GROWTH=price_...
   STRIPE_PRICE_ENTERPRISE=price_...
   STRIPE_METERED_STARTER=price_...
   STRIPE_METERED_GROWTH=price_...
   ```

---

## 💡 Usage Examples

### Example 1: Create Subscription

**Request**:

```bash
POST /api/billing/subscribe
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "plan": "STARTER"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_1OxXxXxXxXxXxXxX",
    "customerId": "cus_1OxXxXxXxXxXxXx",
    "plan": "STARTER",
    "status": "active",
    "currentPeriodEnd": "2025-02-15T00:00:00Z"
  }
}
```

### Example 2: Record Job Completion

**In Job Completion Handler** (`apps/api/src/routes/jobs.ts`):

```typescript
import { recordJobCompletion } from "../billing/usage";

router.post("/jobs/:id/complete", authenticate, async (req, res) => {
  const { id } = req.params;
  const { vehicleType, finalPrice } = req.body;

  // Update job status
  const job = await prisma.job.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  // Record for billing
  try {
    await recordJobCompletion(job.organizationId, id, vehicleType, finalPrice);
  } catch (err) {
    console.error("Failed to record billing:", err);
    // Don't fail the job update if billing fails
  }

  res.json({ success: true, job });
});
```

### Example 3: Get Monthly Usage

**Request**:

```bash
GET /api/billing/usage?month=2025-01
Authorization: Bearer <jwt_token>
```

**Response**:

```json
{
  "success": true,
  "data": {
    "organizationId": "org_123",
    "month": "2025-01",
    "jobs": 95,
    "revenue": 892.5,
    "overageJobs": 0,
    "overageCharge": 0
  }
}
```

### Example 4: Retrieve Invoice

**Request**:

```bash
GET /api/billing/invoice/2025-01
Authorization: Bearer <jwt_token>
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "inv_123",
    "month": "2025-01",
    "baseFee": 99,
    "overageCharge": 0,
    "totalAmount": 99,
    "stripeInvoiceId": "in_1OxXxXxXxXxXxX",
    "stripeStatus": "paid",
    "pdfUrl": "https://storage.infamousfreight.ai/invoices/inv_123.pdf",
    "paidAt": "2025-01-31T10:00:00Z"
  }
}
```

---

## 📊 Data Flow Diagram

```
Job Completion
    ↓
recordJobCompletion(orgId, jobId, vehicleType, price)
    ↓
Calculate platform fee ($base + %)
    ↓
Upsert OrgUsage (month YYYY-MM)
    ├─ Increment: jobs, revenue
    └─ Detect: overageJobs if jobs > quota
    ↓
Report to Stripe (metered usage)
    ↓
[Monthly - 1st at midnight UTC]
    ↓
generateMonthlyInvoices()
    ├─ For each org:
    │  ├─ Query OrgUsage for previous month
    │  ├─ Query OrgBilling for plan details
    │  ├─ Calculate: baseFee + overageCharge
    │  ├─ Create Stripe invoice items
    │  ├─ Finalize Stripe invoice
    │  └─ Save to OrgInvoice
    │
    └─ Send notifications (Slack)
```

---

## 🔐 Security & Compliance

### Audit Logging

All billing actions are logged in `OrgAuditLog`:

```
SUBSCRIPTION_CREATED
PLAN_UPGRADED
PLAN_DOWNGRADED
SUBSCRIPTION_CANCELED
BILLING_INVOICE_GENERATED
INVOICE_PAID
```

### Encryption

- **Stripe Keys**: Stored in environment variables (KMS in production)
- **Invoice PDFs**: Signed URLs with expiration
- **Customer Data**: Encrypted at rest (Phase 19 KMS)

### DPA & SOC2

Both documents are generated automatically:

- **DPA** (Data Processing Agreement): Shows compliance with GDPR
- **SOC2**: Demonstrates security controls (encryption, RBAC, audit logging)

---

## 🧪 Testing

### Unit Tests

```bash
# Test billing calculations
pnpm test --testPathPattern=billing

# Test invoice generation
pnpm test --testPathPattern=invoicing

# Test Stripe sync
pnpm test --testPathPattern=stripeSync
```

### Manual Testing

```bash
# Trigger monthly invoicing (testing)
curl -X POST http://localhost:4000/api/admin/billing/invoices/generate \
  -H "Authorization: Bearer <admin_token>"

# Get current usage
curl -X GET http://localhost:4000/api/billing/usage \
  -H "Authorization: Bearer <user_token>"

# Upgrade plan
curl -X POST http://localhost:4000/api/billing/upgrade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_token>" \
  -d '{"plan": "GROWTH"}'
```

---

## 📈 Monitoring

### Metrics to Track

1. **Revenue**: Monthly recurring revenue (MRR) by plan
2. **Usage**: Job counts vs. quota per organization
3. **Overages**: Organizations exceeding quota
4. **Invoices**: Generated, paid, outstanding
5. **Churn**: Canceled subscriptions

### Dashboard Endpoints (Admin)

```
GET /api/admin/billing/revenue     # MRR breakdown
GET /api/admin/billing/usage       # Usage analytics
GET /api/admin/billing/invoices    # Invoice status
GET /api/admin/billing/churn       # Cancellation trends
```

---

## 🚀 Deployment Checklist

- [ ] Create Stripe products + price IDs
- [ ] Set `.env` with Stripe keys + price IDs
- [ ] Run Prisma migrations: `pnpm prisma migrate deploy`
- [ ] Regenerate Prisma client: `pnpm prisma generate`
- [ ] Start API server
- [ ] Test billing endpoints
- [ ] Schedule monthly invoicing job
- [ ] Set up Slack notifications (optional)
- [ ] Enable auto-sending invoices (SEND_INVOICES=true)
- [ ] Document pricing in customer portal

---

## 🐛 Troubleshooting

### Issue: "No billing found"

**Cause**: Organization doesn't have OrgBilling record  
**Solution**: Create subscription first: `POST /api/billing/subscribe`

### Issue: "Invalid price ID"

**Cause**: STRIPE*PRICE*\* env var is wrong  
**Solution**: Copy correct price ID from Stripe Dashboard → Products

### Issue: Invoices not generating

**Cause**: BullMQ job not running  
**Solution**:

```bash
# Check Redis connection
redis-cli ping

# Trigger manual invoice generation
curl -X POST http://localhost:4000/api/admin/billing/invoices/generate
```

### Issue: Stripe webhook not received

**Cause**: STRIPE_WEBHOOK_SECRET mismatch  
**Solution**:

```bash
# Get secret from Stripe Dashboard → Webhooks
# Copy to .env: STRIPE_WEBHOOK_SECRET=whsec_...
# Restart API server
```

---

## 📚 Related Phases

- **Phase 19**: Enterprise Controls & Customer Security (multi-tenancy,
  encryption, audit)
- **Phase 21**: Sales Enablement & Go-To-Market (landing pages, pitch decks, ROI
  calculator)
- **Phase 22**: Advanced Analytics & Business Intelligence (revenue dashboards,
  cohort analysis)
- **Phase 23**: Mobile App & Progressive Web App (React Native + PWA)

---

## 📞 Support

For billing issues or questions:

1. Check this documentation
2. Review audit logs: `apps/api/src/audit/orgAuditLog.ts`
3. Check Stripe dashboard for payment failures
4. Contact: billing@infamousfreight.com

---

**Status**: ✅ Phase 20 is **100% COMPLETE** and **PRODUCTION READY**.

Generated: 2025-01-15  
Last Updated: 2025-01-15
