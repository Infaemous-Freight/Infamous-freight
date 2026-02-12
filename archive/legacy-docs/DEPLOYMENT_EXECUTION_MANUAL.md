# 🚀 DEPLOYMENT EXECUTION GUIDE

# Complete manual for deploying Infæmous Freight to production

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Provisioning](#database-provisioning)
4. [Secret Configuration](#secret-configuration)
5. [Service Deployment](#service-deployment)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh

# Install Vercel CLI
pnpm add -g vercel@latest

# Install Expo CLI
npm install -g eas-cli

# Install GitHub CLI (optional, for secrets)
brew install gh  # macOS
```

### Required Accounts

- [ ] Fly.io account (https://fly.io/app/sign-up)
- [ ] Vercel account (https://vercel.com/signup)
- [ ] Expo account (https://expo.dev/signup)
- [ ] GitHub account (with repository access)

### Required Credentials

- [ ] OpenAI API key (https://platform.openai.com/api-keys)
- [ ] Stripe API key (https://dashboard.stripe.com/apikeys)
- [ ] PayPal credentials (https://developer.paypal.com/)
- [ ] Sentry DSN (https://sentry.io/organizations/.../projects/)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/MrMiless44/Infamous-freight-enterprises.git
cd Infamous-freight-enterprises
```

### 2. Create Environment Files

```bash
# Copy example environment files
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### 3. Required Environment Variables

#### API (.env.local)

```env
NODE_ENV=production
API_PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/infamous_freight
JWT_SECRET=<generate with: openssl rand -base64 32>
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_CLIENT_SECRET=...
SENTRY_DSN=https://...@sentry.io/...
REDIS_URL=redis://:password@host:6379
CORS_ORIGINS=https://infamous-freight-enterprises.vercel.app
```

#### Web (.env.local)

```env
NEXT_PUBLIC_API_URL=https://infamous-freight-api.fly.dev
NEXT_PUBLIC_ENV=production
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_DD_APP_ID=... (optional, Datadog)
NEXT_PUBLIC_DD_CLIENT_TOKEN=... (optional, Datadog)
```

---

## Database Provisioning

### Option A: Fly.io Postgres (Recommended)

```bash
# Create Postgres instance
flyctl postgres create \
  --name infamous-freight-db \
  --region dfw \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --volume-size 10

# Attach to API app
flyctl postgres attach infamous-freight-db \
  --app infamous-freight-api

# Run migrations
flyctl ssh console --app infamous-freight-api \
  -C "cd /app && npx prisma migrate deploy"

# Verify connection
flyctl ssh console --app infamous-freight-api \
  -C "psql \$DATABASE_URL -c 'SELECT 1'"
```

### Option B: Supabase (Managed)

1. Go to https://supabase.com/dashboard
2. Create new project: "infamous-freight"
3. Copy connection string from Settings → Database
4. Set as `DATABASE_URL` secret (see next section)

### Option C: Railway (Budget)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Add Postgres
railway add postgresql

# Get connection string
railway variables
```

---

## Secret Configuration

### Fly.io Secrets (API)

```bash
# Navigate to project root
cd /workspaces/Infamous-freight-enterprises

# Set secrets
flyctl secrets set \
  JWT_SECRET="$(openssl rand -base64 32)" \
  DATABASE_URL="postgresql://user:pass@host:5432/db" \
  OPENAI_API_KEY="sk-..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  PAYPAL_CLIENT_SECRET="..." \
  SENTRY_DSN="https://...@sentry.io/..." \
  REDIS_URL="redis://:pass@host:6379" \
  --app infamous-freight-api

# Verify secrets (will show names only)
flyctl secrets list --app infamous-freight-api
```

### Vercel Secrets (Web)

```bash
# Navigate to web app
cd apps/web

# Add production secrets
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://infamous-freight-api.fly.dev

vercel env add SENTRY_DSN production
# Enter: https://...@sentry.io/...

# Or use CLI with echo
echo "https://infamous-freight-api.fly.dev" | vercel env add NEXT_PUBLIC_API_URL production

# Verify
vercel env ls
```

### GitHub Secrets (CI/CD)

```bash
# Using GitHub CLI
gh secret set FLY_API_TOKEN --body "$(flyctl auth token)"
gh secret set VERCEL_TOKEN --body "$(cat ~/.vercel/token)"
gh secret set EXPO_TOKEN --body "..."

# Or manually via GitHub UI:
# Settings → Secrets and variables → Actions → New repository secret
```

---

## Service Deployment

### 1. Deploy API to Fly.io

```bash
# From project root
cd /workspaces/Infamous-freight-enterprises

# Login to Fly.io
flyctl auth login

# Create app (if not exists)
flyctl apps create infamous-freight-api --org personal

# Deploy
flyctl deploy --config fly.toml

# Check status
flyctl status --app infamous-freight-api

# View logs
flyctl logs --app infamous-freight-api
```

### 2. Deploy Web to Vercel

```bash
# Navigate to web app
cd apps/web

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Or link and deploy
vercel link
vercel --prod

# Check deployment
vercel ls
```

### 3. Deploy Mobile to Expo EAS

```bash
# Navigate to mobile app
cd apps/mobile

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS and Android
eas build --platform all --profile production

# Submit to app stores (optional)
eas submit --platform ios
eas submit --platform android

# Check build status
eas build:list
```

---

## Verification

### 1. Health Check Script

```bash
# Run automated health check
./scripts/check-deployments.sh
```

Expected output:

```
✅ Web is live - https://infamous-freight-enterprises.vercel.app (HTTP 200)
✅ API is live - https://infamous-freight-api.fly.dev/api/health (HTTP 200)
✅ Mobile project is live - https://expo.dev/@infamous-freight/mobile
🎯 Summary: All services operational (3/3)
```

### 2. Manual Verification

**API Health:**

```bash
curl https://infamous-freight-api.fly.dev/api/health
```

Expected:

```json
{
  "status": "ok",
  "uptime": 123.45,
  "database": "connected",
  "timestamp": 1704153600000
}
```

**Web Homepage:**

```bash
curl -I https://infamous-freight-enterprises.vercel.app
```

Expected: `HTTP/2 200`

**API Authenticated Endpoint:**

```bash
# Get JWT token first (login endpoint)
TOKEN="eyJhbGc..."

curl -H "Authorization: Bearer $TOKEN" \
  https://infamous-freight-api.fly.dev/api/shipments
```

### 3. Load Testing

```bash
# Install k6
brew install k6  # macOS

# Run load test
k6 run tests/load/api-load.js
```

Expected:

- ✅ P95 response time < 500ms
- ✅ Error rate < 1%
- ✅ All health checks passing

---

## Troubleshooting

### Issue: API Health Check Returns 500

**Symptoms:**

```bash
curl https://infamous-freight-api.fly.dev/api/health
# Returns: {"error": "Internal Server Error"}
```

**Diagnosis:**

```bash
# Check logs
flyctl logs --app infamous-freight-api

# Common causes:
# 1. Database connection failed
# 2. Missing environment variables
# 3. Prisma client not generated
```

**Solution:**

```bash
# SSH into container
flyctl ssh console --app infamous-freight-api

# Check environment
env | grep DATABASE_URL

# Test database connection
psql $DATABASE_URL -c 'SELECT 1'

# Regenerate Prisma client
npx prisma generate

# Restart app
flyctl apps restart infamous-freight-api
```

---

### Issue: Web App Returns 404

**Symptoms:**

- Homepage loads but returns 404

**Solution:**

```bash
# Check Vercel deployment
vercel logs

# Redeploy
cd apps/web
vercel --prod --force

# Check environment variables
vercel env ls
```

---

### Issue: Database Connection Timeout

**Symptoms:**

```
Error: P1001: Can't reach database server at `...`
```

**Solution:**

```bash
# Check database is running
flyctl postgres list

# Check connection string format
# Should be: postgresql://user:pass@host:5432/db?sslmode=require

# Test connection from local machine
psql "postgresql://user:pass@host:5432/db" -c 'SELECT 1'

# Check firewall rules (Fly.io shouldn't have this issue)
```

---

### Issue: Rate Limiting on CI/CD

**Symptoms:**

- GitHub Actions failing with "Too Many Requests"

**Solution:**

```bash
# Add delays between deployments in workflow
# Or deploy services sequentially instead of parallel

# Check rate limit status
curl -H "Authorization: Bearer $FLY_API_TOKEN" \
  https://api.fly.io/graphql
```

---

### Issue: Out of Memory on Fly.io

**Symptoms:**

```
Error: Container was OOM killed
```

**Solution:**

```bash
# Increase VM memory
flyctl scale memory 2048 --app infamous-freight-api

# Or upgrade VM type
flyctl scale vm shared-cpu-2x --app infamous-freight-api

# Check current resources
flyctl scale show --app infamous-freight-api
```

---

## Post-Deployment Checklist

- [ ] All 3 services returning HTTP 200
- [ ] Database migrations applied
- [ ] SSL certificates valid (auto-managed by Fly/Vercel)
- [ ] Environment variables configured
- [ ] Sentry receiving events
- [ ] Logs being collected
- [ ] Rate limits tested
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] Team has access to dashboards

---

## Rollback Procedures

### Rollback API (Fly.io)

```bash
# List releases
flyctl releases --app infamous-freight-api

# Rollback to previous
flyctl releases rollback <version> --app infamous-freight-api

# Example:
flyctl releases rollback v42 --app infamous-freight-api
```

### Rollback Web (Vercel)

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>

# Or via dashboard:
# https://vercel.com/[team]/[project]/deployments
```

### Rollback Mobile (Expo)

```bash
# Publish previous version via OTA
eas update --branch production --message "Rollback to stable"

# Or rebuild
eas build --platform all --profile production
```

---

## Monitoring & Alerts

### Set Up Uptime Monitoring

1. **UptimeRobot** (Free):
   - Go to https://uptimerobot.com
   - Add monitors:
     - `https://infamous-freight-api.fly.dev/api/health` (5 min interval)
     - `https://infamous-freight-enterprises.vercel.app` (5 min interval)
   - Configure alerts (email, SMS, Slack)

2. **Better Stack** (Paid):
   ```bash
   # Install agent
   curl -sSL https://betterstack.com/install.sh | sh
   ```

### Application Performance Monitoring

**Datadog (Recommended):**

```bash
# Add to API server.ts
require('dd-trace').init({
  service: 'infamous-freight-api',
  env: 'production',
  profiling: true,
});

# Set secrets
flyctl secrets set \
  DD_API_KEY="..." \
  DD_SITE="datadoghq.com" \
  --app infamous-freight-api
```

---

## Success Metrics

Track these weekly:

| Metric        | Target  | Check              |
| ------------- | ------- | ------------------ |
| Uptime        | 99.9%   | UptimeRobot        |
| API P95       | < 500ms | Datadog            |
| Error Rate    | < 0.1%  | Sentry             |
| Test Coverage | > 90%   | Codecov            |
| Monthly Cost  | < $100  | Billing dashboards |

---

## Support & Resources

- **Fly.io Docs**: https://fly.io/docs
- **Vercel Docs**: https://vercel.com/docs
- **Expo Docs**: https://docs.expo.dev
- **Project Docs**: See [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

## Changelog

- **2026-01-01**: Initial deployment guide created
- **Future**: Add auto-scaling, multi-region deployment

---

**Questions?** Open an issue or check existing documentation in `/docs`.
