# 🚀 Railway Deployment Guide

**Platform**: [Railway.app](https://railway.app)  
**Project Type**: Monorepo (Next.js + Express.js + PostgreSQL + Redis)  
**Region**: North America (recommended for US-based operations)  
**Cost**: $5 starter tier, pay-as-you-go scaling  
**Last Updated**: February 3, 2026

---

## 📋 Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [Full Setup (30 minutes)](#full-setup)
3. [Services & Architecture](#services--architecture)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Deployment](#deployment)
7. [Monitoring & Logs](#monitoring--logs)
8. [Cost Optimization](#cost-optimization)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1️⃣ Install Railway CLI

```bash
# macOS / Linux
curl -fsSL https://railway.app/install.sh | bash

# Windows (PowerShell)
iwr https://railway.app/install.ps1 -useb | iex

# Or via npm
npm install -g @railway/cli

# Verify installation
railway --version
```

### 2️⃣ Login to Railway

```bash
railway login
# Opens browser for authentication
# Returns to terminal when complete
```

### 3️⃣ Create Project

```bash
# Create new project
railway create infamous-freight-prod

# Or select existing
railway project select

# Set as working project
railway project
```

### 4️⃣ Add Services

```bash
# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis

# Verify services
railway service list
```

### 5️⃣ Configure & Deploy

```bash
# Set environment variables
railway variable set DATABASE_URL "postgresql://user:pass@..."
railway variable set REDIS_URL "redis://..."
railway variable set JWT_SECRET "your-secret"
railway variable set NODE_ENV "production"

# Deploy API
railway up -d Dockerfile.api

# Or use web UI: https://railway.app
```

---

## Full Setup

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           Railway Project                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Next.js     │  │  Express.js  │  │ Database │ │
│  │  (Web)       │  │  (API)       │  │ (DB Log) │ │
│  │  Port: 3000  │  │  Port: 3001  │  │ Port: 5432│ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│         │                │                │        │
│         └────────────────┼────────────────┘        │
│                          │                         │
│              ┌───────────┴──────────┐              │
│              │    PostgreSQL DB     │              │
│              │     (~$10/mo)        │              │
│              └─────────────────────┘              │
│                                                     │
│              ┌────────────────────┐               │
│              │   Redis Cache      │               │
│              │    (~$5/mo)        │               │
│              └────────────────────┘               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Service Details

#### Web Service (Next.js Frontend)
- **Image**: Built from `Dockerfile.web`
- **Port**: 3000
- **Memory**: 512 MB (starter)
- **Scale**: Auto-scaling 2-10 instances
- **Environment**: Production

#### API Service (Express.js Backend)
- **Image**: Built from `Dockerfile.api`
- **Port**: 3001
- **Memory**: 512 MB (starter)
- **Scale**: Auto-scaling 2-5 instances
- **Environment**: Production

#### Database (PostgreSQL)
- **Version**: 16 (latest)
- **Storage**: 10 GB starter
- **Backup**: Automatic daily
- **Access**: Internal + external connection strings

#### Cache (Redis)
- **Version**: 7 (latest)
- **Memory**: 256 MB starter
- **Persistence**: RDB + AOF
- **Access**: Internal + external connection strings

---

## Services & Architecture

### Step 1: Create Project in Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose repository: `MrMiless44/Infamous-freight`
5. Select `main` branch
6. Click "Deploy"

### Step 2: Add Services via CLI

```bash
# Select project
railway project select

# Add PostgreSQL
railway add postgresql
#✅ PostgreSQL added (auto-variables: DATABASE_URL, etc.)

# Add Redis
railway add redis
# ✅ Redis added (auto-variables: REDIS_URL, etc.)

# Add plugins (optional enhancement)
railway add sentry  # Error tracking
railway add datadog # APM monitoring
```

### Step 3: Link Services

Railway auto-links services via environment variables:

```bash
# Verify linked services
railway service logs

# See all variables
railway variable list
```

### Step 4: Create Multiple Environments

```bash
# Create staging environment
railway env staging
railway environment staging

# Create production environment
railway env production
railway environment production

# Switch between environments
railway environment # shows current
railway environment production # switches to production
```

---

## Environment Variables

### Automatic Variables (Set by Railway Services)

```bash
# PostgreSQL
DATABASE_URL=postgresql://username:password@service.railway.app:5432/railway

# Redis
REDIS_URL=redis://username:password@service.railway.app:6379

# These are automatically provided by Railway
```

### Manual Variables (Add via Dashboard or CLI)

```bash
# Core application
NODE_ENV=production
PORT=3001  # API (Railway maps to 8080 on their side)

# API Configuration
JWT_SECRET=your-256-bit-secret-here  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
API_PORT=3001
CORS_ORIGINS=https://infamous-railway.up.railway.app,https://app.infamousfreight.com

# Frontend Configuration
WEB_PORT=3000
NEXT_PUBLIC_API_BASE_URL=https://api-service.railway.app/api
NEXT_PUBLIC_ENV=production

# Service Discovery (auto-linked, verify these are set)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# AI Configuration (if using)
AI_PROVIDER=synthetic
AI_SYNTHETIC_API_KEY=your-key

# Monitoring & Error Tracking
SENTRY_DSN=https://key@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=same-as-above

# Optional: External Integrations
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
OPENAI_API_KEY=sk-...
PAYPAL_CLIENT_ID=...
```

### Set Variables via CLI

```bash
# Single variable
railway variable set JWT_SECRET "your-secret"

# Multiple variables
railway variable set \
  NODE_ENV=production \
  API_PORT=3001 \
  LOG_LEVEL=info

# Environment-specific
railway environment production
railway variable set NODE_ENV=production

# View all
railway variable list

# Delete variable
railway variable delete JWT_SECRET
```

### Set Variables via Dashboard

1. Go to: https://railway.app/project/[PROJECT_ID]/settings
2. Click "Variables"
3. Add each variable manually
4. Click "Redeploy" trigger

---

## Database Setup

### Automatic Setup (Recommended)

When you add PostgreSQL service, Railway automatically:
- ✅ Creates database named `railway`
- ✅ Sets up root user with random password
- ✅ Provides `DATABASE_URL` environment variable
- ✅ Configures backups
- ✅ Enables monitoring

### Manual Initialization

```bash
# Connect to database
railway connect postgresql

# Or get connection string
railway variable get DATABASE_URL

# Use with Prisma (automatic via Dockerfile)
cd apps/api
pnpm prisma:migrate:deploy  # Auto-runs on deployment

# Or manually initialize
pnpm prisma:db:push
```

### Connection Strings

**Internal** (services within Railway):
```
DATABASE_URL=postgresql://user:password@postgres.railway.internal:5432/railway
```

**External** (from your machine):
```
postgresql://user:password@postgres-prod-xxx.railway.app:5432/railway
```

### Backup & Restore

```bash
# View backups
railway database backups

# Restore from backup
railway database restore [BACKUP_ID]

# Manual backup
railway database backup
```

---

## Deployment

### Option 1: Push to Deploy (Recommended)

```bash
# Set default branch in Railway Dashboard → Settings → Git
# Every push to `main` triggers deployment

git push origin main

# Monitor deployment
railway deployment list
railway deployment logs [DEPLOYMENT_ID]  # Latest deployment
```

### Option 2: Manual Deployment via CLI

```bash
# Deploy specific Dockerfile
railway up -d Dockerfile.api

# Deploy with custom environment
railway environment production
railway up -d Dockerfile.api

# Watch deployment
railway deployment logs --follow
```

### Option 3: Manual Deployment via Dashboard

1. Go to: https://railway.app/project/[PROJECT_ID]
2. Select service (API or Web)
3. Click "Deploy"
4. Select branch & commit
5. Click "Deploy"

### Zero-Downtime Deployments

Railway automatically:
- ✅ Runs health checks before switching traffic
- ✅ Keeps previous version running during swap
- ✅ Rolls back if health check fails
- ✅ Minimizes user impact

**Health Check Configuration**:

```bash
# Set health check endpoint
railway variable set HEALTHCHECK_PATH=/api/health

# In railway.json (already configured)
"deploy": {
  "healthcheckPath": "/api/health",
  "healthcheckTimeout": 300
}
```

---

## Monitoring & Logs

### View Logs

```bash
# API logs
railway environment production
railway service logs api --tail

# Web logs
railway service logs web --tail

# Database logs
railway service logs postgres

# Redis logs
railway service logs redis

# All services
railway service logs --all --follow

# Historical logs
railway service logs -n 100  # Last 100 lines
```

### Railway Dashboard Monitoring

Go to: https://railway.app/project/[PROJECT_ID]

**Available Metrics**:
- CPU usage
- Memory usage
- Network I/O
- Request count
- Error rate
- Response time
- Uptime

### External Monitoring Integration

#### Sentry (Error Tracking)

```bash
railway variable set SENTRY_DSN "https://key@sentry.io/..."
railway variable set NEXT_PUBLIC_SENTRY_DSN "same-dsn"

# Errors automatically sent to Sentry dashboard
# https://sentry.io/organizations/your-org/issues/
```

#### Datadog (APM)

```bash
# Add Datadog plugin
railway add datadog

# Automatically instruments:
# - Database queries
# - HTTP requests
# - Traces

# View metrics: https://datadoghq.com
```

#### Custom Monitoring

```bash
# Expose metrics endpoint
railway variable set METRICS_PORT=9090

# Access from within Railway
railway connection metrics

# From external (use secure proxy)
# Requires Secure Shell or Railway Connect plugin
```

### Alerts

Configure alerts in Railway Dashboard:
- CPU > 80%
- Memory > 90%
- Service crashed > 2x/hour
- Database connection errors > 10/minute

Set notification channels:
- Email
- Slack
- PagerDuty
- Webhook

---

## Cost Optimization

### Pricing Model

| Component      | Starter  | Production     |
| -------------- | -------- | -------------- |
| **Base**       | $5/month | $20/month      |
| **Compute**    | 2 GB RAM | Usage-based    |
| **PostgreSQL** | 10 GB    | $10/mo + usage |
| **Redis**      | 256 MB   | $5/mo + usage  |
| **Network**    | 100 GB   | $0.10/GB       |
| **Backups**    | 7 days   | 30 days        |

**Monthly Estimate** (typical):
- Web: $10
- API: $10
- PostgreSQL: $10
- Redis: $5
- Network: $2
- **Total**: ~$37/month

### Cost Reduction Strategies

#### 1. Consolidate Services
```bash
# Stop unused web service (if not needed)
railway service remove web-staging

# Keep only production + staging
railway environment production
railway environment staging
```

#### 2. Reduce Memory Allocation

```bash
# Check current usage
railway metrics

# If consistently < 256 MB:
# Reduce in dashboard → Service → Sizing
# Set to 256 MB (minimum productive)
```

#### 3. Enable Auto-scaling

```bash
# Dashboard → Service → Scaling
# Set: Min 1 instance, Max 3 instances
# Scales based on CPU/Memory
```

#### 4. Use Railway's Built-in Services

```bash
# Instead of external Datadog/Sentry:
# Use Railway's integrations:
railway add sentry  # Uses Railway's shared instance
railway add datadog # Includes basic APM

# Saves ~$30-50/month vs standalone
```

#### 5. Archive Old Environments

```bash
# Keep only latest 2 deployments
railway deployment list
railway deployment remove [OLD_ID]  # Saves ~$5/month per archived env
```

### Estimated Costs (Scale)

| Scale                  | Services                             | Est. Cost |
| ---------------------- | ------------------------------------ | --------- |
| **Startup** (1k users) | Web + API + DB                       | $35/mo    |
| **Growth** (10k users) | 2x Web + 2x API + DB + Redis         | $60/mo    |
| **Scale** (100k users) | 5x Web + 5x API + DB cluster + Redis | $200+/mo  |

---

## Troubleshooting

### Service Fails to Start

```bash
# Check logs
railway service logs api --tail

# Common issues:
# ❌ PORT not set → Fix: railway variable set PORT=3001
# ❌ DATABASE_URL missing → Fix: railway variable set DATABASE_URL="..."
# ❌ Memory exhausted → Fix: Increase in dashboard

# Restart service
railway service restart api
```

### Database Connection Fails

```bash
# Verify DATABASE_URL is set
railway variable get DATABASE_URL

# Connect directly to troubleshoot
railway connect postgresql

# Check database health
railway database status

# Restart database
railway service restart postgres
```

### Deployment Stuck

```bash
# Cancel current deployment
railway deployment cancel

# Force new deployment
railway up --force

# Check recent commits
git log --oneline -5

# Revert if needed
git revert HEAD
git push
```

### Out of Memory

```bash
# Check memory usage
railway metrics

# If > 90% consistently:
# Option 1: Increase memory (costs more)
# Option 2: Optimize application
#   - Remove unused dependencies
#   - Implement caching
#   - Use streaming responses

# Temporarily restart to free memory
railway service restart api
```

### External Connection Issues

```bash
# From local machine:
railway connect postgresql

# If fails, check:
# 1. Firewall rules (Railway → Settings)
# 2. IP whitelisting
# 3. Connection string format

# Get proper connection string
railway service logs postgres | grep "postgres://"
```

### Build Failures

```bash
# Check build logs
railway deployment logs --follow

# Common issues:
# ❌ Dependency resolution → Clear node_modules & rebuild
# ❌ Environment var at build time → Move to runtime var
# ❌ Dockerfile path wrong → Verify railway.json buildPath

# Force rebuild
railway deployment up --force
```

---

## Advanced Configuration

### Custom Dockerfile Optimization

```dockerfile
# Multi-stage build for smaller images
FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9.15.0
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE ${PORT:-3001}
CMD ["node", "dist/server.js"]
```

### Environment-Specific Config

```bash
# Production
railway environment production
railway variable set NODE_ENV=production
railway variable set LOG_LEVEL=info

# Staging
railway environment staging
railway variable set NODE_ENV=staging
railway variable set LOG_LEVEL=debug

# Development (rarely used in Railway)
railway environment development
railway variable set NODE_ENV=development
```

### Database Migrations

```bash
# Auto-run on deployment (via Dockerfile)
RUN pnpm prisma:migrate:deploy

# Or manual
railway connect postgresql
pnpm prisma:migrate:deploy
```

### Webhooks & Notifications

```bash
# Set deployment webhook
railway setting webhook "https://your-domain.com/webhook/railway"

# Receives: deployment status updates, error notifications
```

---

## Deployment Checklist

Before first production deployment:

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Health check endpoint working
- [ ] CORS configured correctly
- [ ] HTTPS enforced
- [ ] Logging function working
- [ ] Error tracking enabled (Sentry)
- [ ] Database backups scheduled
- [ ] Monitoring alerts configured
- [ ] Team members have Railway access
- [ ] Documentation updated
- [ ] Runbook created for operations

---

## Quick Commands Reference

```bash
# Authentication
railway login
railway logout
railway whoami

# Project management
railway project                    # Current project
railway project select             # Choose project
railway create [name]              # New project
railway list                       # List all projects

# Services
railway service list               # Deployed services
railway service logs [name]        # View service logs
railway service restart [name]     # Restart service
railway service remove [name]      # Delete service

# Environment management
railway environment                # Current environment
railway environment [name]         # Switch environment
railway env list                   # All environments
railway env [name]                 # Create environment

# Variables
railway variable list              # All variables
railway variable get [name]        # Get value
railway variable set [name] [val]  # Set variable
railway variable delete [name]     # Delete variable

# Deployment
railway up                         # Deploy current service
railway up -d [dockerfile]        # Deploy specific dockerfile
railway deployment list            # Deployment history
railway deployment logs            # Latest deployment logs
railway deployment cancel          # Cancel current deploy

# Local development
railway run                        # Run with Railway env
railway connect [service]          # SSH to service

# Monitoring
railway metrics                    # Performance metrics
railway status                     # Service status

# Database
railway connect postgresql         # Connect to database
railway database backups           # List backups
railway database restore [id]      # Restore from backup
```

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Discord Community**: https://discord.gg/railway
- **GitHub Issues**: https://github.com/railwayapp/issues
- **Status Page**: https://status.railway.app

---

## See Also

- [Fly.io Deployment](FLY_IO_DEPLOYMENT_GUIDE.md)
- [Vercel Deployment](DEPLOY_TO_WORLD_100_GUIDE.md)
- [Docker Compose Guide](docker-compose.yml)
- [Architecture Overview](.github/copilot-instructions.md)

---

**Last Updated**: February 3, 2026  
**Version**: 1.0  
**Status**: ✅ Ready for Production

🚀 **Deploy to Railway today!**
