# 🚀 Marketplace Deployment Checklist

## Pre-Deployment

### 1. Stripe Configuration ⏳

- [ ] Create Stripe account (or use existing)
- [ ] Switch to production mode in Stripe Dashboard
- [ ] Create 3 products in Stripe:
  - [ ] Starter Plan - $29/month
  - [ ] Pro Plan - $99/month
  - [ ] Enterprise Plan - $299/month
- [ ] Copy production price IDs
- [ ] Configure webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
- [ ] Select webhook events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Copy webhook signing secret

### 2. Environment Variables ⏳

```bash
# Production .env
STRIPE_API_SECRET=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
PUBLIC_APP_URL=https://your-production-domain.com

# Pricing (adjust as needed)
PRICE_BASE_USD=6.00
PRICE_PER_MILE_USD=1.85
PRICE_PER_MINUTE_USD=0.20
PRICE_MINIMUM_USD=9.99

# Discounts
DISCOUNT_STARTER_PCT=10
DISCOUNT_PRO_PCT=20
DISCOUNT_ENTERPRISE_PCT=30

# Matching
MATCH_RADIUS_MILES=10
```

### 3. Database Migration ⏳

```bash
cd apps/api
npx prisma migrate deploy
```

### 4. Seed Initial Data (Optional) ⏳

```bash
node prisma/seedMarketplace.js
```

## Security Hardening

### 5. Add Authentication ⏳

Uncomment/add to routes in `apps/api/src/marketplace/router.js`:

```javascript
const { authenticate, requireScope } = require("../middleware/security");

// Example for all routes
router.use(authenticate);

// Or per-route
router.post("/jobs", authenticate, requireScope("shipper:create"), ...);
router.post("/jobs/accept", authenticate, requireScope("driver:accept"), ...);
```

### 6. Rate Limiting ✅

Already configured via global middleware, but consider adding stricter limits:

```javascript
const { limiters } = require("../middleware/security");

router.post("/jobs", limiters.general, ...);
router.post("/jobs/:id/checkout", limiters.billing, ...);
```

### 7. Input Validation ✅

Already implemented via Zod schemas in `validators.js`

## Testing

### 8. Local Testing ⏳

```bash
# Start local server
npm run dev

# In another terminal, forward webhooks
stripe listen --forward-to http://localhost:4000/api/webhooks/stripe

# Test job creation
curl -X POST http://localhost:4000/api/marketplace/jobs \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# Test checkout
curl -X POST http://localhost:4000/api/marketplace/jobs/JOB_ID/checkout

# Trigger test webhook
stripe trigger checkout.session.completed
```

### 9. Staging Testing ⏳

- [ ] Deploy to staging environment
- [ ] Use Stripe test mode
- [ ] Test complete user flows:
  - [ ] Shipper creates job
  - [ ] Shipper pays
  - [ ] Job appears as OPEN
  - [ ] Driver accepts job
  - [ ] Driver delivers
- [ ] Test subscription flows:
  - [ ] Shipper subscribes
  - [ ] Plan discount applied
  - [ ] Portal access works
  - [ ] Plan upgrade/downgrade
  - [ ] Cancellation

## Monitoring Setup

### 10. Stripe Monitoring ⏳

- [ ] Enable email notifications for failed payments
- [ ] Set up webhook delivery monitoring
- [ ] Configure alerts for high error rates
- [ ] Review and adjust retry settings

### 11. Application Monitoring ⏳

- [ ] Sentry error tracking (already integrated)
- [ ] Log aggregation (Winston already configured)
- [ ] Set up alerts for:
  - [ ] Webhook failures
  - [ ] Payment failures
  - [ ] Database errors
  - [ ] High API error rates

### 12. Business Metrics ⏳

Consider tracking:

- [ ] Jobs created per day
- [ ] Jobs completed per day
- [ ] Average delivery price
- [ ] Conversion rate (created → paid)
- [ ] Active drivers
- [ ] Subscription revenue (MRR)
- [ ] Churn rate

## Production Deployment

### 13. Deploy Application ⏳

```bash
# Build
cd apps/api
npm run build  # if applicable

# Deploy (example)
git push production main

# Or container deployment
docker build -t marketplace-api .
docker push your-registry/marketplace-api:latest
```

### 14. Verify Deployment ⏳

```bash
# Health check
curl https://your-domain.com/api/marketplace/health

# Test webhook delivery from Stripe Dashboard
# Send test event and verify logs
```

### 15. Update Webhook Endpoint ⏳

- [ ] In Stripe Dashboard, update webhook URL to production
- [ ] Test webhook delivery with real event
- [ ] Verify webhook secret is correct

## Post-Deployment

### 16. Documentation ⏳

- [ ] Update team wiki with API endpoints
- [ ] Share Stripe Dashboard access with team
- [ ] Document emergency procedures
- [ ] Create runbook for common issues

### 17. Customer Onboarding ⏳

- [ ] Create onboarding materials
- [ ] Test cards documentation for beta users
- [ ] FAQ for common issues
- [ ] Support contact information

### 18. Monitoring Day 1 ⏳

- [ ] Watch logs for errors
- [ ] Monitor Stripe Dashboard for webhook delivery
- [ ] Check database for data integrity
- [ ] Verify first real transactions

## Rollback Plan

### 19. Prepare Rollback ⏳

```bash
# Tag current release
git tag -a v1.0.0-marketplace -m "Marketplace launch"
git push origin v1.0.0-marketplace

# Document rollback procedure
# 1. Revert database migration (if needed)
# 2. Deploy previous version
# 3. Switch Stripe webhook back (if needed)
```

### 20. Emergency Contacts ⏳

- [ ] Stripe support: https://support.stripe.com
- [ ] Database admin contact
- [ ] On-call engineer
- [ ] Product owner

## Performance Tuning

### 21. Database Indexes ✅

Already included in schema:

- `users.email`
- `users.role`
- `jobs.status`
- `jobs.shipperId`
- `jobs.driverId`
- `driver_profiles.userId`
- `vehicles.driverId`
- `job_payments.userId`

### 22. Caching Strategy (Future) 🔲

Consider adding:

- [ ] Redis for active jobs list
- [ ] Cache driver locations (60s TTL)
- [ ] Cache pricing calculation results

### 23. Query Optimization (Future) 🔲

- [ ] Add EXPLAIN ANALYZE for slow queries
- [ ] Consider PostGIS for geospatial queries
- [ ] Paginate job listings
- [ ] Add database connection pooling

## Compliance & Legal

### 24. Terms of Service ⏳

- [ ] Delivery terms and conditions
- [ ] Cancellation policy
- [ ] Refund policy
- [ ] Driver agreement
- [ ] Privacy policy

### 25. Financial Compliance ⏳

- [ ] PCI compliance (handled by Stripe)
- [ ] Tax reporting setup (if applicable)
- [ ] Invoice generation
- [ ] Receipt email templates

## Success Criteria

### Week 1 Goals

- [ ] Zero critical errors
- [ ] 95%+ webhook delivery success
- [ ] All test transactions complete successfully
- [ ] First 10 paying customers onboarded

### Month 1 Goals

- [ ] 99.9% API uptime
- [ ] <200ms median API response time
- [ ] Positive user feedback
- [ ] Feature requests prioritized

## Quick Commands Reference

```bash
# Check logs
tail -f apps/api/logs/combined.log | grep marketplace

# Database queries
psql $DATABASE_URL -c "SELECT COUNT(*) FROM jobs WHERE status='OPEN';"
psql $DATABASE_URL -c "SELECT email, plan_tier FROM users WHERE plan_status='ACTIVE';"

# Stripe CLI
stripe events list --limit 10
stripe customers list --limit 10
stripe subscriptions list --limit 10

# Application restart
pm2 restart api
# or
docker restart marketplace-api
```

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Internal Runbook**: `/api/MARKETPLACE_RUNBOOK.md`
- **Quick Start**: `/MARKETPLACE_QUICK_START.md`
- **Implementation Details**: `/MARKETPLACE_IMPLEMENTATION_COMPLETE.md`

---

## Checklist Status

- ✅ **Done** (already implemented)
- ⏳ **To Do** (requires action before/during deployment)
- 🔲 **Future** (optional enhancement)

**Current Progress**: 7/25 pre-deployment items complete (all code/schema items)

**Remaining**: Configuration, testing, and monitoring setup

---

**Estimated Deployment Time**: 2-4 hours (with Stripe setup)

**Recommended Deployment Window**: Low traffic period, with team on standby

**Success Indicator**: First paid job completes end-to-end successfully

🚀 **Good luck with your launch!**
