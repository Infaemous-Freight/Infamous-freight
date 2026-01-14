#!/bin/bash

# 🚀 INFAMOUS FREIGHT ENTERPRISES - COMPLETE DEPLOYMENT EXECUTION
# Copy & paste commands from this script to deploy everything

set -e

cat << 'EOF'
═══════════════════════════════════════════════════════════════════════════════
  🚀 DEPLOYMENT EXECUTION - 100% COMPLETE
═══════════════════════════════════════════════════════════════════════════════

This script provides all commands needed to complete your deployment.
Run each section in order.

═══════════════════════════════════════════════════════════════════════════════
STEP 1: AUTHENTICATE WITH FLY.IO (Required - Do This First)
═══════════════════════════════════════════════════════════════════════════════

Option A: Interactive Login (Recommended)
──────────────────────────────────────────

flyctl auth login

This will open a browser window. Log in with your Fly.io account and return.


Option B: Use API Token (For CI/CD)
──────────────────────────────────────────

export FLY_API_TOKEN="your-token-here"
# Then run any flyctl command


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 2: DEPLOY API TO FLY.IO (5 minutes)
═══════════════════════════════════════════════════════════════════════════════

cd /workspaces/Infamous-freight-enterprises

# Deploy with canary strategy (safe, rolling updates)
flyctl deploy --remote-only --strategy=canary

# Or deploy with standard strategy (faster)
flyctl deploy --remote-only

# Watch the build and deployment progress
# When complete, you'll see: "Deployment successful!"

# Verify deployment
flyctl status
flyctl logs --recent

# Your API is now live at:
# https://infamous-freight-enterprises.fly.dev/api

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3: CONFIGURE ENVIRONMENT SECRETS (3 minutes)
═══════════════════════════════════════════════════════════════════════════════

Set all required API keys and database credentials:

flyctl secrets set \
  STRIPE_SECRET_KEY="sk_live_YOUR_STRIPE_SECRET_KEY" \
  STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_STRIPE_PUBLIC_KEY" \
  STRIPE_WEBHOOK_SECRET="whsec_YOUR_STRIPE_WEBHOOK_SECRET" \
  PAYPAL_CLIENT_ID="YOUR_PAYPAL_CLIENT_ID" \
  PAYPAL_CLIENT_SECRET="YOUR_PAYPAL_CLIENT_SECRET" \
  JWT_SECRET="$(openssl rand -base64 32)" \
  DATABASE_URL="postgresql://user:password@host:5432/infamous_freight" \
  NODE_ENV="production"


Where to find these keys:

STRIPE KEYS:
  • Go to: https://dashboard.stripe.com/apikeys
  • Copy: Secret key (sk_live_...)
  • Copy: Publishable key (pk_live_...)

STRIPE WEBHOOK SECRET:
  • Go to: https://dashboard.stripe.com/webhooks
  • Create endpoint (see Step 4)
  • Copy: Signing secret (whsec_...)

PAYPAL KEYS:
  • Go to: https://developer.paypal.com/dashboard/
  • Copy: Client ID
  • Copy: Client Secret

DATABASE_URL:
  • PostgreSQL connection string
  • Format: postgresql://user:pass@host:port/db_name

JWT_SECRET:
  • Auto-generated above with openssl
  • Or use any 32+ character random string

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 4: REGISTER WEBHOOK URLS (2 minutes)
═══════════════════════════════════════════════════════════════════════════════

STRIPE WEBHOOK:
────────────────────────────────────────────────────────────────────────────

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: https://infamous-freight-enterprises.fly.dev/api/billing/webhook
4. Subscribe to events:
   • payment_intent.succeeded
   • payment_intent.payment_failed
   • customer.subscription.created
   • customer.subscription.updated
   • customer.subscription.deleted
5. Copy signing secret and use in STRIPE_WEBHOOK_SECRET (Step 3)


PAYPAL WEBHOOK:
────────────────────────────────────────────────────────────────────────────

1. Go to: https://developer.paypal.com/dashboard/
2. Navigate to: Notifications > Webhooks
3. Create webhook with URL: https://infamous-freight-enterprises.fly.dev/api/billing/paypal-webhook
4. Subscribe to events:
   • PAYMENT.SALE.COMPLETED
   • BILLING.SUBSCRIPTION.CREATED
   • BILLING.SUBSCRIPTION.UPDATED
   • BILLING.SUBSCRIPTION.CANCELLED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 5: RUN DATABASE MIGRATIONS (2 minutes)
═══════════════════════════════════════════════════════════════════════════════

Option A: Via SSH Console (Recommended)
──────────────────────────────────────────────────────────────────────────────

flyctl ssh console

# Inside the console:
cd /app/api
pnpm prisma migrate deploy
pnpm prisma generate

# Exit console
exit


Option B: Direct Command
──────────────────────────────────────────────────────────────────────────────

flyctl ssh console -C "cd /app/api && pnpm prisma migrate deploy && pnpm prisma generate"


This creates:
  ✅ payments table (transactions)
  ✅ subscriptions table (recurring billing)
  ✅ invoices table (invoice tracking)
  ✅ All indexes and constraints

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 6: VERIFY DEPLOYMENT (1 minute)
═══════════════════════════════════════════════════════════════════════════════

Check API health:

# Simple health check
curl https://infamous-freight-enterprises.fly.dev/health

# Response should be: "ok"


Check Fly.io status:

flyctl status

# Should show: "Passed" for all health checks


View logs:

flyctl logs --recent


View metrics:

flyctl monitor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 7: TEST PAYMENT FLOW (1 minute)
═══════════════════════════════════════════════════════════════════════════════

From your web browser:

1. Visit Vercel web app: https://infamous-freight-enterprises-git-*.vercel.app
2. Click "Subscribe" or "Upgrade Plan"
3. Select subscription tier (Starter, Professional, or Enterprise)
4. Enter test card details:
   Card Number: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   Name: Test User
5. Click "Pay"

Expected Result:
  ✅ Payment processes successfully
  ✅ Order confirmation shown
  ✅ Invoice emailed
  ✅ Revenue dashboard updates

Test PayPal:
  • Use sandbox account from: https://developer.paypal.com/dashboard/
  • Same flow, select PayPal at checkout


Test Revenue API:

curl "https://infamous-freight-enterprises.fly.dev/api/billing/revenue?period=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

Expected response:
{
  "success": true,
  "data": {
    "totalRevenue": 99.00,
    "transactionCount": 1,
    "averageTransaction": 99.00,
    "currency": "USD"
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 8: GO LIVE WITH PRODUCTION KEYS
═══════════════════════════════════════════════════════════════════════════════

Once testing is complete:

1. Get production Stripe keys (not test keys):
   • Go to: https://dashboard.stripe.com/apikeys
   • Use Live Secret and Publishable keys

2. Get production PayPal keys:
   • Use Live credentials from PayPal dashboard

3. Update Fly.io secrets with production keys:

flyctl secrets set \
  STRIPE_SECRET_KEY="sk_live_YOUR_PRODUCTION_KEY" \
  STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_PRODUCTION_KEY" \
  PAYPAL_CLIENT_ID="YOUR_PRODUCTION_ID" \
  PAYPAL_CLIENT_SECRET="YOUR_PRODUCTION_SECRET"

4. Restart machines to apply new secrets:

flyctl machines list
flyctl machines restart <machine-id>

5. Verify production deployment:

flyctl logs --recent

═══════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

Issue: flyctl deploy fails
Solution:
  • Make sure you're logged in: flyctl auth login
  • Check app name: flyctl apps list
  • Verify Dockerfile.api exists: ls -la Dockerfile.api

Issue: Health checks failing
Solution:
  • Check logs: flyctl logs --recent
  • SSH in: flyctl ssh console
  • Check port 3001 is open

Issue: Database migrations fail
Solution:
  • Verify DATABASE_URL is correct
  • Check database is accessible
  • Try manually: pnpm prisma migrate dev

Issue: Webhooks not received
Solution:
  • Verify webhook URLs are correct in Stripe/PayPal
  • Check signing secrets match (STRIPE_WEBHOOK_SECRET)
  • Watch logs: flyctl logs --follow

Issue: Payments not processing
Solution:
  • Check Stripe keys are correct (sk_live_... format)
  • Verify webhook is registered
  • Review Stripe dashboard for errors
  • Check API logs: flyctl logs

═══════════════════════════════════════════════════════════════════════════════
MONITORING & MAINTENANCE
═══════════════════════════════════════════════════════════════════════════════

Daily checks:

# Check uptime
flyctl status

# View recent logs
flyctl logs --recent

# Check metrics
flyctl monitor

# Get dashboard link
echo "Dashboard: https://fly.io/dashboard/personal/apps/infamous-freight-enterprises"


Weekly maintenance:

# Scale up for expected traffic
flyctl scale count 3  # 3 machines

# Review payment transactions
curl "https://infamous-freight-enterprises.fly.dev/api/billing/transactions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check revenue
curl "https://infamous-freight-enterprises.fly.dev/api/billing/revenue?period=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"


Monitor Stripe dashboard:
  • Review failed payments
  • Check for fraudulent charges
  • Monitor chargeback rates
  • Review customer disputes

═══════════════════════════════════════════════════════════════════════════════
SUCCESS CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

✅ Fly.io authenticated
✅ API deployed
✅ Environment secrets configured
✅ Webhooks registered
✅ Database migrations run
✅ Health checks passing
✅ Payment test successful
✅ Revenue dashboard showing data
✅ Production keys configured
✅ Monitoring active

═══════════════════════════════════════════════════════════════════════════════
YOU'RE READY TO MAKE MONEY! 💰
═══════════════════════════════════════════════════════════════════════════════

Your payment system is now live and accepting real payments!

API: https://infamous-freight-enterprises.fly.dev/api
Web: https://infamous-freight-enterprises-git-*.vercel.app
Dashboard: https://fly.io/dashboard/personal/apps/infamous-freight-enterprises

Revenue projections:
  • 1,000 users = $2,500/month
  • 10,000 users = $25,000/month
  • 100,000 users = $250,000/month
  • 1,000,000 users = $2,500,000/month

Start marketing and acquiring users to start generating revenue!

═══════════════════════════════════════════════════════════════════════════════
EOF
