# Infæmous Freight - Deployment & Operations Guide

**Version**: 2.0.0 | **Status**: Production-Ready | **Last Updated**: December 30, 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [System Requirements](#system-requirements)
3. [Development Environment Setup](#development-environment-setup)
4. [Building for Production](#building-for-production)
5. [Deployment Pipelines](#deployment-pipelines)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)
8. [Production Checklist](#production-checklist)

---

## Quick Start

### One-Command Setup (Development)

```bash
# Clone repository
git clone https://github.com/MrMiless44/Infamous-freight-enterprises.git
cd Infamous-freight-enterprises

# Run setup script
./setup.sh

# Start development servers (all)
pnpm dev

# OR start specific services
pnpm api:dev      # API only (localhost:4000)
pnpm web:dev      # Web only (localhost:3000)
```

### One-Command Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @infamous-freight/api build
pnpm --filter @infamous-freight/web build
```

---

## System Requirements

### Minimum (Development)

| Component     | Version | Notes                           |
| ------------- | ------- | ------------------------------- |
| Node.js       | 20+     | LTS recommended                 |
| pnpm          | 8.15.9+ | Fast package manager            |
| PostgreSQL    | 14+     | Can use Docker Compose          |
| RAM           | 8GB     | 16GB recommended for full dev   |
| Disk Space    | 5GB     | For node_modules, caches       |

### Production (Vercel + Docker)

| Component     | Details                      |
| ------------- | ---------------------------- |
| Frontend      | Vercel (auto-deploy)         |
| Backend       | Docker/Railway/Heroku/Fly.io |
| Database      | PostgreSQL 14+ managed       |
| Cache         | Redis (optional, for scaling)|
| CDN           | Vercel Edge Network          |

---

## Development Environment Setup

### 1. Prerequisites

```bash
# Install Node (macOS)
brew install node@20

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# Verify installations
node --version   # v20.x.x
pnpm --version   # 8.15.9+
```

### 2. Clone & Setup

```bash
git clone https://github.com/MrMiless44/Infamous-freight-enterprises.git
cd Infamous-freight-enterprises

# Copy environment template
cp .env.example .env
cp .env.example .env.local

# Edit with your values
nano .env
```

### 3. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Build shared package (important!)
pnpm --filter @infamous-freight/shared build

# Generate Prisma client
cd apps/api
pnpm prisma:generate
```

### 4. Setup Database

```bash
# Option A: Use Docker Compose
docker-compose up -d db

# Option B: Use existing PostgreSQL
export DATABASE_URL="postgresql://user:password@localhost:5432/infamousfreight"

# Run migrations
cd apps/api
pnpm prisma:migrate:dev --name init

# Optional: Seed database
pnpm prisma:seed
```

### 5. Start Development

```bash
# Terminal 1: Start API server
pnpm api:dev
# API running on http://localhost:4000

# Terminal 2: Start Web server
pnpm web:dev
# Web running on http://localhost:3000

# Terminal 3: Optional - Prisma Studio
cd apps/api && pnpm prisma:studio
# Database UI on http://localhost:5555
```

---

## Building for Production

### Frontend (Next.js → Vercel)

```bash
# Build Next.js application
cd apps/web
pnpm build

# Test production build locally
pnpm start

# Deploy to Vercel (automatic on push)
git push origin main
# Check: https://vercel.com/dashboard
```

### Backend (Express.js)

```bash
# Build Express API
cd apps/api
pnpm build

# Build Docker image
docker build -t infamousfreight/api:latest .

# Test locally
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  infamousfreight/api:latest

# Push to registry (GHCR)
docker tag infamousfreight/api:latest \
  ghcr.io/mrmiles44/infamous-freight/api:latest

docker push ghcr.io/mrmiles44/infamous-freight/api:latest
```

### Full Monorepo Build

```bash
# Clean and rebuild everything
pnpm clean
pnpm install
pnpm build

# Test everything
pnpm test

# Check types
pnpm check:types

# Lint and format
pnpm lint
pnpm format
```

---

## Deployment Pipelines

### Automatic Deployments (GitHub Actions)

| Workflow                 | Trigger      | Action                          |
| ------------------------ | ------------ | ------------------------------- |
| Quality Checks           | Every push   | Run tests, lint, type check     |
| CodeQL Security          | Weekly + PR  | Vulnerability scanning          |
| Docker Build (GHCR)      | Tag push     | Build & push Docker image       |
| Vercel Deploy (Staging)  | Push to main | Deploy to staging environment   |
| Vercel Deploy (Prod)     | Tag release  | Deploy to production            |

### Manual Deployment

#### Deploy Frontend (Vercel)

```bash
# Simply push to main branch
git add .
git commit -m "feat: New feature"
git push origin main

# OR use Vercel CLI
pnpm add -g vercel@latest
vercel --prod

# Monitor deployment
# https://vercel.com/dashboard
```

#### Deploy Backend (Docker → Platform)

**Option A: Railway.app**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway up

# Check deployment
railway logs
```

**Option B: Fly.io**

```bash
# Install Flyctl
brew install flyctl

# Login and deploy
flyctl auth login
flyctl deploy

# Check deployment
flyctl status
flyctl logs
```

**Option C: Heroku**

```bash
# Install Heroku CLI
brew install heroku

# Login and deploy
heroku login
git push heroku main

# Check deployment
heroku logs --tail
```

**Option D: Docker Compose (Self-hosted)**

```bash
# Build and run locally
docker-compose -f docker-compose.prod.yml up -d

# OR deploy to remote server
docker-compose -f docker-compose.prod.yml up -d

# Verify services
docker ps
curl http://localhost:3001/api/health
```

---

## Monitoring & Health Checks

### Health Check Endpoint

```bash
# API Health
curl http://localhost:4000/api/health

# Response:
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": 1704067200000,
  "database": "connected"
}
```

### Logs

```bash
# Development
tail -f apps/api/combined.log        # Combined logs
tail -f apps/api/error.log           # Errors only

# Production (Docker)
docker logs -f <container-id>

# Vercel
# https://vercel.com/dashboard → Deployments → Logs
```

### Performance Monitoring

```bash
# Bundle analysis
cd apps/web && ANALYZE=true pnpm build

# Database query performance
cd apps/api && pnpm prisma:studio

# API response times
# Built-in metrics at GET /api/metrics (if enabled)
```

---

## Troubleshooting

### Issue: "pnpm not found"

```bash
# Solution 1: Install pnpm globally
npm install -g pnpm@8.15.9

# Solution 2: Use corepack (Node 16.9+)
corepack enable
corepack prepare pnpm@8.15.9 --activate
```

### Issue: "Cannot find module '@prisma/client'"

```bash
cd apps/api
pnpm prisma:generate
```

### Issue: "PostgreSQL connection refused"

```bash
# Check if database is running
docker ps | grep db

# Start database
docker-compose up -d db

# Check connection string in .env
echo $DATABASE_URL
```

### Issue: "Port 3000/4000 already in use"

```bash
# Find process using port
lsof -i :3000
lsof -i :4000

# Kill process
kill -9 <PID>

# OR use different ports
API_PORT=4001 pnpm api:dev
WEB_PORT=3001 pnpm web:dev
```

### Issue: "Tests failing"

```bash
# Clear cache and reinstall
pnpm clean
pnpm install

# Run tests with verbose output
pnpm test -- --verbose

# Run specific test
pnpm test -- apps/api/__tests__/health.test.ts
```

---

## Production Checklist

### Pre-Deployment

- [ ] All tests passing: `pnpm test`
- [ ] No TypeScript errors: `pnpm check:types`
- [ ] No linting errors: `pnpm lint`
- [ ] Code formatted: `pnpm format`
- [ ] Git status clean: `git status`
- [ ] All changes committed: `git log`
- [ ] Environment variables set: Check `.env.production`

### During Deployment

- [ ] Monitor CI/CD pipeline: GitHub Actions dashboard
- [ ] Check Vercel deployment: https://vercel.com/dashboard
- [ ] Verify API build: Docker image built and pushed
- [ ] Database migrations applied: Check migration logs

### Post-Deployment

- [ ] Frontend loads: Visit production URL
- [ ] API responding: Check `/api/health`
- [ ] Database connected: Health endpoint shows `"database": "connected"`
- [ ] No errors in logs: Check Vercel + backend logs
- [ ] Smoke tests passing: Test critical user flows

### Monitoring

- [ ] Set up error tracking (Sentry already configured)
- [ ] Monitor performance metrics
- [ ] Set up uptime monitoring: https://uptime-robot.com
- [ ] Configure alerts for failures

---

## Company Information

| Field        | Value                                   |
| ------------ | --------------------------------------- |
| Company      | Infæmous Freight                        |
| Owner        | Santorio Djuan Miles                    |
| Status       | Sole Proprietor / LLC (Oklahoma)        |
| License      | Proprietary - All Rights Reserved       |
| Version      | 2.0.0                                   |
| Repository   | https://github.com/MrMiless44/...       |
| Production   | https://infamousfreight.vercel.app      |
| Support      | [Contact information]                   |

---

## Legal & Compliance

- 📄 **License**: See [LICENSE](./LICENSE)
- 📋 **Copyright**: See [COPYRIGHT](./COPYRIGHT)
- ⚖️ **Legal Notice**: See [LEGAL_NOTICE.md](./LEGAL_NOTICE.md)
- 👥 **Authors**: See [AUTHORS](./AUTHORS)
- 🔐 **Security Policy**: See [SECURITY.md](./SECURITY.md)

---

## Support & Contact

For deployment questions, issues, or support:

1. Check [Troubleshooting](#troubleshooting) section
2. Review GitHub Issues: https://github.com/MrMiless44/Infamous-freight-enterprises/issues
3. Check GitHub Discussions for Q&A
4. Contact: [Owner contact information]

---

**Last Updated**: December 30, 2025  
**Status**: Production-Ready ✅  
**Version**: v2.0.0
