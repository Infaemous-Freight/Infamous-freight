# Railway Setup Checklist

## ✅ Complete Railway Deployment Setup (20 minutes)

This checklist ensures your Infamous Freight is fully deployed to Railway with all configurations.

---

## 📋 Prerequisites

Before starting, you need:

- [ ] Railway account (free at https://railway.app)
- [ ] Railway CLI installed: `npm install -g @railway/cli`
- [ ] GitHub account with access to this repo
- [ ] Personal access token for Railway automation

---

## 🚀 Phase 1: Railway Project Setup (5 minutes)

### Step 1: Create Railway Project

```bash
# Login to Railway
railway login

# Create new project
railway create infamous-freight-prod

# Verify project
railway project
```

**Expected Output**:
```
✅ Project created: infamous-freight-prod (ID: proj_xxx)
```

### Step 2: Get Project ID

```bash
# Get the project ID
railway project --help | grep -i "select\|current"

# Or from Railway Dashboard
# https://railway.app → Select Project → Settings
# Copy the Project ID (proj_xxx)
```

---

## 🗄️ Phase 2: Services Setup (5 minutes)

### Step 1: Add PostgreSQL

```bash
railway add postgresql

# Verify
railway service list
```

**Expected Output**:
```
✅ postgres (PostgreSQL)
```

### Step 2: Add Redis

```bash
railway add redis

# Verify
railway service list
```

**Expected Output**:
```
✅ postgres (PostgreSQL)
✅ redis (Redis)
```

### Step 3: Verify Auto-Generated Variables

```bash
railway variable list

# Should include:
# - DATABASE_URL (from postgres)
# - REDIS_URL (from redis)
```

---

## 🔐 Phase 3: Environment Variables (5 minutes)

### Manual Variables (Set via CLI)

```bash
# Core Application
railway variable set NODE_ENV=production
railway variable set LOG_LEVEL=info

# API Configuration
railway variable set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
railway variable set API_PORT=3001
railway variable set PORT=3001

# Frontend Configuration
railway variable set WEB_PORT=3000
railway variable set NEXT_PUBLIC_ENV=production

# API Base URL (update after first deployment)
railway variable set NEXT_PUBLIC_API_BASE_URL="https://[your-api-service].railway.app/api"

# External Services (if using)
railway variable set SENTRY_DSN="https://key@sentry.io/project"
railway variable set NEXT_PUBLIC_SENTRY_DSN="https://key@sentry.io/project"

# Stripe (if using billing)
railway variable set STRIPE_SECRET_KEY="sk_test_..."
railway variable set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Verify all variables set
railway variable list
```

### Variables via Dashboard

Alternatively, go to:
1. https://railway.app/project/[PROJECT_ID]/settings
2. Click "Variables"
3. Add each variable listed above
4. Click "Redeploy"

---

## 🌍 Phase 4: GitHub Integration (3 minutes)

### Generate Railway Token

```bash
# Go to: https://railway.app/account/tokens
# Click "Create New Token"
# Copy the token
```

### Add GitHub Secrets

Go to: `https://github.com/MrMiless44/Infamous-freight/settings/secrets/actions`

Create these secrets:

1. **RAILWAY_TOKEN**
   - Value: `[paste Railway token]`

2. **RAILWAY_PROJECT_ID**
   - Value: `[paste Project ID like proj_xxx]`

3. **SLACK_WEBHOOK_URL** (optional, for deployment notifications)
   - Value: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

---

## 🚀 Phase 5: Initial Deployment (2 minutes)

### Deploy API

```bash
# Select project
railway project [PROJECT_ID]

# Deploy API service
railway up -d Dockerfile.api

# Watch logs
railway deployment logs --follow
```

**Expected Output**:
```
✅ Deployed API service
✅ Health check passed
✅ Service running at: https://api-service.railway.app
```

### Deploy Web

```bash
# Deploy Web service (in a new terminal if needed)
railway up -d Dockerfile.web

# Watch logs
railway deployment logs --follow
```

**Expected Output**:
```
✅ Deployed Web service
✅ Health check passed
✅ Service running at: https://web-service.railway.app
```

---

## ✅ Phase 6: Verification (3 minutes)

### Test API Health

```bash
# Get API service URL
railway variable get RAILWAY_PUBLIC_DOMAIN

# Or access from Railway dashboard
# Should show API is running

# Test health endpoint
curl https://[api-service-url]/api/health

# Expected response:
# {"status":"ok","timestamp":"...","database":"connected"}
```

### Test Web Frontend

```bash
# Get Web service URL from Railway dashboard
# Visit in browser: https://[web-service-url]

# Should see:
# - Landing page loads
# - No console errors
# - Can navigate app
```

### Check Database Connection

```bash
# Connect to PostgreSQL
railway connect postgresql

# In PostgreSQL prompt:
# \dt  (list tables)
# SELECT * FROM users LIMIT 1;  (should succeed)

# Type \q to exit
```

---

## 📊 Verification Checklist

- [ ] Railway project created
- [ ] PostgreSQL service running
- [ ] Redis service running
- [ ] Environment variables set
- [ ] GitHub secrets configured
- [ ] API deployed and responding to health checks
- [ ] Web frontend deployed and accessible
- [ ] Database connection working
- [ ] Logs visible in Railway dashboard
- [ ] Automatic deployments triggered on `git push`

---

## 🎯 Post-Deployment

### 1. Set Up Production Domain

```bash
# Option A: Add custom domain in Railway Dashboard
# Settings → Domains → Add Custom Domain

# Option B: Point existing domain
# Set CNAME to: railway-provided-domain.up.railway.app
```

### 2. Configure Continuous Deployment

```bash
# Push to main branch triggers deployment
git push origin main

# Monitor deployment
# GitHub Actions → Deploy to Railway → View logs

# Or monitor in Railway dashboard
# https://railway.app/project/[PROJECT_ID]/deployments
```

### 3. Setup Monitoring & Alerts

```bash
# In Railway Dashboard → Settings
# Enable:
# - Deployment notifications
# - Health alerts
# - Resource usage alerts

# Connect Slack channel
# Settings → Integrations → Slack
```

### 4. Create Staging Environment

```bash
# Create staging environment
railway environment staging

# Deploy staging
railway environment staging
railway up -d Dockerfile.api

# Set staging variables
railway variable set NODE_ENV=staging
railway variable set LOG_LEVEL=debug
```

---

## 🆘 Troubleshooting

### Service Won't Start

```bash
# Check logs
railway service logs api --tail

# Common issues:
# ❌ DATABASE_URL not set
#    → railway variable set DATABASE_URL "..."
#
# ❌ Port conflict
#    → railway variable set PORT=3001
#
# ❌ Out of memory
#    → Increase memory in Dashboard

# Restart service
railway service restart api
```

### Deployment Stuck

```bash
# Cancel deployment
railway deployment cancel

# Force new deployment
railway deployment up --force

# Check recent commits
git log --oneline -5

# If needed, revert
git revert HEAD
git push
```

### Database Connection Issues

```bash
# Try connecting directly
railway connect postgresql

# If fails:
# 1. Check DATABASE_URL is set
# 2. Check database is running
# 3. Restart postgres service: railway service restart postgres
```

### Can't Access Web/API

```bash
# Get service URLs
railway variable list | grep RAILWAY

# Or from Dashboard → Services → [Service Name]

# Check service is running
railway service logs web --tail

# Verify health check endpoint
curl https://[web-url]/

# If redirects or 404:
# Check NEXT_PUBLIC_* environment variables
```

---

## 📞 Support

- **Railway Docs**: https://docs.railway.app
- **Discord**: https://discord.gg/railway
- **GitHub Issues**: https://github.com/railwayapp/issues
- **This Project**: See RAILWAY_DEPLOYMENT_GUIDE.md

---

## 🎉 Success!

You now have:

✅ API running at: `https://[api-service].railway.app`  
✅ Web running at: `https://[web-service].railway.app`  
✅ Database connected: PostgreSQL on Railway  
✅ Cache running: Redis on Railway  
✅ Auto-deployments: Triggered on `git push main`  
✅ Monitoring setup: View in Railway Dashboard  

**Total Cost**: ~$35/month (Web $10 + API $10 + DB $10 + Redis $5)

---

**Last Updated**: February 3, 2026  
**Version**: 1.0 - Ready for Production

🚀 **Your app is now on Railway!**
