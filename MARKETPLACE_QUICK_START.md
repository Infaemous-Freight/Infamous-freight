# Marketplace Quick Reference

## 🚀 Getting Started (5 minutes)

### 1. Configure Stripe

```bash
# Add to api/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run Migration

```bash
cd api
npx prisma migrate dev --name marketplace_billing_plans
```

### 3. Seed Data

```bash
node prisma/seedMarketplace.js
```

### 4. Start Server

```bash
npm run dev
```

## 📋 API Endpoints

### Drivers

```bash
# Update location
POST /api/marketplace/drivers/location
{ "userId": "...", "lat": 34.0522, "lng": -118.2437 }

# Add vehicle
POST /api/marketplace/drivers/vehicles
{ "userId": "...", "type": "VAN", "maxWeightLbs": 3000, "maxVolumeCuFt": 300 }

# List available jobs
GET /api/marketplace/jobs?status=OPEN&lat=34.0522&lng=-118.2437

# Accept job
POST /api/marketplace/jobs/accept
{ "jobId": "...", "driverUserId": "..." }

# Mark delivered
POST /api/marketplace/jobs/:jobId/deliver
```

### Shippers

```bash
# Create job
POST /api/marketplace/jobs
{
  "shipperId": "...",
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
}

# Get payment checkout
POST /api/marketplace/jobs/:jobId/checkout

# Subscribe to plan
POST /api/marketplace/billing/subscribe
{ "userId": "...", "tier": "PRO" }

# Access customer portal
POST /api/marketplace/billing/portal
{ "userId": "..." }
```

## 🔄 Job Lifecycle

```
DRAFT → REQUIRES_PAYMENT → OPEN → ACCEPTED → PICKED_UP → DELIVERED → COMPLETED
                ↓
            (payment)
```

1. Shipper creates job: `REQUIRES_PAYMENT`
2. Shipper pays via Stripe Checkout
3. Webhook marks job: `OPEN`
4. Driver accepts: `ACCEPTED`
5. Driver delivers: `DELIVERED`

## 💰 Pricing

**Base Formula:**

```
price = $6.00 + (miles × $1.85) + (minutes × $0.20)
minimum = $9.99
```

**Plan Discounts:**

- FREE: 0% off
- STARTER: 10% off (saves $1-2 per delivery)
- PRO: 20% off (saves $2-4 per delivery)
- ENTERPRISE: 30% off (saves $3-6 per delivery)

## 🎯 Vehicle Types

- `CAR` - Small packages
- `SUV` - Medium loads
- `VAN` - Large cargo
- `BOX_TRUCK` - Heavy freight
- `STRAIGHT_TRUCK` - Industrial
- `SEMI` - Long haul

## 🧪 Testing

### Stripe CLI

```bash
# Forward webhooks
stripe listen --forward-to http://localhost:4000/api/webhooks/stripe

# Trigger events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### Test Cards

- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Authentication: `4000 0025 0000 3155`

## 📁 Files Created

```
api/src/lib/
  ├── stripe.js         # Stripe SDK client
  ├── geo.js            # Distance calculations
  └── pricing.js        # Price computation

api/src/marketplace/
  ├── validators.js     # Zod schemas
  ├── router.js         # Job & driver routes
  ├── billingRouter.js  # Subscription routes
  └── webhooks.js       # Stripe webhooks

api/prisma/
  ├── schema.prisma     # Updated models
  └── seedMarketplace.js # Sample data
```

## ⚡ Common Tasks

### Get Job Details

```sql
SELECT * FROM jobs WHERE id = 'job-id';
SELECT * FROM job_payments WHERE job_id = 'job-id';
```

### Check User Plan

```sql
SELECT email, plan_tier, plan_status FROM users WHERE id = 'user-id';
```

### Find Nearby Drivers

```sql
SELECT * FROM driver_profiles
WHERE is_active = true
  AND last_lat IS NOT NULL
  AND last_lng IS NOT NULL;
```

### Debug Webhook

```bash
# Check Stripe webhook logs
stripe logs tail

# Check API logs
tail -f api/logs/combined.log | grep webhook
```

## 🔐 Production Checklist

- [ ] Use production Stripe keys
- [ ] Set webhook endpoint in Stripe Dashboard
- [ ] Configure `PUBLIC_APP_URL`
- [ ] Add authentication to routes
- [ ] Enable rate limiting
- [ ] Monitor webhook delivery
- [ ] Set up alerts for failed payments

## 📞 Support

**Full Documentation:** See `MARKETPLACE_RUNBOOK.md`

**Stripe Dashboard:** https://dashboard.stripe.com

**Test Environment:** https://dashboard.stripe.com/test

---

✨ **Marketplace is ready!** Start with the seed data and test the full flow.
