# Deployment Guide - Infamous Freight Enterprises

Complete guide for deploying the monorepo to production.

## Table of Contents

- [Architecture](#architecture)
- [Deployment Targets](#deployment-targets)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [API Deployment](#api-deployment)
- [Web Deployment](#web-deployment)
- [Mobile Deployment](#mobile-deployment)
- [Database Migrations](#database-migrations)
- [Environment Configuration](#environment-configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Monitoring & Health](#monitoring--health)
- [Rollback Procedures](#rollback-procedures)
- [Disaster Recovery](#disaster-recovery)

## Architecture

### Deployment Overview

```
Production Infrastructure:
┌──────────────────────────────────────────────────────┐
│ Cloudflare / AWS Route53 (DNS & Global Routing)      │
├──────────────────────────────────────────────────────┤
│ Web Load Balancer (Vercel / Cloudflare Pages)        │
│ ├─ apps/web (Next.js 14, TypeScript, ESM)           │
│ └─ apps/mobile (EAS Build, React Native / Expo)     │
├──────────────────────────────────────────────────────┤
│ API Load Balancer (Railway / Fly.io)                 │
│ ├─ API Instance 1 (Express + Node 24)               │
│ ├─ API Instance 2 (Express + Node 24, auto-scaling) │
│ └─ Health checks on /api/health                     │
├──────────────────────────────────────────────────────┤
│ Database Layer (PostgreSQL 15+)                      │
│ ├─ Primary (Read/Write)                             │
│ ├─ Replica 1 (Read-only)                            │
│ └─ Automated backups (daily at 02:00 UTC)           │
├──────────────────────────────────────────────────────┤
│ Cache Layer (Redis 7+)                              │
│ ├─ Primary instance                                  │
│ └─ Replica (automatic failover)                      │
├──────────────────────────────────────────────────────┤
│ Monitoring & Observability                           │
│ ├─ Sentry (error tracking)                           │
│ ├─ Datadog (APM & metrics)                           │
│ ├─ Winston (structured logs)                         │
│ └─ Health checks (uptime monitoring)                 │
└──────────────────────────────────────────────────────┘
```

## Deployment Targets

### Primary Production (Recommended)

- **API**: Railway.app
  - PostgreSQL managed by Railway
  - Redis managed by Railway
  - Auto-scaling enabled
  - CDN: Cloudflare proxy

- **Web & Mobile**: Vercel
  - Next.js Deployment
  - EAS Build & Distribution
  - Global edge caching
  - Automatic previews on PR

### Secondary Production (Failover)

- **API**: Fly.io (standby)
  - Manual trigger for failover
  - Database replication from Railway

### Development

- **Local**: Docker Compose
  - PostgreSQL 15 Alpine
  - Redis 7 Alpine
  - Run: `pnpm run db:up`

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests passing: `pnpm test --coverage`
- [ ] Coverage thresholds met: API 85%+ branches
- [ ] Lint passing: `pnpm lint`
- [ ] Type check passing: `pnpm check:types`
- [ ] Build passing: `pnpm build`
- [ ] E2E tests passing: `pnpm --filter e2e test`
- [ ] CHANGELOG updated with version & changes
- [ ] Git tagged: `git tag -a v1.2.3 -m "Release 1.2.3"`
- [ ] Environment variables configured in target service
- [ ] Database backups verified
- [ ] Incident contact(s) on-call

## API Deployment

### Railway Deployment (Primary)

Railway auto-deploys on push to main via webhook.

#### Manual Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway deploy

# View logs
railway logs

# Check status
railway status
```

#### Environment Variables

Set these in Railway Dashboard:

```env
NODE_ENV=production
API_PORT=3001
AUTH_SECRET=<generated-random-value>
DATABASE_URL=<auto-set-by-railway-postgres-plugin>
REDIS_URL=<auto-set-by-railway-redis-plugin>
SENTRY_DSN=https://key@sentry.io/project
DD_TRACE_ENABLED=true
DD_SERVICE=infamous-freight-api
DD_ENV=production
LOG_LEVEL=info
CORS_ORIGINS=https://infamous-freight-web-production.up.railway.app,https://app.example.com
```

#### Health Check Configuration

Railway will use these endpoints for health checks:

```
GET /api/health
GET /api/health/live (for Kubernetes-style probes)
```

Expected responses:

- **200**: Service healthy
- **503**: Dependency down (DB, Redis)

### Fly.io Deployment (Standby)

Deploy to Fly.io using fly.io CLI:

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy to staging
fly deploy --app infamous-freight-api-staging

# Monitor deployment
fly status --app infamous-freight-api-staging

# View logs
fly logs --app infamous-freight-api-staging

# Scale instances
fly scale count 2 --app infamous-freight-api-staging
```

Fly.io Configuration (`fly.toml`):

```toml
[build]
  image = "node:24-alpine"

[env]
  NODE_ENV = "production"
  API_PORT = "8080"
  LOG_LEVEL = "info"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [services.concurrency]
    type = "requests"
    hard_limit = 20
    soft_limit = 16

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[checks]
  [checks.api]
    type = "http"
    interval = "10s"
    timeout = "5s"
    grace_period = "60s"
    path = "/api/health"
```

### Docker Deployment (Manual / Private)

For on-premise or custom deployments:

```bash
# Build Docker image
docker build -t infamous-freight-api:v1.2.3 -f apps/api/Dockerfile .

# Run container
docker run -p 4000:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e AUTH_SECRET="..." \
  infamous-freight-api:v1.2.3

# Or use docker-compose
docker-compose -f docker-compose.full-production.yml up -d
```

## Web Deployment

### Vercel Deployment (Primary)

Vercel auto-deploys on push to main via GitHub integration.

#### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod

# View logs
vercel logs <deployment-url>
```

#### Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_BASE_URL=https://api.railway.app/api
NEXT_PUBLIC_DD_APP_ID=<datadog-app-id>
NEXT_PUBLIC_DD_CLIENT_TOKEN=<datadog-client-token>
NEXT_PUBLIC_DD_SITE=datadoghq.com
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_SENTRY_DSN=https://key@sentry.io/project
```

Vercel config (`vercel.json`):

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "@next_public_api_base_url",
    "NEXT_PUBLIC_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

## Mobile Deployment

### Expo Application Services (EAS) Deployment

Deploy React Native app to iOS & Android:

```bash
cd apps/mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS and Android
eas build --platform all

# Submit to app stores
eas submit --platform all

# View builds
eas builds
```

EAS Configuration (`eas.json`):

```json
{
  "build": {
    "production": {
      "node": "24.0.0",
      "npm": "10.0.0"
    },
    "preview": {
      "distribution": "internal"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "asciiProviderAccountToken": "@asciiProviderAccountToken"
      },
      "android": {
        "serviceAccount": "@serviceAccount"
      }
    }
  }
}
```

## Database Migrations

### Pre-Deployment Migration

1. **Create Migration**

   ```bash
   cd apps/api
   pnpm prisma:migrate:dev --name feature_description
   ```

2. **Review Generated SQL**

   ```bash
   cat prisma/migrations/[timestamp]_feature_description/migration.sql
   ```

3. **Test Locally**
   ```bash
   pnpm test
   ```

### Production Migration

Migrations auto-run on API startup via `prisma migrate deploy`.

**Manual migration** (if needed):

```bash
cd apps/api
pnpm prisma:migrate:deploy
```

### Zero-Downtime Migrations

For large tables, use these patterns:

```prisma
// Phase 1: Add column as NULLABLE
model Shipment {
  statusNew String? // New column, nullable
}

// Phase 2: Deploy code that writes to both columns
// Phase 3: Deploy code that reads from new column only
// Phase 4: Remove old column
```

### Rollback Procedure

```bash
cd apps/api

# View migration history
pnpm prisma migrate status

# Reset to previous state
pnpm prisma migrate resolve --rolled-back [migration_name]

# Manually undo SQL changes
# Edit database directly if critical
```

## Environment Configuration

### Production Environment Variables

**Critical** (must be set):

- `NODE_ENV=production`
- `AUTH_SECRET` (use strong random value)
- `DATABASE_URL` (auto-set by Railway)
- `REDIS_URL` (auto-set by Railway)
- `SENTRY_DSN` (error tracking)
- `API_PORT` (3001 for Railway)

**Recommended**:

- `LOG_LEVEL=info` (avoid debug in production)
- `CORS_ORIGINS=https://app.example.com` (restrict CORS)
- `RATE_LIMIT_GENERAL_WINDOW_MS=15` (window in minutes)
- `RATE_LIMIT_GENERAL_MAX=100` (requests per window)
- `DD_TRACE_ENABLED=true` (Datadog APM)

**Optional**:

- `ENABLE_AI_COMMANDS=true`
- `ENABLE_VOICE_PROCESSING=true`
- `STRIPE_API_SECRET` (if using Stripe)
- `SENDGRID_API_KEY` (if emailing)

## SSL/TLS Setup

### Automatic (Recommended)

**Railway** and **Vercel** provide automatic SSL via Let's Encrypt.

- Certificates auto-issued and renewed
- HTTPS enforced by default
- HSTS headers configured

### Manual Setup (On-Premise)

#### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone \
  -d api.example.com \
  -d www.example.com

# Certificate locations:
# /etc/letsencrypt/live/api.example.com/fullchain.pem
# /etc/letsencrypt/live/api.example.com/privkey.pem

# Auto-renewal
sudo certbot renew --dry-run
```

#### Nginx Configuration

```nginx
server {
  listen 443 ssl;
  server_name api.example.com;

  ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

  # Modern TLS configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  location / {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name api.example.com;
  return 301 https://$server_name$request_uri;
}
```

## Monitoring & Health

### Health Endpoints

```bash
# Basic health check
curl https://api.example.com/api/health

# Response:
# {
#   "uptime": 12345.67,
#   "timestamp": 1234567890,
#   "status": "ok",
#   "database": "connected",
#   "redis": "connected"
# }

# Detailed health (admin only)
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/health/detailed
```

### Monitoring Setup

**Sentry** (Error Tracking):

```bash
# Enable in production via SENTRY_DSN env var
# Errors automatically tracked
# View dashboard: https://sentry.io
```

**Datadog** (APM & Metrics):

```bash
# Enable via DD_TRACE_ENABLED=true
# View dashboard: https://datadoghq.com
```

**Winston** (Log Aggregation):

```bash
# Logs written to /var/log/infamous-freight/
#
# For cloud logging:
# - Railway: Built-in log viewer
# - Fly.io: Loki integration
# - Custom: Configure syslog transport
```

### Uptime Monitoring

Configure external uptime monitoring (Uptime Robot, StatusPage, etc.):

```
Endpoint: https://api.example.com/api/health
Frequency: Every 1 minute
Alert threshold: 3 consecutive failures
```

## Rollback Procedures

### Rollback from Railway

```bash
# View deployment history
railway logs --limit=50

# Rollback to previous commit
git revert <commit-hash>
git push origin main  # Railway will auto-deploy

# Or manually trigger Railway to deploy previous version
# Via Railway Dashboard → Deployments → Redeploy
```

### Rollback from Vercel

```bash
# Via Vercel Dashboard → Deployments → Redeploy
# Or use CLI
vercel rollback
```

### Database Rollback

**If migration failed**:

```bash
cd apps/api

# View migration status
pnpm prisma migrate status

# Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back <migration_name>

# Manually fix data if needed, then redeploy
```

## Disaster Recovery

### Backup & Restore

**PostgreSQL Backups**:

- Automated daily backups (02:00 UTC)
- Stored for 30 days
- RTO: < 1 hour
- RPO: < 15 minutes

**Manual Backup**:

```bash
# Backup production database to file
PGPASSWORD="$PASSWORD" pg_dump \
  -h $DATABASE_HOST \
  -U $DATABASE_USER \
  -d $DATABASE_NAME \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
PGPASSWORD="$PASSWORD" psql \
  -h $DATABASE_HOST \
  -U $DATABASE_USER \
  -d $DATABASE_NAME \
  < backup.sql
```

### Incident Response

**API Down**:

1. Check health: `curl https://api.example.com/api/health`
2. View logs: `railway logs` or `fly logs`
3. Check CPU/Memory: Provider dashboard
4. Restart instance: Provider dashboard → Restart
5. If DB issue: Check Sentry, review recent errors
6. Trigger failover to Fly.io if Railway unavailable

**Database Down**:

1. Check connectivity: `psql -c "SELECT 1"`
2. Check disk space: `SELECT pg_database_size(current_database())`
3. View slow queries: `SELECT * FROM pg_stat_statements LIMIT 10`
4. Restore from backup if data corruption
5. Contact managed service provider (Railway/AWS)

**Memory Leak**:

1. Monitor memory usage: `top` / Provider metrics
2. Identify process: Check API logs for memory spikes
3. Restart instance to free memory (temporary)
4. Review code for memory leaks (permanent fix)
5. Deploy fix and restart

## Verification Steps

After deployment:

1. **Health Check**: `curl https://api.example.com/api/health`
2. **Smoke Tests**: Run E2E tests against production
3. **API Docs**: Verify Swagger UI accessible
4. **Web App**: Manual test of critical flows
5. **Monitoring**: Check Sentry, Datadog dashboards
6. **Logs**: Review for errors & warnings

## Support

- **Documentation**: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- **Incident Contacts**: See `INCIDENT_RESPONSE.md`
- **Runbooks**: See specific service docs (API, Web, Mobile)
