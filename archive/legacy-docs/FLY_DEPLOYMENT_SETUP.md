# 🚀 Fly.io Deployment Setup Guide

**Status**: ✅ GitHub Actions workflow configured  
**Workflow**: `.github/workflows/fly-deploy.yml`  
**Target**: https://infamous-freight-api.fly.dev

---

## 🔐 Setup Required

### **Step 1: Get Fly.io API Token**

Run this command in your **local terminal** (not in Codespaces):

```bash
# Install Fly.io CLI (if not installed)
curl -L https://fly.io/install.sh | sh

# Authenticate
flyctl auth login

# Get your API token
flyctl auth token
```

Copy the token that's displayed.

---

### **Step 2: Add Token to GitHub Secrets**

1. Go to your repository on GitHub:  
   https://github.com/MrMiless44/Infamous-freight-enterprises/settings/secrets/actions

2. Click **"New repository secret"**

3. Add the secret:
   - **Name**: `FLY_API_TOKEN`
   - **Value**: (paste the token from Step 1)

4. Click **"Add secret"**

---

### **Step 3: Trigger Deployment**

#### **Option A: Automatic Deployment** (Recommended)

The workflow will **automatically deploy** when you push changes to:

- `apps/api/**` (API code changes)
- `packages/shared/**` (Shared types/utils)
- `Dockerfile.fly` (Docker configuration)
- `fly.toml` (Fly.io configuration)

Just commit and push:

```bash
git add .
git commit -m "feat: update API"
git push origin main
```

#### **Option B: Manual Deployment**

Trigger deployment manually via GitHub Actions:

1. Go to:
   https://github.com/MrMiless44/Infamous-freight-enterprises/actions/workflows/fly-deploy.yml
2. Click **"Run workflow"**
3. Select branch: `main`
4. Click **"Run workflow"**

---

## 📋 What the Workflow Does

1. ✅ **Checkout code** from repository
2. ✅ **Setup pnpm** (v8.15.9) and Node.js (v20)
3. ✅ **Install dependencies** (with frozen lockfile)
4. ✅ **Generate Prisma client** (for database access)
5. ✅ **Deploy to Fly.io** using remote builder
6. ✅ **Verify deployment** with health check
7. ✅ **Report status** (success/failure)

---

## 🎯 Deployment Configuration

**App Name**: `infamous-freight-api`  
**Region**: `iad` (US East - Virginia)  
**Health Check**: `GET /api/health`  
**Auto-scaling**: 1-10 machines  
**Memory**: 1GB per machine  
**Build**: Remote builder (no local Docker required)

---

## 🔍 Monitoring Deployment

### **View GitHub Actions**

https://github.com/MrMiless44/Infamous-freight-enterprises/actions

### **View Fly.io Dashboard**

```bash
flyctl dashboard
```

### **View Logs**

```bash
flyctl logs -a infamous-freight-api
```

### **Check Status**

```bash
flyctl status -a infamous-freight-api
```

### **Test API Health**

```bash
curl https://infamous-freight-api.fly.dev/api/health
```

---

## ⚙️ Environment Variables

Set production secrets in Fly.io:

```bash
# Database
flyctl secrets set DATABASE_URL="postgresql://..." -a infamous-freight-api

# JWT
flyctl secrets set AUTH_SECRET="your-secret-key" -a infamous-freight-api

# AI Provider
flyctl secrets set OPENAI_API_KEY="sk-..." -a infamous-freight-api
flyctl secrets set ANTHROPIC_API_KEY="sk-ant-..." -a infamous-freight-api

# Monitoring
flyctl secrets set SENTRY_DSN="https://..." -a infamous-freight-api

# Billing
flyctl secrets set STRIPE_API_SECRET="sk_live_..." -a infamous-freight-api
flyctl secrets set PAYPAL_CLIENT_ID="..." -a infamous-freight-api
flyctl secrets set PAYPAL_CLIENT_SECRET="..." -a infamous-freight-api
```

---

## 🚨 Troubleshooting

### **Deployment Fails**

- Check GitHub Actions logs for errors
- Verify `FLY_API_TOKEN` is set correctly
- Ensure Docker build succeeds locally

### **Health Check Fails**

- Check API logs: `flyctl logs -a infamous-freight-api`
- Verify database connection
- Check environment variables are set

### **Can't Access API**

- Verify app is running: `flyctl status -a infamous-freight-api`
- Check firewall/networking settings
- Ensure health check endpoint works

---

## 🔄 Rollback Procedure

If deployment has issues:

```bash
# View deployment history
flyctl releases -a infamous-freight-api

# Rollback to previous version
flyctl releases rollback <version> -a infamous-freight-api
```

---

## ✅ Next Steps After Deployment

1. **Verify API is live**: https://infamous-freight-api.fly.dev/api/health
2. **Update Web env vars** to point to production API:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter: https://infamous-freight-api.fly.dev
   ```
3. **Run E2E tests** against production
4. **Monitor Sentry** for errors
5. **Check Fly.io metrics** for performance

---

**Ready to deploy**: Once you add `FLY_API_TOKEN` to GitHub Secrets, push any
change to trigger automatic deployment! 🚀
