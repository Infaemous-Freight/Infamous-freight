# DoorDash-Style Marketplace Implementation Guide

## 🎯 Overview

Complete implementation of a DoorDash-style marketplace with:

- **Jobs**: Shippers post delivery jobs
- **Matching**: Drivers see nearby jobs they can fulfill
- **Pay-per-delivery**: Stripe Checkout for job payments
- **Subscriptions**: Tiered plans (Starter/Pro/Enterprise) with delivery discounts
- **Customer Portal**: Self-service subscription management

## 📦 Installation

### 1. Dependencies

The following dependencies are already added to `package.json`:

- `stripe@^12.18.0` - Stripe SDK
- `zod@^3.22.4` - Schema validation

No installation needed if `node_modules` already exists. Otherwise:

```bash
cd api
npm install
```

### 2. Environment Variables

Copy the `.env.example` to `.env` and configure:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...

# Public URL for redirects
PUBLIC_APP_URL=http://localhost:3000

# Pricing (defaults shown)
PRICE_BASE_USD=6.00
PRICE_PER_MILE_USD=1.85
PRICE_PER_MINUTE_USD=0.20
PRICE_MINIMUM_USD=9.99

# Discounts by plan tier
DISCOUNT_STARTER_PCT=10
DISCOUNT_PRO_PCT=20
DISCOUNT_ENTERPRISE_PCT=30

# Matching radius
MATCH_RADIUS_MILES=10
```

### 3. Stripe Setup

**Create Products & Prices in Stripe Dashboard:**

1. Go to https://dashboard.stripe.com/test/products
2. Create 3 products:
   - **Starter Plan** - $29/month
   - **Pro Plan** - $99/month
   - **Enterprise Plan** - $299/month
3. Copy each price ID (starts with `price_...`) to your `.env`

**Configure Webhook:**

1. Go to https://dashboard.stripe.com/test/webhooks
2. Add endpoint: `https://your-api-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret (starts with `whsec_...`) to your `.env`

### 4. Database Migration

```bash
cd api
npx prisma migrate dev --name marketplace_billing_plans
```

This creates the new models:

- `DriverProfile` - Driver location & activity
- `Vehicle` - Driver vehicle capabilities
- `Job` - Delivery jobs
- `JobPayment` - Per-delivery payments

### 5. Seed Sample Data

```bash
cd api
node prisma/seedMarketplace.js
```

Creates:

- 2 shippers (one FREE, one PRO)
- 2 drivers with vehicles
- 1 sample job

## 🚀 API Endpoints

### Marketplace Routes (`/api/marketplace`)

**Health Check**

```
GET /api/marketplace/health
```

**Driver: Update Location**

```
POST /api/marketplace/drivers/location
{
  "userId": "driver-user-id",
  "lat": 34.0522,
  "lng": -118.2437
}
```

**Driver: Add Vehicle**

```
POST /api/marketplace/drivers/vehicles
{
  "userId": "driver-user-id",
  "type": "VAN",
  "nickname": "White Van",
  "maxWeightLbs": 3000,
  "maxVolumeCuFt": 300
}
```

**Shipper: Create Job**

```
POST /api/marketplace/jobs
{
  "shipperId": "shipper-user-id",
  "pickupAddress": "123 Main St",
  "pickupLat": 34.0522,
  "pickupLng": -118.2437,
  "dropoffAddress": "456 Broadway",
  "dropoffLat": 34.0589,
  "dropoffLng": -118.2359,
  "requiredVehicle": "VAN",
  "weightLbs": 500,
  "volumeCuFt": 50,
  "estimatedMiles": 5.2,
  "estimatedMinutes": 25,
  "notes": "Handle with care"
}
```

**Shipper: Get Checkout URL**

```
POST /api/marketplace/jobs/:jobId/checkout
→ Returns { checkoutUrl: "https://checkout.stripe.com/..." }
```

**Driver: List Available Jobs**

```
GET /api/marketplace/jobs?status=OPEN&lat=34.0522&lng=-118.2437
```

**Get Eligible Drivers for Job**

```
GET /api/marketplace/jobs/:jobId/match
```

**Driver: Accept Job**

```
POST /api/marketplace/jobs/accept
{
  "jobId": "job-id",
  "driverUserId": "driver-user-id"
}
```

**Driver: Mark Delivered**

```
POST /api/marketplace/jobs/:jobId/deliver
```

### Billing Routes (`/api/marketplace/billing`)

**Create Subscription Checkout**

```
POST /api/marketplace/billing/subscribe
{
  "userId": "user-id",
  "tier": "PRO"
}
→ Returns { checkoutUrl: "https://checkout.stripe.com/..." }
```

**Get Customer Portal**

```
POST /api/marketplace/billing/portal
{
  "userId": "user-id"
}
→ Returns { portalUrl: "https://billing.stripe.com/..." }
```

### Webhooks (`/api/webhooks`)

```
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: t=...
```

Handled events:

- `checkout.session.completed` - Payment success → Job OPEN
- `customer.subscription.created/updated` - Update user plan
- `customer.subscription.deleted` - Cancel plan
- `invoice.payment_succeeded` - Renew subscription
- `invoice.payment_failed` - Mark past due

## 🎭 User Flows

### Flow 1: Shipper Posts Job & Pays

1. **POST /api/marketplace/jobs** - Create job (status: REQUIRES_PAYMENT)
2. **POST /api/marketplace/jobs/:id/checkout** - Get Stripe Checkout URL
3. Shipper completes payment on Stripe
4. Webhook receives `checkout.session.completed`
5. Job status → OPEN
6. Drivers can now see and accept

### Flow 2: Driver Accepts Job

1. **POST /api/marketplace/drivers/location** - Update location
2. **GET /api/marketplace/jobs?lat=...&lng=...** - See nearby jobs
3. **POST /api/marketplace/jobs/accept** - Accept job
4. Job status → ACCEPTED
5. **POST /api/marketplace/jobs/:id/deliver** - Mark delivered

### Flow 3: Shipper Subscribes to Plan

1. **POST /api/marketplace/billing/subscribe** - Get checkout URL
2. Shipper completes subscription on Stripe
3. Webhook receives `customer.subscription.created`
4. User `planTier` → STARTER/PRO/ENTERPRISE
5. Future deliveries get automatic discount

### Flow 4: Manage Subscription

1. **POST /api/marketplace/billing/portal** - Get portal URL
2. Shipper manages subscription (upgrade/downgrade/cancel)
3. Webhooks update user plan automatically

## 🧪 Testing Locally

### 1. Start Development Server

```bash
cd api
npm run dev
```

### 2. Test with Stripe CLI

```bash
# Forward webhooks to local server
stripe listen --forward-to http://localhost:4000/api/webhooks/stripe

# Trigger test webhook
stripe trigger checkout.session.completed
```

### 3. Create Test Job

```bash
curl -X POST http://localhost:4000/api/marketplace/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "shipperId": "<shipper-user-id>",
    "pickupAddress": "123 Main St",
    "pickupLat": 34.0522,
    "pickupLng": -118.2437,
    "dropoffAddress": "456 Broadway",
    "dropoffLat": 34.0589,
    "dropoffLng": -118.2359,
    "requiredVehicle": "VAN",
    "weightLbs": 500,
    "volumeCuFt": 50,
    "estimatedMiles": 5.2,
    "estimatedMinutes": 25
  }'
```

### 4. Get Checkout URL

```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/<job-id>/checkout
```

## 🔐 Security Notes

- Webhooks verify Stripe signature
- All routes should add authentication middleware
- Rate limiting already applied globally
- Consider adding:
  - `authenticate` middleware to all routes
  - `requireScope()` for role-based access
  - `validateUserOwnership()` for resource access

## 📊 Pricing Logic

Base formula:

```
price = BASE + (miles × PER_MILE) + (minutes × PER_MINUTE)
```

With plan discounts:

- FREE: 0% off
- STARTER: 10% off
- PRO: 20% off
- ENTERPRISE: 30% off

Minimum price enforced: $9.99

## 🚢 Deployment

### Production Checklist

- [ ] Set production Stripe keys
- [ ] Configure production webhook endpoint
- [ ] Set `PUBLIC_APP_URL` to production domain
- [ ] Run migration: `npx prisma migrate deploy`
- [ ] Add authentication middleware to all routes
- [ ] Enable rate limiting
- [ ] Set up monitoring/alerts
- [ ] Test webhook delivery

### Environment Verification

```bash
# Check required variables
node -e "const required = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_STARTER', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_ENTERPRISE', 'PUBLIC_APP_URL']; required.forEach(v => console.log(v, '=', process.env[v] ? '✓' : '✗'));"
```

## 📚 File Reference

```
api/
├── src/
│   ├── lib/
│   │   ├── stripe.js         # Stripe client
│   │   ├── geo.js            # Distance calculations
│   │   └── pricing.js        # Price computation
│   ├── marketplace/
│   │   ├── validators.js     # Zod schemas
│   │   ├── router.js         # Marketplace routes
│   │   ├── billingRouter.js  # Subscription routes
│   │   └── webhooks.js       # Stripe webhook handler
│   └── server.js             # Updated with new routes
├── prisma/
│   ├── schema.prisma         # Updated with marketplace models
│   └── seedMarketplace.js    # Sample data
└── package.json              # Added stripe & zod
```

## 🎉 Success Criteria

- ✅ Jobs created with pricing
- ✅ Stripe Checkout for deliveries
- ✅ Webhooks mark jobs OPEN
- ✅ Drivers can accept jobs
- ✅ Subscription checkout works
- ✅ Customer Portal accessible
- ✅ Plan discounts applied
- ✅ All automated via webhooks

---

**Need Help?**

- Stripe Docs: https://stripe.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Test Cards: https://stripe.com/docs/testing
