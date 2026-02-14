# Production Deployment Checklist

## Prerequisites ✓
- [ ] Node.js 18+ installed
- [ ] pnpm 8.15.9+ installed
- [ ] PostgreSQL running (local or remote)
- [ ] Stripe account (test mode for staging)
- [ ] SendGrid/email service API key
- [ ] Git repository cloned ✓

## Environment Variables (Set before deploy)
```bash
# API Configuration
export API_PORT=4000
export API_BASE_URL="https://api.infamous-freight.com"
export NODE_ENV=production

# Database
export DATABASE_URL="postgresql://user:pass@host/database"

# Authentication
export JWT_SECRET="your-jwt-secret-key"

# Stripe
export STRIPE_SECRET_KEY="sk_live_..."
export STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Email
export SENDGRID_API_KEY="SG...."

# Monitoring
export SENTRY_DSN="https://..."
```

## Deployment Steps

### 1. Build & Test (5 min)
```bash
cd /workspaces/Infamous-freight-enterprises
pnpm clean
pnpm install
pnpm build
pnpm test
```

### 2. Database Setup (5 min)
```bash
cd apps/api
pnpm prisma:migrate:deploy
pnpm prisma:generate
```

### 3. Stripe Configuration (10 min)
- [ ] Create 4 products in Stripe:
  - Free: $0
  - Pro: $99/mo (metered billing enabled)
  - Enterprise: $999/mo
  - Marketplace: Revenue-share model

### 4. Start Services (2 min)
```bash
# Terminal 1: API
cd apps/api && pnpm start

# Terminal 2: Web
cd apps/web && pnpm start

# Terminal 3: Monitoring
open http://localhost:3000
```

### 5. Verify All Systems (5 min)
- [ ] API responds: curl http://localhost:4000/api/health
- [ ] Web loads: http://localhost:3000
- [ ] Database connected: Check Prisma Studio
- [ ] Stripe configured: Test payment creation
- [ ] Email working: Send test email

### 6. Light Up Monitoring (5 min)
- [ ] Real-time dashboard active
- [ ] Slack alerts configured
- [ ] Email notifications enabled
- [ ] Error tracking (Sentry) active

## Launch Day Final Check
- [ ] All systems online
- [ ] Backups configured
- [ ] Rollback plan tested
- [ ] Team on alert
- [ ] Metrics dashboard live

## Estimated Total Time: 45 minutes
