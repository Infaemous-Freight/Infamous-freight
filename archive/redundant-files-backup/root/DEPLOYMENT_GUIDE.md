# DEPLOYMENT GUIDE - INFAMOUS FREIGHT PLATFORM

**Generated**: Feb 14, 2025 **Version**: 1.0.0 **For**: Netlify (Web), Fly.io
(API), EAS (Mobile)

---

## 🚀 QUICK START (5 MINUTES)

### 1. Local Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add:
# - API_PORT=4000
# - DATABASE_URL=postgresql://...
# - DAT_USERNAME, DAT_PASSWORD, DAT_CUSTOMER_KEY
# - TRUCKSTOP_API_KEY
# - CONVOY_API_KEY

# Start all services
pnpm dev

# Or individually:
cd apps/api && pnpm dev        # API on :4000
cd apps/web && pnpm dev        # Web on :3000
cd apps/mobile && pnpm start   # Mobile with Expo
```

### 2. Database Setup

```bash
# Create and run migrations
cd apps/api
npx prisma migrate dev

# Open Prisma studio (optional)
npx prisma studio
```

### 3. Test the Platform

- **Mobile**: Scan Expo QR code on your phone
- **Web (Shipper)**: http://localhost:3000/shipper/dashboard
- **API**: http://localhost:4000/api/health
- **API Docs**: http://localhost:4000/api/docs

---

## 🔧 PRODUCTION DEPLOYMENT

### Option 1: Fly.io (API)

#### Prerequisites

```bash
npm i -g flyctl
flyctl auth login
```

#### Deploy API

```bash
# From project root
flyctl apps create infamous-freight-api-prod
flyctl deploy --config fly.api.toml --regions ord

# Set secrets
flyctl secrets set \
  DATABASE_URL="postgresql://user:pass@host/db" \
  DAT_USERNAME="your_username" \
  DAT_PASSWORD="your_password" \
  DAT_CUSTOMER_KEY="your_key" \
  TRUCKSTOP_API_KEY="your_key" \
  CONVOY_API_KEY="your_key" \
  AUTH_SECRET="your_secret" \
  SENTRY_DSN="your_sentry_dsn"

# Monitor deployment
flyctl status
flyctl logs
```

#### Health Check

```bash
curl https://infamous-freight-api-prod.fly.dev/api/health
```

---

### Option 2: Netlify (Web)

#### Prerequisites

```bash
npm i -g netlify-cli
netlify login
```

#### Deploy Shipper Portal

```bash
# From apps/web directory
cd apps/web
npm run build

# Deploy
netlify deploy --prod --dir=.next

# Or connect repository for auto-deploys
# - Connect GitHub repo to Netlify
# - Add environment variables in Netlify UI
# - Set build command: pnpm build
# - Set publish directory: .next/standalone
```

#### Environment Variables (Set in Netlify UI)

```
NEXT_PUBLIC_API_BASE_URL=https://infamous-freight-api-prod.fly.dev
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_DD_APP_ID=xxx
NEXT_PUBLIC_DD_CLIENT_TOKEN=xxx
NEXT_PUBLIC_DD_SITE=datadoghq.com
```

---

### Option 3: EAS (Mobile App)

#### Prerequisites

```bash
# Install EAS CLI
npm i -g eas-cli

# Authenticate with Expo
eas login
```

#### Build App

```bash
cd apps/mobile

# Configure for production
eas build --platform all --profile production

# Build APK (Android) or IPA (iOS)
eas build --platform android --profile production
eas build --platform ios --profile production
```

#### Submit to App Stores

```bash
# Android
eas submit --platform android --latest

# iOS
eas submit --platform ios --latest
```

---

## 📋 ENVIRONMENT VARIABLES CHECKLIST

### API (.env in apps/api/)

```bash
# Server
NODE_ENV=production
API_PORT=4000
API_HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Load Board APIs
DAT_USERNAME=your_username
DAT_PASSWORD=your_password
DAT_CUSTOMER_KEY=your_customer_key
TRUCKSTOP_API_KEY=your_api_key
CONVOY_API_KEY=your_api_key

# Authentication
AUTH_SECRET=your_secret_key_min_32_chars
JWT_EXPIRATION=24h

# Security
CORS_ORIGINS=https://shipper.infamous-freight.com,https://web.infamous-freight.com
SENTRY_DSN=https://xxx@sentry.io/project
LOG_LEVEL=info

# Features
MARKETPLACE_ENABLED=true
FEATURE_GET_TRUCKN=true
BULLBOARD_ENABLED=true

# Monitoring
DD_TRACE_ENABLED=false
DD_SERVICE=infamous-freight-api
DD_ENV=production
```

### Web (.env.local in apps/web/)

```bash
# API
NEXT_PUBLIC_API_BASE_URL=https://api.infamous-freight.com

# Environment
NEXT_PUBLIC_ENV=production

# Monitoring
NEXT_PUBLIC_DD_APP_ID=xxxxx
NEXT_PUBLIC_DD_CLIENT_TOKEN=xxxxx
NEXT_PUBLIC_DD_SITE=datadoghq.com
```

### Mobile (.env in apps/mobile/)

```bash
# API
EXPO_PUBLIC_API_BASE_URL=https://api.infamous-freight.com

# Features
EXPO_PUBLIC_ENABLE_OFFLINE=true
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=true

# Analytics
EXPO_PUBLIC_SEGMENT_WRITE_KEY=xxxxx
```

---

## 📊 DEPLOYMENT CHECKLIST

- [ ] **Database**
  - [ ] PostgreSQL 14+ running
  - [ ] Migrations applied: `npx prisma migrate deploy`
  - [ ] Backups configured
  - [ ] Connection pooling enabled

- [ ] **API (Fly.io)**
  - [ ] Fly app created
  - [ ] Secrets configured
  - [ ] Health endpoint responds
  - [ ] Load board services polling
  - [ ] Sentry error tracking active
  - [ ] Rate limits working

- [ ] **Web (Netlify)**
  - [ ] Site deployed
  - [ ] Environment variables set
  - [ ] Build succeeds
  - [ ] Shipper dashboard accessible
  - [ ] Load posting form works
  - [ ] API calls succeed

- [ ] **Mobile (EAS)**
  - [ ] Build succeeds
  - [ ] App installs on test device
  - [ ] All 4 screens render
  - [ ] API calls work
  - [ ] GPS permission granted

- [ ] **Monitoring**
  - [ ] Sentry errors being captured
  - [ ] Datadog APM enabled (optional)
  - [ ] CloudWatch logs streaming
  - [ ] Uptime monitoring active
  - [ ] Alerting configured

- [ ] **Security**
  - [ ] SSL/TLS certificates installed
  - [ ] CORS properly configured
  - [ ] Rate limiting active
  - [ ] JWT secrets rotated
  - [ ] API keys not in logs
  - [ ] Database encrypted

- [ ] **Performance**
  - [ ] API response time < 500ms
  - [ ] Web Lighthouse score > 80
  - [ ] Mobile cold start < 3s
  - [ ] Load search completes < 2s

---

## 🔍 MONITORING & DEBUGGING

### API Health CheckService

```bash
# Check API status
curl https://api.infamous-freight.com/api/health

# Expected response:
{
  "uptime": 12345,
  "timestamp": 1707900000000,
  "status": "ok",
  "database": "connected"
}
```

### View Logs

```bash
# Fly.io
flyctl logs
flyctl logs --app infamous-freight-api-prod

# Netlify
netlify logs:functions

# Mobile (via Expo)
eas logs --platform android --latest
```

### Database Debugging

```bash
# Connect to production database
psql $DATABASE_URL

# View load board data
SELECT * FROM jobs LIMIT 10;
SELECT COUNT(*) FROM job_offers;

# Check recent errors
SELECT * FROM org_audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### API Metrics Dashboard

```
POST /api/status
# Returns queue status, worker heartbeat, etc
```

---

## 🚨 TROUBLESHOOTING

### API Not Starting

```bash
# Check environment
echo $DATABASE_URL
echo $DAT_USERNAME

# Check logs
cd apps/api
pnpm dev --log-level=debug

# Common issues:
# - DATABASE_URL not set: Set in .env
# - Port already in use: Change API_PORT
# - Migrations not applied: Run npx prisma migrate dev
```

### Mobile App Can't Reach API

```bash
# 1. Check EXPO_PUBLIC_API_BASE_URL in .env
# 2. Verify API is running: curl <API_URL>/api/health
# 3. Check CORS settings in apps/api/.env
# 4. Check phone is on same network (local) or has internet
```

### Shipper Portal 404

```bash
# 1. Verify file exists at apps/web/pages/shipper/dashboard.tsx
# 2. Clear Next.js cache: rm -rf .next
# 3. Rebuild: npm run build
# 4. Check environment: NEXT_PUBLIC_API_BASE_URL set?
```

### Load Board API Errors

```bash
# 1. Check API credentials
cat apps/api/.env | grep DAT

# 2. Test DAT connection:
curl -X POST https://api.datco.com/v1/auth/login \
  -d "username=$DAT_USERNAME&password=$DAT_PASSWORD"

# 3. Check rate limits: See /api/loads/stats/summary

# 4. Fallback to mock data working?
curl http://localhost:4000/api/loads/search
```

---

## 📈 SCALING CONSIDERATIONS

As traffic grows:

1. **Database**
   - Move to managed PostgreSQL (AWS RDS, Azure Database)
   - Enable read replicas
   - Add caching layer (Redis)

2. **API**
   - Increase Fly.io machine count
   - Enable auto-scaling
   - Move load board syncing to background worker

3. **Web**
   - Enable Netlify edge functions
   - Add CDN for static assets
   - Cache Shipper Portal pages

4. **Mobile**
   - Monitor app size (limit to <50MB)
   - Implement lazy loading for screens
   - Add feature flags for gradual rollout

5. **Load Boards**
   - Cache load search results
   - Rate limit client-side
   - Prioritize DAT over others

---

## 🔒 SECURITY CHECKLIST

- [ ] **Secrets Management**
  - Use managed secrets (not in repo)
  - Rotate keys quarterly
  - Audit secret access

- [ ] **Network**
  - Enable firewall rules
  - Whitelist known IPs
  - Use VPN for database access

- [ ] **Data Protection**
  - Enable database encryption at rest
  - Enable TLS for all connections
  - Implement column-level encryption for PII

- [ ] **Access Control**
  - Principle of least privilege
  - Multi-factor authentication for admin
  - Regular access audits

- [ ] **Compliance**
  - GDPR data deletion working
  - PCI DSS compliance for payments
  - SOC 2 audit ready
  - Privacy policy published

---

## 📞 RUNBOOK FOR COMMON TASKS

### Deploying a New Feature

```bash
# 1. Merge PR to main
# 2. Pull latest
git pull origin main

# 3. Update API .env if needed
# 4. Rebuild and test locally
pnpm dev

# 5. Deploy to staging first
cd apps/api
flyctl deploy --config fly.staging.toml

# 6. Verify staging works
curl https://famous-freight-api-staging.fly.dev/api/health

# 7. Deploy to production
flyctl deploy --config fly.api.toml

# 8. Monitor for errors
flyctl logs -n 50
```

### Rolling Back a Deployment

```bash
# View deployment history
flyctl history

# Rollback to previous version
flyctl releases rollback
```

### Database Migration

```bash
# Create migration
cd apps/api
npx prisma migrate dev --name "description"

# Review generated SQL
cat prisma/migrations/*/migration.sql

# Deploy to production
npx prisma migrate deploy --environment-production
```

### Manual Database Backup

```bash
# Connect to production
psql $DATABASE_URL PRODUCTION_URL

# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify
psql < backup_20250214_000000.sql
```

---

## 📞 EMERGENCY CONTACTS

During production incident:

1. **API Down**
   - Check Fly.io status page
   - View logs: `flyctl logs`
   - Restart: `flyctl apps restart` (last resort)

2. **Database Issues**
   - Check connections: `SELECT count(*) FROM pg_stat_activity;`
   - Kill stuck queries if needed
   - Contact database provider

3. **Security Breach**
   - Rotate secrets immediately
   - Review access logs
   - Notify users if data exposed
   - File incident report

---

**Deployment Guide Version**: 1.0.0 **Last Updated**: Feb 14, 2025 **Next
Review**: May 14, 2025

---

## Support

For deployment issues:

1. Check this guide's troubleshooting section
2. Review service logs
3. Check Sentry for errors
4. Contact DevOps team
5. Escalate to on-call engineer if critical
