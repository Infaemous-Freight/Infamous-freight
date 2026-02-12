# 🚀 Marketplace Phase 2 - Quick Start Guide

## Overview

This guide walks you through running the enhanced DoorDash-style marketplace with all 10 production-ready enhancements implemented.

---

## 1️⃣ Prerequisites

```bash
# Check Node version (should be 18+)
node --version

# Check pnpm version (should be 8.15.9+)
pnpm --version

# Verify PostgreSQL is running (Docker)
docker ps | grep postgres
```

---

## 2️⃣ Environment Setup

```bash
# Create .env file with all required variables
cp apps/api/.env.example apps/api/.env

# Edit with your values:
# - JWT_SECRET: Use a strong random string
# - DATABASE_URL: postgres://user:password@localhost:5432/marketplace
# - STRIPE_SECRET_KEY: Your Stripe test key
# - STRIPE_WEBHOOK_SECRET: From Stripe webhook endpoint
```

**Minimal Configuration:**

```bash
cat > apps/api/.env << 'EOF'
API_PORT=4000
JWT_SECRET=dev-secret-change-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/marketplace
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRICE_PER_MILE=1.50
STRIPE_PRICE_PER_MINUTE=0.25
STRIPE_PRICE_BASE=5.00
PUBLIC_APP_URL=http://localhost:3000
AI_PROVIDER=synthetic
LOG_LEVEL=info
EOF
```

---

## 3️⃣ Database Setup

```bash
# Start PostgreSQL in Docker
docker-compose up -d postgres

# Wait for database to be ready (30s)
sleep 30

# Run database migrations
cd apps/api
pnpm prisma:migrate:dev --name "initial_marketplace"

# (Optional) Seed with sample data
pnpm prisma:db:seed

# Verify schema
pnpm prisma:generate
```

---

## 4️⃣ Start Services

### Terminal 1: API Server

```bash
cd apps/api
pnpm dev
# Output: API running on http://localhost:4000

# Verify health check
curl http://localhost:4000/api/health
# Output: {"uptime": ..., "status": "ok", "database": "connected"}
```

### Terminal 2: Web Frontend (Optional)

```bash
cd apps/web
pnpm dev
# Output: Web running on http://localhost:3000
```

---

## 5️⃣ Generate Test JWT Tokens

```bash
# Create helper script to generate tokens
cat > generate-jwt.js << 'EOF'
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';

const shipper = {
  sub: 'shipper-user-123',
  email: 'shipper@example.com',
  name: 'Test Shipper',
  role: 'SHIPPER',
  scopes: ['shipper:create', 'shipper:checkout', 'shipper:subscribe', 'shipper:portal']
};

const driver = {
  sub: 'driver-user-456',
  email: 'driver@example.com',
  name: 'Test Driver',
  role: 'DRIVER',
  scopes: ['driver:location', 'driver:vehicle', 'driver:view', 'driver:accept', 'driver:deliver']
};

console.log('SHIPPER_JWT=', jwt.sign(shipper, secret, { expiresIn: '24h' }));
console.log('DRIVER_JWT=', jwt.sign(driver, secret, { expiresIn: '24h' }));
EOF

# Run to generate tokens
node generate-jwt.js

# Save as environment variables for testing
export SHIPPER_JWT="eyJhbGc..." # Copy from output above
export DRIVER_JWT="eyJhbGc..."  # Copy from output above
```

---

## 6️⃣ Test Core Features

### Test 1: Authentication

```bash
# Without token - should fail
curl http://localhost:4000/api/marketplace/jobs

# Output: {"error": "Missing bearer token"}

# With token - should work
curl http://localhost:4000/api/marketplace/jobs \
  -H "Authorization: Bearer $DRIVER_JWT"

# Output: {"ok": true, "jobs": [], "pagination": {...}}
```

### Test 2: Create Job (Shipper)

```bash
curl -X POST http://localhost:4000/api/marketplace/jobs \
  -H "Authorization: Bearer $SHIPPER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "shipperId": "shipper-user-123",
    "pickupAddress": "123 Main St, LA",
    "pickupLat": 34.0522,
    "pickupLng": -118.2437,
    "dropoffAddress": "456 Broadway, LA",
    "dropoffLat": 34.0589,
    "dropoffLng": -118.2359,
    "requiredVehicle": "VAN",
    "weightLbs": 500,
    "volumeCuFt": 50,
    "estimatedMiles": 5.2,
    "estimatedMinutes": 25
  }'

# Save the returned jobId for next tests
export JOB_ID="job-abc123"
```

### Test 3: List Jobs with Pagination

```bash
# Default: 20 items per page
curl "http://localhost:4000/api/marketplace/jobs" \
  -H "Authorization: Bearer $DRIVER_JWT"

# Custom pagination
curl "http://localhost:4000/api/marketplace/jobs?page=1&limit=10" \
  -H "Authorization: Bearer $DRIVER_JWT"

# Filter by location (near driver)
curl "http://localhost:4000/api/marketplace/jobs?lat=34.0522&lng=-118.2437&maxMiles=10" \
  -H "Authorization: Bearer $DRIVER_JWT"

# Response includes:
# {
#   "ok": true,
#   "jobs": [...],
#   "pagination": {
#     "page": 1,
#     "limit": 10,
#     "total": 150,
#     "pages": 15
#   }
# }
```

### Test 4: Accept Job (Driver)

```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/accept \
  -H "Authorization: Bearer $DRIVER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "'$JOB_ID'",
    "driverUserId": "driver-user-456"
  }'

# Response: {"ok": true, "job": {..., "status": "ACCEPTED"}}
```

### Test 5: Checkout with Idempotency

```bash
# First request
curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_ID/checkout \
  -H "Authorization: Bearer $SHIPPER_JWT" \
  -H "Idempotency-Key: checkout-job-$JOB_ID-20260115" \
  -H "Content-Type: application/json"

# Response includes Stripe session URL

# Send same request again - should return same session ID
curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_ID/checkout \
  -H "Authorization: Bearer $SHIPPER_JWT" \
  -H "Idempotency-Key: checkout-job-$JOB_ID-20260115" \
  -H "Content-Type: application/json"

# Same response = idempotency working ✅
```

### Test 6: Mark Delivered (Driver)

```bash
curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_ID/delivered \
  -H "Authorization: Bearer $DRIVER_JWT" \
  -H "Content-Type: application/json"

# Response: {"ok": true, "job": {..., "status": "DELIVERED"}}
```

### Test 7: Subscribe to Plan (Shipper)

```bash
curl -X POST http://localhost:4000/api/marketplace/subscribe \
  -H "Authorization: Bearer $SHIPPER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "shipper-user-123",
    "planTier": "PRO",
    "paymentMethodId": "pm_test_visa"
  }'

# Response includes Stripe subscription ID
```

### Test 8: Access Customer Portal (Self-only)

```bash
# Own portal - should work
curl http://localhost:4000/api/marketplace/portal \
  -H "Authorization: Bearer $SHIPPER_JWT"

# Different user's portal - should fail with 403
curl "http://localhost:4000/api/marketplace/portal?userId=shipper-user-999" \
  -H "Authorization: Bearer $SHIPPER_JWT"

# Output: {"error": "Forbidden", "message": "You do not have access to this resource"}
```

### Test 9: Test Rate Limiting

```bash
# Make 35 rapid requests (limit is 100 per 15 min, so you'll hit it eventually)
for i in {1..35}; do
  curl "http://localhost:4000/api/marketplace/jobs?page=1" \
    -H "Authorization: Bearer $DRIVER_JWT" &
done

# Eventually: {"error": "Too many requests. Please try again later."}
```

### Test 10: Test Price Protection

```bash
# Create job
curl -X POST http://localhost:4000/api/marketplace/jobs \
  -H "Authorization: Bearer $SHIPPER_JWT" \
  -H "Content-Type: application/json" \
  -d '{...}'  # Save jobId

# Manually change price in database (simulate plan upgrade discount)
sqlite3 dev.db "UPDATE jobs SET priceUsd = 2.00 WHERE id = '$JOB_ID';"

# Try to checkout - should fail with price mismatch
curl -X POST http://localhost:4000/api/marketplace/jobs/$JOB_ID/checkout \
  -H "Authorization: Bearer $SHIPPER_JWT"

# Output: {
#   "error": "Price has changed since job creation",
#   "oldPrice": 12.50,
#   "newPrice": 10.00
# }
```

---

## 7️⃣ Test Webhook Handling

### Setup Stripe Webhook Testing

```bash
# Install Stripe CLI (macOS example)
brew install stripe/stripe-cli/stripe

# Login to Stripe account
stripe login

# Forward webhook events to your local API
stripe listen --forward-to localhost:4000/webhook/stripe

# Save the webhook signing secret
export STRIPE_WEBHOOK_SECRET="whsec_test_..."
```

### Trigger Test Events

```bash
# In another terminal, trigger a test event
stripe trigger payment_intent.succeeded

# Check your API logs for:
# INFO: Webhook received | event: checkout.session.completed
# INFO: Processing webhook | correlationId: abc-123
# INFO: Webhook processed successfully | event: checkout.session.completed
```

---

## 8️⃣ Monitor Logs

```bash
# Real-time log watching
tail -f apps/api/combined.log | grep -E "correlation|error|webhook"

# Filter by correlation ID
grep "correlationId: abc-123" apps/api/combined.log

# Check for retry attempts
grep "Webhook retry attempt" apps/api/combined.log

# Monitor state transitions
grep "validateTransition" apps/api/combined.log
```

---

## 9️⃣ Performance Testing

```bash
# Install autocannon (load testing tool)
npm install -g autocannon

# Load test the job listing endpoint (pagination)
autocannon -c 10 -d 30 \
  -H "Authorization: Bearer $DRIVER_JWT" \
  http://localhost:4000/api/marketplace/jobs

# Expected: >1000 req/s with <100ms latency

# Load test job acceptance (transactions)
autocannon -c 5 -d 30 \
  -M POST \
  -H "Authorization: Bearer $DRIVER_JWT" \
  http://localhost:4000/api/marketplace/jobs/accept
```

---

## 🔟 Troubleshooting

### "Missing bearer token" Error

```bash
# Forgot to add authorization header?
# ❌ curl http://localhost:4000/api/marketplace/jobs
# ✅ curl http://localhost:4000/api/marketplace/jobs -H "Authorization: Bearer $JWT"
```

### "Invalid or expired token" Error

```bash
# Token expired or invalid signature?
# Regenerate with: node generate-jwt.js
# Make sure JWT_SECRET matches in .env
```

### "Price has changed since job creation" Error

```bash
# Price mismatch between job creation and checkout?
# This is working as designed! Create a new job instead.
# Or verify no plan/pricing changes between operations.
```

### "Job not available" Error (attempting accept)

```bash
# Another driver already accepted the job!
# This is working as designed (transaction safety).
# Pick a different job or wait for new jobs.
```

### Webhook "rate limited" Message

```bash
# Too many webhook events?
# Stripe retries automatically with exponential backoff.
# Check logs for `Webhook retry attempt` messages.
# If persistent, check `withRetry()` logic in webhooks.js
```

### Database Connection Error

```bash
# Postgres not running?
docker-compose up -d postgres

# Wrong DATABASE_URL?
# Should be: postgresql://user:password@localhost:5432/marketplace
# Check apps/api/.env file

# Migration not run?
cd apps/api && pnpm prisma:migrate:deploy
```

---

## 📊 Monitoring Dashboard Commands

```bash
# Count total jobs
psql postgresql://user:password@localhost:5432/marketplace -c "SELECT COUNT(*) FROM jobs;"

# Check job statuses
psql postgresql://user:password@localhost:5432/marketplace -c "SELECT status, COUNT(*) FROM jobs GROUP BY status;"

# Monitor webhook events (recent)
tail -100 apps/api/combined.log | grep webhook

# Check error rate
grep ERROR apps/api/combined.log | wc -l

# Monitor authentication successes/failures
grep "Authentication" apps/api/combined.log | tail -20

# Track webhook retries
grep "retry attempt" apps/api/combined.log
```

---

## ✅ Verification Checklist

After running tests above, verify:

- [ ] Health check returns `{"status": "ok", "database": "connected"}`
- [ ] Authentication required for all marketplace endpoints
- [ ] Jobs list includes pagination metadata (page, limit, total, pages)
- [ ] Job acceptance prevents double-acceptance (race condition safe)
- [ ] Checkout with same idempotency key returns same session
- [ ] Price mismatch detected and rejected
- [ ] Portal access limited to self
- [ ] Rate limiting kicks in at ~100 req/15min
- [ ] Webhooks logged with correlationId
- [ ] State transitions validated (can't go invalid paths)
- [ ] Logs show no errors or warnings

---

## 🎓 What You've Deployed

You now have a production-ready marketplace with:

1. ✅ **Authentication** - All routes require JWT tokens
2. ✅ **Scope-based Authorization** - Role-based access control
3. ✅ **Rate Limiting** - Protection against abuse
4. ✅ **Pagination** - Efficient data retrieval
5. ✅ **Transactions** - Race condition prevention
6. ✅ **Retry Logic** - Resilience to failures
7. ✅ **Idempotency** - Safe duplicate requests
8. ✅ **State Machine** - Invalid state prevention
9. ✅ **Price Protection** - Prevents stale checkout
10. ✅ **Webhook Deduplication** - Prevents duplicate processing

---

## 🚀 Next Steps

1. **Testing**: Run comprehensive test suite
2. **Monitoring**: Set up error tracking (Sentry)
3. **Production**: Deploy to staging environment
4. **Documentation**: Share API docs with frontend team
5. **Security**: Enable HTTPS and set strong JWT_SECRET

---

## 📞 Support

Issues? Check:

- [MARKETPLACE_ENHANCEMENTS_COMPLETE.md](MARKETPLACE_ENHANCEMENTS_COMPLETE.md) - Feature documentation
- [PHASE_2_DEPLOYMENT_VERIFICATION.md](PHASE_2_DEPLOYMENT_VERIFICATION.md) - Deployment checklist
- [MARKETPLACE_QUICK_START.md](MARKETPLACE_QUICK_START.md) - Initial setup guide

Happy testing! 🎉
