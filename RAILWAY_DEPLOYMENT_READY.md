# 🚀 Railway Deployment - Complete Setup Guide

**Status**: ✅ 100% Ready for Production  
**Created**: February 3, 2026  
**For**: Infamous Freight Enterprises Monorepo

---

## 📦 What's Included

Your Railway deployment package includes:

### 📋 Documentation
- **RAILWAY_DEPLOYMENT_GUIDE.md** - Comprehensive 2000+ line guide
- **RAILWAY_SETUP_CHECKLIST.md** - Step-by-step checklist (20 minutes)
- **RAILWAY_COMMANDS_REFERENCE.md** - Quick command reference
- **railway.json** - Updated configuration file

### 🔧 Automation Scripts
- `scripts/railway-setup.sh` - Interactive setup wizard
- `scripts/railway-migrate.sh` - Migrate from other platforms

### 🚀 CI/CD
- `.github/workflows/deploy-railway.yml` - Auto-deploy on git push

### 🐳 Docker Files  
- `Dockerfile.api` - Express backend (already optimized)
- `Dockerfile.web` - Next.js frontend (already optimized)

---

## ⚡ Quick Start (30 seconds)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway create infamous-freight

# 4. Run setup wizard
bash scripts/railway-setup.sh

# 5. Deploy
railway up -d Dockerfile.api
railway up -d Dockerfile.web
```

---

## 📚 Complete Setup Guide (20 minutes)

### Step 1: Prerequisites Check
- [ ] Railway account created (free at railway.app)
- [ ] Railroad CLI installed (npm install -g @railway/cli)
- [ ] GitHub account with repo access
- [ ] Docker installed (for local testing)

### Step 2: Create Railway Project
- [ ] Login: `railway login`
- [ ] Create: `railway create infamous-freight-prod`
- [ ] Get Project ID from output or dashboard

### Step 3: Add Services
- [ ] PostgreSQL: `railway add postgresql`
- [ ] Redis: `railway add redis`
- [ ] Verify: `railway service list`

### Step 4: Configure Environment
- [ ] Set NODE_ENV: `railway variable set NODE_ENV=production`
- [ ] Set JWT_SECRET: `railway variable set JWT_SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"`
- [ ] Set API URL: `railway variable set NEXT_PUBLIC_API_BASE_URL="https://[your-api].railway.app/api"`

### Step 5: GitHub Automation
- [ ] Create Railway token: https://railway.app/account/tokens
- [ ] Add GitHub secret `RAILWAY_TOKEN`
- [ ] Add GitHub secret `RAILWAY_PROJECT_ID`
- [ ] Push to main branch: `git push`
- [ ] Monitor: GitHub Actions → Deploy to Railway

### Step 6: Initial Deployment
- [ ] API: `railway up -d Dockerfile.api`
- [ ] Web: `railway up -d Dockerfile.web`
- [ ] Wait for health checks to pass
- [ ] View logs: `railway deployment logs --follow`

### Step 7: Verification
- [ ] Test API: `curl https://[api-url]/api/health`
- [ ] Test Web: Visit https://[web-url] in browser
- [ ] Check database: `railway connect postgresql`
- [ ] View dashboard: https://railway.app/project/[id]

---

## 🎯 Key Files Location

| File                                   | Purpose                  |
| -------------------------------------- | ------------------------ |
| `railway.json`                         | Railway configuration    |
| `Dockerfile.api`                       | API container definition |
| `Dockerfile.web`                       | Web container definition |
| `.github/workflows/deploy-railway.yml` | Auto-deployment workflow |
| `scripts/railway-setup.sh`             | Setup automation         |
| `scripts/railway-migrate.sh`           | Migration tool           |

---

## 🌍 Deployment Architecture

```
Infamous Freight on Railway
├── Web Service (Next.js)
│   ├── Port: 3000
│   ├── Build: Dockerfile.web
│   ├── Replicas: 1-3 (auto-scaled)
│   └── Health Check: /
│
├── API Service (Express.js)
│   ├── Port: 3001
│   ├── Build: Dockerfile.api
│   ├── Replicas: 1-3 (auto-scaled)
│   └── Health Check: /api/health
│
├── PostgreSQL Database
│   ├── Version: 16
│   ├── Storage: 10 GB starter
│   ├── Backups: Daily automatic
│   └── Replicas: 1 (HA upgrade available)
│
└── Redis Cache
    ├── Version: 7
    ├── Memory: 256 MB starter
    ├── Persistence: RDB + AOF
    └── Replicas: 1 (HA upgrade available)
```

---

## 💰 Estimated Costs

| Component     | Starter | Growth  | Scale    |
| ------------- | ------- | ------- | -------- |
| Web (Next.js) | $10     | $20     | $50      |
| API (Express) | $10     | $20     | $50      |
| PostgreSQL    | $10     | $25     | $100     |
| Redis         | $5      | $10     | $30      |
| Network       | $2      | $5      | $10      |
| **TOTAL**     | **$37** | **$80** | **$240** |

All prices per month.

---

## 📊 Performance Targets

After deployment, you should see:

✅ **Performance**
- Page load: < 2 seconds
- API response: < 500ms (P95)
- Uptime: 99.9%+

✅ **Reliability**
- Auto-restart on failure
- Auto-scaling on load
- Daily backups
- Health checks every 30s

✅ **Security**
- HTTPS everywhere
- Environment vars encrypted
- Database password protected
- Network isolation

---

## 🔄 Deployment Workflow

### Your Team Workflow:

```
1. Code Changes
   ↓
2. Git Push to 'main'
   ↓
3. GitHub Actions Triggers
   ↓
4. Build Docker Images
   ↓
5. Deploy to Railway
   ↓
6. Health Checks Pass?
   ├─ YES → Live! 🎉
   └─ NO → Rollback
   ↓
7. Slack Notification
   ↓
8. Monitor Sentry
```

### Same-Day Deployments:

```bash
# Make code changes
vim apps/api/src/routes/health.js

# Commit and push
git add .
git commit -m "feat: add new endpoint"
git push origin main

# Done! Railway auto-deploys within 2 minutes
# Monitor at: https://railway.app/project/[id]/deployments
```

---

## 📈 Scaling Strategy

### Phase 1: Startup (~100 users)
```bash
# Current setup
# 1x Web, 1x API, Shared PostgreSQL
# Cost: ~$37/month
```

### Phase 2: Growth (~1000 users)
```bash
# Recommended upgrades:
railway up --replicas 2  # Scale to 2 instances
railway variable set DATABASE_POOL_SIZE=20

# Cost: ~$80/month
```

### Phase 3: Scale (~10000 users)
```bash
# Production-grade:
railway variable set RAILWAY_PRIVATE_IP=true   # Private networking
railway service add postgresql-backup           # Standby database
railway service add redis-cache-2               # Secondary cache

# Cost: ~$240/month
```

---

## ✅ Pre-Deployment Checklist

Before pushing to production:

- [ ] All environment variables set in Railway
- [ ] Database migrations tested locally
- [ ] Health check endpoints working
- [ ] CORS configured (NEXT_PUBLIC_API_BASE_URL)
- [ ] JWT_SECRET generated and saved securely
- [ ] Sentry DSN configured (if using error tracking)
- [ ] Backups configured
- [ ] Monitoring alerts set up
- [ ] Team has Railway access
- [ ] Runbook documented

---

## 🆘 Getting Help

### Documentation
1. **RAILWAY_DEPLOYMENT_GUIDE.md** - Full technical guide (2000+ lines)
2. **RAILWAY_SETUP_CHECKLIST.md** - Step-by-step checklist
3. **RAILWAY_COMMANDS_REFERENCE.md** - Command reference

### External Resources
- Railway Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- GitHub: https://github.com/railwayapp/issues

### Scripts
```bash
# Automated setup
bash scripts/railway-setup.sh

# Migrate from other platforms
bash scripts/railway-migrate.sh

# Quick commands
source commands:
railway project select
railway variable list
railway deployment logs --follow
```

---

## 🎉 Success Metrics

After deployment, verify:

✅ **Infrastructure**
- [ ] All services running (railway service list)
- [ ] Logs accessible (railway service logs)
- [ ] Database connected (railway connect postgresql)
- [ ] Redis working (redis-cli ping)

✅ **Deployment**
- [ ] API responds to /api/health
- [ ] Web homepage loads
- [ ] HTTPS working (green lock)
- [ ] Domain configured

✅ **Monitoring**
- [ ] Dashboard accessible
- [ ] Logs visible in Railway
- [ ] Health checks passing
- [ ] Alerts configured

✅ **Development**
- [ ] Auto-deploy on push works
- [ ] GitHub Actions succeeds
- [ ] Team can deploy independently
- [ ] Rollback procedures documented

---

## 🚀 Next Steps After Deployment

### Day 1 (After Launch)
1. Monitor logs for errors
2. Test all critical features
3. Check email/SMS integrations
4. Verify payment processing

### Week 1
1. Analyze performance metrics
2. Check Sentry for error patterns
3. Review database queries
4. Optimize slow endpoints

### Month 1
1. Scale if needed (see scaling strategy)
2. Set up advanced monitoring
3. Establish runbooks
4. Plan improvements

---

## 📞 Support Channels

- **GitHub Issues**: https://github.com/MrMiless44/Infamous-freight/issues
- **Slack**: #devops (if available)
- **Email**: DevOps team
- **Railway Discord**: https://discord.gg/railway

---

## Summary

| Phase             | Time    | Status  |
| ----------------- | ------- | ------- |
| **Setup**         | 5 min   | ✅ Ready |
| **Configuration** | 5 min   | ✅ Ready |
| **Deployment**    | 5 min   | ✅ Ready |
| **Verification**  | 5 min   | ✅ Ready |
| **Monitoring**    | Ongoing | ✅ Ready |

**Total Time to Production**: ~20 minutes

---

**Last Updated**: February 3, 2026  
**Version**: 1.0.0 - Production Ready  
**Maintainer**: DevOps Team

🚀 **You're ready to deploy to Railway!**

Start with: `bash scripts/railway-setup.sh` or follow [RAILWAY_SETUP_CHECKLIST.md](RAILWAY_SETUP_CHECKLIST.md)
