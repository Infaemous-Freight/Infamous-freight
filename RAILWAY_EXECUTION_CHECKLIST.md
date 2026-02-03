# 🚀 Railway Deployment - Execution Checklist

**Purpose**: Follow this exact checklist to deploy to Railway  
**Estimated Time**: 20-30 minutes  
**Last Updated**: February 3, 2026  

---

## 📋 Phase 1: Pre-Deployment (5 minutes)

### Environment Setup
- [ ] You have a Railway.app account (sign up at https://railway.app if needed)
- [ ] You have Railway CLI installed: `npm install -g @railway/cli`
- [ ] You have Node.js 20+ installed: `node --version`
- [ ] You have pnpm installed: `pnpm --version`
- [ ] You have Docker installed (optional but recommended): `docker --version`
- [ ] You have Git installed: `git --version`

### Repository Ready
- [ ] You're in the project root: `/workspaces/Infamous-freight-enterprises`
- [ ] Working directory is clean: `git status` (no uncommitted changes)
- [ ] You're on main branch: `git branch`
- [ ] Latest code pulled: `git pull origin main`

### Documentation Ready
- [ ] You've read this file (you're reading it now! ✅)
- [ ] You have RAILWAY_SETUP_CHECKLIST.md available
- [ ] You have RAILWAY_DEPLOYMENT_GUIDE.md available
- [ ] You have RAILWAY_COMMANDS_REFERENCE.md available

---

## 📋 Phase 2: Railway Project Setup (10 minutes)

### Step 1: Login to Railway
```bash
# Command
railway login

# Expected Output
# ✔ Logged in successfully as: [your-email]
```
**Status**: [ ] Complete

### Step 2: Create Railway Project
```bash
# Option A: Using setup script (EASIEST)
bash scripts/railway-setup.sh

# Option B: Manual creation
railway create infamous-freight-prod

# Expected Output
# ✔ Project created: PROJECT_ID_HERE
```
**Status**: [ ] Complete

### Step 3: Select Your Project
```bash
# List available projects
railway project list

# Expected Output
# • infamous-freight-prod (selected)

# If not selected, select it:
railway project select
```
**Status**: [ ] Complete

### Step 4: Add PostgreSQL Service
```bash
# Command
railway add postgresql

# Expected Output
# ✔ PostgreSQL v16 added successfully
# ✔ DATABASE_URL set automatically

# Verify it was added
railway service list
```
**Status**: [ ] Complete

### Step 5: Add Redis Service
```bash
# Command
railway add redis

# Expected Output
# ✔ Redis v7 added successfully
# ✔ REDIS_URL set automatically

# Verify both services exist
railway service list
```
**Status**: [ ] Complete

---

## 📋 Phase 3: Environment Configuration (5 minutes)

### Get Your Project Credentials

```bash
# Get Project ID (save this!)
railway project select --json | grep id > YOUR_PROJECT_ID.txt
cat YOUR_PROJECT_ID.txt

# Get Railway Token (save this securely!)
# Go to: https://railway.app/account/tokens
# Create a new token
# Save it somewhere secure
```
**Status**: [ ] Complete

### Set Essential Environment Variables

```bash
# Generate a secure JWT secret
JWT_SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')
echo $JWT_SECRET  # Save this in your password manager!

# Set the JWT secret in Railway
railway variable set JWT_SECRET="$JWT_SECRET"

# Verify it was set
railway variable list
```
**Status**: [ ] Complete

### Set Additional Environment Variables

```bash
# Node environment
railway variable set NODE_ENV=production

# API configuration
railway variable set API_PORT=3001
railway variable set API_HOST=0.0.0.0

# Web configuration
railway variable set WEB_PORT=3000
railway variable set NEXT_PUBLIC_ENV=production

# Database will be auto-set by Railway (DATABASE_URL)
# Redis will be auto-set by Railway (REDIS_URL)

# Verify all variables
railway variable list
```
**Status**: [ ] Complete

### Optional: Set API URL for Web

```bash
# After you deploy the API, get its URL:
# From Railway dashboard → Services → API → View Details

# Then set it:
# railway variable set NEXT_PUBLIC_API_BASE_URL=https://[your-api-url]/api

# But you can do this AFTER the first deployment
```
**Status**: [ ] Complete (Optional)

---

## 📋 Phase 4: GitHub Actions Setup (5 minutes)

### Create GitHub Secrets

Go to: https://github.com/[your-org]/[your-repo]/settings/secrets/actions

**Add these secrets**:

1. **RAILWAY_TOKEN**
   - Value: The token you created at https://railway.app/account/tokens
   - **DO NOT share this token!**

2. **RAILWAY_PROJECT_ID**
   - Value: Your Project ID from Railway dashboard
   - This is safe to share

3. **SLACK_WEBHOOK_URL** (Optional)
   - Value: For deployment notifications
   - Skip if you don't use Slack

**Verify**:
```bash
# List secrets (GitHub CLI)
gh secret list
```
**Status**: [ ] Complete

---

## 📋 Phase 5: First Deployment (5 minutes)

### Option A: Automatic (RECOMMENDED)
```bash
# Simply push to main branch
git add .
git commit -m "chore: deploy to railway"
git push origin main

# Watch the deployment:
# 1. Go to: https://github.com/[org]/[repo]/actions
# 2. Click the running workflow
# 3. Monitor deployment progress
# 4. Wait for health checks to pass

# Expected timeline:
# - Build: 2-3 minutes
# - Deploy: 1-2 minutes
# - Health checks: 30 seconds
```
**Status**: [ ] Complete

### Option B: Manual (If automatic fails)
```bash
# Build the Docker images locally
docker build -t api -f Dockerfile.api .
docker build -t web -f Dockerfile.web .

# Deploy using Railway CLI
railway up -d Dockerfile.api
railway up -d Dockerfile.web

# Watch deployment
railway deployment logs --follow
```
**Status**: [ ] Complete

### Option C: Dashboard Manual (GUI)
1. Go to https://railway.app
2. Select your project
3. Click "Create" in the dashboard
4. Connect GitHub repository
5. Select Dockerfile.api for API service
6. Select Dockerfile.web for Web service
7. Click "Deploy"

**Status**: [ ] Complete

---

## 📋 Phase 6: Deployment Verification (5 minutes)

### Check Service Status

```bash
# List all services
railway service list

# Expected output (✓ = healthy):
# ✓ API (Running)
# ✓ postgres (Running)
# ✓ redis (Running)
# ✓ web (Running)
```
**Status**: [ ] Complete

### Check Deployment Status

```bash
# View latest deployment status
railway deployment list

# View deployment logs
railway deployment logs --follow

# Expected: deployment completed without errors
```
**Status**: [ ] Complete

### Verify Health Endpoints

#### API Health Check
```bash
# Get API service URL from Railway dashboard
# Then test the health endpoint:

RAILWAY_API_URL=$(railway service current | grep Domain | awk '{print $NF}')
curl "$RAILWAY_API_URL/api/health"

# Expected output (JSON):
# {
#   "status": "ok",
#   "uptime": 123.45,
#   "database": "connected",
#   "timestamp": 1706962800000
# }
```
**Status**: [ ] Complete

#### Web Health Check
```bash
# Get Web service URL from Railway dashboard
# Open in browser:
# https://[your-web-url]

# Expected: Your web app loads, no errors
```
**Status**: [ ] Complete

### Database Connection Test

```bash
# Connect to PostgreSQL
railway connect postgresql

# In psql prompt, test:
# \dt  -- List tables
# SELECT COUNT(*) FROM information_schema.tables;
# \q   -- Quit

# Expected: Connection works, shows tables
```
**Status**: [ ] Complete

### Redis Connection Test

```bash
# Connect to Redis (if installed locally)
redis-cli -u redis://[your-redis-url]

# In redis prompt:
# PING
# SET test "Hello Railway"
# GET test
# DEL test
# QUIT

# Expected: All commands work, get "Hello Railway"
```
**Status**: [ ] Complete

---

## 📋 Phase 7: Post-Deployment (5 minutes)

### Get Your Live URLs

```bash
# API URL
# From Railway dashboard → Services → API → Settings
# URL shown: https://[random-name].railway.app

# Web URL
# From Railway dashboard → Services → Web → Settings
# URL shown: https://[another-random-name].railway.app

# Save these URLs!
```
**Status**: [ ] Complete

### Configure Custom Domain (Optional)

```bash
# For production, use custom domains:
# 1. Go to Railway dashboard → Services → API → Settings → Domain
# 2. Add custom domain (e.g., api.infamous-freight.com)
# 3. Update DNS CNAME to Railway provided value

# Repeat for Web service
# Then update environment variables:
railway variable set NEXT_PUBLIC_API_BASE_URL=https://api.infamous-freight.com/api
```
**Status**: [ ] Complete

### Enable Monitoring

```bash
# Verify Sentry is configured:
railway variable set SENTRY_DSN=[your-sentry-url]

# Verify Analytics is on:
# (already configured in Next.js)

# Check Railway dashboard monitoring:
# https://railway.app/project/[project-id]/analytics
```
**Status**: [ ] Complete

### Document Your Deployment

Create a deployment record:
```bash
# Create a deployment notes file
cat > DEPLOYMENT_NOTES.md << EOF
# Deployment to Railway

**Date**: $(date)
**Time**: ~20-30 minutes
**Team Member**: $(whoami)

## URLs
- API: https://[your-api-url]
- Web: https://[your-web-url]

## Services Deployed
- ✅ API (Express)
- ✅ Web (Next.js)
- ✅ PostgreSQL 16
- ✅ Redis 7

## Environment
- NODE_ENV: production
- API_PORT: 3001
- WEB_PORT: 3000

## Backups
- PostgreSQL: Daily automatic backup
- Redis: RDB snapshot + AOF persistence

## Next Steps
- [ ] Monitor logs for 1 hour
- [ ] Test all critical features
- [ ] Verify payment processing
- [ ] Check email notifications
- [ ] Review Sentry errors (if any)

## Support
- Dashboard: https://railway.app/project/[project-id]
- Logs: railway deployment logs --follow
- Commands: See RAILWAY_COMMANDS_REFERENCE.md
EOF

cat DEPLOYMENT_NOTES.md
git add DEPLOYMENT_NOTES.md
git commit -m "docs: deployment record"
git push origin main
```
**Status**: [ ] Complete

---

## 📋 Phase 8: Team Communication

### Notify Your Team

```bash
# Send deployment notification
# (Example message for Slack/Discord/Email)

Message Template:
---
🚀 **Infamous Freight is now live on Railway!**

**Live URLs:**
- Web: https://[web-url]
- API: https://[api-url]

**Deployed Services:**
✅ API (Express + Node.js)
✅ Web (Next.js)
✅ Database (PostgreSQL)
✅ Cache (Redis)

**Cost Estimate:** ~$37/month

**Documentation:**
- Setup: RAILWAY_SETUP_CHECKLIST.md
- Guide: RAILWAY_DEPLOYMENT_GUIDE.md
- Commands: RAILWAY_COMMANDS_REFERENCE.md

**Monitoring:**
- Dashboard: https://railway.app/project/[project-id]
- Errors: [Sentry URL]

Deployed by: [Your Name]
Time taken: ~20 minutes
---
```

**Status**: [ ] Complete

---

## ✅ Final Verification Checklist

### Must Have
- [ ] All services running in Railway dashboard
- [ ] API responds to `/api/health`
- [ ] Web homepage loads in browser
- [ ] Database connection working
- [ ] Redis connection working
- [ ] No errors in deployment logs
- [ ] GitHub Actions workflow succeeded

### Should Have
- [ ] Custom domain configured (optional but recommended)
- [ ] Sentry error tracking working
- [ ] Monitoring dashboard accessible
- [ ] Team has deployment documentation
- [ ] Backups configured and verified
- [ ] Slack notifications working (optional)

### Nice to Have
- [ ] Performance benchmarks documented
- [ ] Load test completed
- [ ] Scaling plan documented
- [ ] Runbook created
- [ ] On-call procedures defined

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ **Infrastructure**
- API and Web running without errors
- Database migrations completed
- Cache layer operational

✅ **Functionality**
- All critical features working
- API responds < 500ms
- Web loads in < 2 seconds

✅ **Monitoring**
- Logs accessible in Railway
- Errors tracked in Sentry
- Health checks passing

✅ **Team**
- Everyone notified
- Documentation shared
- Support procedures clear

---

## 🆘 Troubleshooting

### Deployment Failed?

```bash
# Check what went wrong:
railway deployment logs --follow

# Common issues:
# 1. Environment variables not set
#    → Run: railway variable list
#    → Add missing variables

# 2. Docker build failed
#    → Check Dockerfile syntax
#    → Run locally: docker build -f Dockerfile.api .

# 3. Health check failed
#    → Verify endpoint: /api/health
#    → Check API is listening on port 3001

# Need help?
# → See RAILWAY_DEPLOYMENT_GUIDE.md#Troubleshooting
# → Check Railway logs
# → Contact support
```

**Status**: [ ] N/A (No issues)

### Still Having Issues?

1. **Check Logs**
   ```bash
   railway deployment logs --follow
   ```

2. **Read Documentation**
   - RAILWAY_DEPLOYMENT_GUIDE.md
   - RAILWAY_COMMANDS_REFERENCE.md

3. **Get Help**
   - Railway Docs: https://docs.railway.app
   - Discord: https://discord.gg/railway
   - GitHub Issues: https://github.com/railwayapp/issues

---

## 📊 Deployment Summary

| Phase          | Duration   | Status |
| -------------- | ---------- | ------ |
| Pre-Deployment | 5 min      | ✅      |
| Project Setup  | 10 min     | ✅      |
| Configuration  | 5 min      | ✅      |
| GitHub Setup   | 5 min      | ✅      |
| Deployment     | 5 min      | ✅      |
| Verification   | 5 min      | ✅      |
| **TOTAL**      | **35 min** | ✅      |

---

## 🎉 Congratulations!

You've successfully deployed Infamous Freight to Railway! 🚀

**Next Steps:**
1. Monitor the deployment for 1 hour
2. Verify all features working
3. Get team feedback
4. Document any issues
5. Plan scaling strategy

**Your Team Can Now:**
- Deploy changes via `git push main` (automatic)
- Monitor via Railway dashboard
- Access logs via Railway CLI
- Scale services as needed
- Manage databases via `railway connect postgresql`

---

## 📞 Need Help?

- **Setup Issues?** → Read RAILWAY_SETUP_CHECKLIST.md
- **Technical Details?** → Read RAILWAY_DEPLOYMENT_GUIDE.md
- **Need a Command?** → Check RAILWAY_COMMANDS_REFERENCE.md
- **Emergency?** → Call your team lead or DevOps engineer

---

**Deployment Date**: [Your Date Here]  
**Deployed By**: [Your Name Here]  
**Status**: ✅ **LIVE**

---

*End of Execution Checklist*

🚀 **You're deployed! Ship it!**
