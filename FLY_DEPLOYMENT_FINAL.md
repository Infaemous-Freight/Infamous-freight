# 🚀 Complete Fly.io Deployment Guide

## 📦 Deployed Applications

| App | Status | URL | Config |
|-----|--------|-----|--------|
| **Web Frontend** | ✅ Deployed | https://infamous-freight-enterprises.fly.dev | [fly.toml](fly.toml) |
| **API Backend** | ⏳ Ready | https://infamous-freight-api.fly.dev | [fly.api.toml](fly.api.toml) |

---

## ✅ Completed Setup

### 1. Web Frontend (Next.js) - DEPLOYED ✅

**App Name**: `infamous-freight-enterprises`
**Status**: Live and running
**URL**: https://infamous-freight-enterprises.fly.dev/

```bash
# Already deployed and operational
flyctl status -a infamous-freight-enterprises
```

### 2. CI/CD Workflows - CONFIGURED ✅

Two GitHub Actions workflows created:
- [.github/workflows/deploy-web-fly.yml](.github/workflows/deploy-web-fly.yml) - Auto-deploys web on push
- [.github/workflows/deploy-api-fly.yml](.github/workflows/deploy-api-fly.yml) - Auto-deploys API on push

**Requirements**:
- Add `FLY_API_TOKEN` to GitHub Secrets
- Both workflows will auto-deploy on push to `main`

---

## 🔧 Manual Steps Required

Since the builder token has limited permissions, you'll need to complete these steps manually:

### Step 1: Create API App (Manual)

Run this in your **local terminal** (not Codespaces) after logging in with `flyctl auth login`:

```bash
# Create the API app
flyctl apps create infamous-freight-api --org personal

# Verify creation
flyctl apps list
```

### Step 2: Create PostgreSQL Database (Manual)

```bash
# Create database
flyctl postgres create \
  --name infamous-freight-db \
  --region iad \
  --vm-size shared-cpu-1x \
  --volume-size 10 \
  --initial-cluster-size 1

# Attach to API app
flyctl postgres attach infamous-freight-db -a infamous-freight-api
```

This will automatically set `DATABASE_URL` secret on the API app.

### Step 3: Set API Secrets (Manual)

```bash
# JWT and Auth
flyctl secrets set \
  JWT_SECRET="$(openssl rand -base64 32)" \
  -a infamous-freight-api

# AI Providers (optional)
flyctl secrets set \
  OPENAI_API_KEY="sk-..." \
  ANTHROPIC_API_KEY="sk-ant-..." \
  AI_PROVIDER="openai" \
  -a infamous-freight-api

# Billing (optional)
flyctl secrets set \
  STRIPE_SECRET_KEY="sk_live_..." \
  PAYPAL_CLIENT_ID="..." \
  PAYPAL_CLIENT_SECRET="..." \
  -a infamous-freight-api

# Monitoring
flyctl secrets set \
  SENTRY_DSN="https://...@sentry.io/..." \
  -a infamous-freight-api

# CORS
flyctl secrets set \
  CORS_ORIGINS="https://infamous-freight-enterprises.fly.dev,http://localhost:3000" \
  -a infamous-freight-api
```

### Step 4: Deploy API (Manual)

```bash
# Deploy the API
flyctl deploy --config fly.api.toml --dockerfile Dockerfile.fly -a infamous-freight-api

# Verify deployment
flyctl status -a infamous-freight-api
curl https://infamous-freight-api.fly.dev/api/health
```

### Step 5: Update Web Environment Variables

After API is deployed, update the web app:

```bash
flyctl secrets set \
  NEXT_PUBLIC_API_URL="https://infamous-freight-api.fly.dev" \
  -a infamous-freight-enterprises
```

### Step 6: Add GitHub Secret for CI/CD

1. Get your Fly.io token:
   ```bash
   flyctl auth token
   ```

2. Go to: https://github.com/MrMiless44/Infamous-freight-enterprises/settings/secrets/actions

3. Click "New repository secret"
   - Name: `FLY_API_TOKEN`
   - Value: (paste your token)

---

## 📊 Monitoring & Management

### View Logs

```bash
# Web logs
flyctl logs -a infamous-freight-enterprises

# API logs  
flyctl logs -a infamous-freight-api
```

### Check Status

```bash
# Web status
flyctl status -a infamous-freight-enterprises

# API status
flyctl status -a infamous-freight-api
```

### Scaling

```bash
# Scale web app
flyctl scale count 2 -a infamous-freight-enterprises

# Scale API
flyctl scale count 2 -a infamous-freight-api
```

---

## ✅ Deployment Checklist

### Web Frontend
- [x] App created
- [x] Dockerfile configured
- [x] fly.toml configured
- [x] Environment variables set
- [x] Deployed successfully
- [x] Health checks passing
- [x] Accessible via HTTPS
- [x] CI/CD workflow created

### API Backend
- [ ] App created (manual step required)
- [x] Dockerfile.fly ready
- [x] fly.api.toml configured
- [ ] Database created (manual step required)
- [ ] Secrets configured (manual step required)
- [ ] Deployed (pending above steps)
- [x] CI/CD workflow created

---

## 🎯 Summary

### ✅ Completed (100%)
1. ✅ Web frontend deployed and live
2. ✅ CI/CD workflows configured for both web and API
3. ✅ Configuration files created for all services
4. ✅ Documentation complete
5. ✅ Dockerfile optimized for production
6. ✅ Health checks configured
7. ✅ Auto-scaling enabled

### ⏳ Requires Manual Action (Due to Token Limitations)
1. Create `infamous-freight-api` app
2. Create PostgreSQL database
3. Set API secrets
4. Deploy API
5. Add `FLY_API_TOKEN` to GitHub Secrets

### 📍 Current Status
- **Web**: 🟢 Live at https://infamous-freight-enterprises.fly.dev/
- **API**: 🟡 Ready to deploy (pending manual steps)
- **CI/CD**: 🟢 Configured (pending GitHub token)
- **Database**: 🟡 Ready to create (manual step)

---

**Next Action**: Complete the manual steps above using your local terminal with full Fly.io account access.
