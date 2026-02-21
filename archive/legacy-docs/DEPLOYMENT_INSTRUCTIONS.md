# Deployment Instructions — Infæmous Freight v2.2.0

**Status**: Ready for Production  
**Version**: 2.2.0  
**Commit**: 5e352fa  
**Date**: January 14, 2026

---

## ⚠️ Environment Requirements

Before deploying, ensure you have:

- **Node.js** v18+ (LTS recommended)
- **pnpm** v8.15.9+
- **Docker** & **Docker Compose** (for containerized deployment)
- **PostgreSQL** v16 (or via Docker)
- **Redis** (or via Docker)

---

## 🚀 Quick Start (Development)

### Step 1: Install Dependencies

```bash
# From repository root
pnpm install
```

This installs all dependencies for:

- `apps/api/` (Express.js backend)
- `apps/web/` (Next.js frontend)
- `packages/shared/` (Shared TypeScript library)
- `e2e/` (Playwright tests)

### Step 2: Build Shared Package

```bash
# Build the shared library (required before API startup)
pnpm --filter @infamous-freight/shared build
```

### Step 3: Start Development Servers

**Option A: Start All Services (Recommended)**

```bash
pnpm dev
```

This runs:

- API on http://localhost:4000 (or `$API_PORT`)
- Web on http://localhost:3000 (or `$WEB_PORT`)

**Option B: Start Services Separately**

Terminal 1 — API:

```bash
pnpm api:dev
# API listens on http://localhost:4000
```

Terminal 2 — Web:

```bash
pnpm web:dev
# Web listens on http://localhost:3000
```

### Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:4000/health
- **API Docs**: http://localhost:4000/api/docs
- **System Avatars**: http://localhost:4000/api/avatars/system

---

## 🐳 Docker Deployment (Production)

### Step 1: Prepare Environment

Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
POSTGRES_USER=infamous
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=infamous_freight
DATABASE_URL=postgresql://infamous:your-secure-password@postgres:5432/infamous_freight

# API
NODE_ENV=production
API_PORT=3001
AUTH_SECRET=your-jwt-secret-key

# Web
WEB_PORT=3000

# Redis
REDIS_URL=redis://redis:6379

# Payment (Stripe)
STRIPE_API_SECRET=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key

# Optional: Sentry, Datadog, etc.
SENTRY_DSN=your_sentry_url
```

### Step 2: Deploy with Docker Compose

**Production Setup** (Recommended):

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This deploys:

- **API** (Express.js) on port 3001
- **Web** (Next.js) on port 3000
- **PostgreSQL** (Database) on port 5432
- **Redis** (Cache) on port 6379

**Verify Deployment**:

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web

# Test API health
curl http://localhost:3001/health

# Stop services
docker-compose -f docker-compose.prod.yml down
```

---

## 🏗️ Full Manual Build & Start

If you prefer not to use Docker:

### Step 1: Install Global Dependencies

```bash
# Node.js (if not already installed)
# Visit: https://nodejs.org/

# pnpm
npm install -g pnpm@8

# Verify
node --version
pnpm --version
```

### Step 2: Install Project Dependencies

```bash
cd /workspaces/Infamous-freight-enterprises

# Install all workspace packages
pnpm install

# Build shared library
pnpm --filter @infamous-freight/shared build
```

### Step 3: Set Up Environment Variables

```bash
cp .env.example .env

# Edit .env with your values
# Key vars: DATABASE_URL, AUTH_SECRET, STRIPE_API_SECRET, etc.
```

### Step 4: Set Up Database

```bash
cd apps/api

# Create/migrate database
pnpm prisma:migrate:dev

# Optional: seed database
pnpm prisma:seed

# Optional: view data in Prisma Studio
pnpm prisma:studio
```

### Step 5: Build Applications

```bash
# From root

# Build shared
pnpm --filter @infamous-freight/shared build

# Build API (optional, mostly type checking)
pnpm --filter api build

# Build Web
pnpm --filter web build
```

### Step 6: Start Services

**Terminal 1 — API**:

```bash
pnpm --filter api start
# Listens on http://localhost:4000 (or $API_PORT)
```

**Terminal 2 — Web**:

```bash
pnpm --filter web start
# Listens on http://localhost:3000 (or $WEB_PORT)
```

**Terminal 3 — Database** (if not running separately):

```bash
# PostgreSQL should be running on port 5432
# Redis should be running on port 6379
# (Configure in .env)
```

---

## ✅ Post-Deployment Verification

### Health Checks

```bash
# API Health
curl http://localhost:4000/health
# Expected: {"uptime": ..., "status": "ok", "database": "connected"}

# System Avatars (no auth required)
curl http://localhost:4000/api/avatars/system
# Expected: {"success": true, "data": {"featured": [...]}}

# API Documentation
open http://localhost:4000/api/docs
```

### Run Tests

```bash
# From root

# Run all tests
pnpm test

# Run API tests only
pnpm --filter api test

# Run with coverage
pnpm --filter api test:coverage
```

### Type Check

```bash
# Verify TypeScript compilation
pnpm check:types
```

---

## 🚀 Deployment to Cloud Platforms

### Vercel (Web Frontend)

```bash
# Install Vercel CLI
pnpm add -g vercel@latest

# Deploy
cd apps/web
vercel deploy --prod

# Or: Automatic on git push to main
```

**Environment Variables** (in Vercel dashboard):

```
NEXT_PUBLIC_API_URL=https://your-api.example.com
NEXT_PUBLIC_ENV=production
```

### Fly.io (API Backend)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Launch
flyctl launch
flyctl deploy

# View logs
flyctl logs
```

### AWS / GCP / Azure

Use the provided `Dockerfile` and deploy via:

- **AWS ECS**: Push image to ECR, deploy via ECS
- **GCP Cloud Run**: Deploy containerized app
- **Azure App Service**: Deploy Docker container

---

## 🔄 Continuous Deployment (CI/CD)

### GitHub Actions

Workflows are configured in `.github/workflows/`:

1. **Test on Push** (automatic)
   - Runs linting
   - Runs tests
   - Checks types

2. **Deploy on Release** (automatic on git tag)
   - Builds Docker images
   - Pushes to registry
   - Deploys to production

### Manual CI Verification

```bash
# Lint
pnpm lint

# Type Check
pnpm check:types

# Test
pnpm test

# Build
pnpm build
```

---

## 📊 Monitoring & Logging

### Local Logging

```bash
# View API logs
docker-compose -f docker-compose.prod.yml logs -f api

# View Web logs
docker-compose -f docker-compose.prod.yml logs -f web
```

### Production Monitoring

**Sentry** (Error tracking):

- Configured in `apps/api/src/instrument.js`
- Set `SENTRY_DSN` env var

**Datadog** (APM & RUM):

- Configured in `apps/api/src/server.js` and `apps/web/pages/_app.tsx`
- Set `DD_TRACE_ENABLED`, `DD_SERVICE`, etc.

**Health Checks**:

- API: `GET /health`
- Web: Check HTTP status 200
- Database: Connection verification

---

## 🛑 Stopping Services

### Docker Compose

```bash
# Stop all services (keep data)
docker-compose -f docker-compose.prod.yml down

# Stop and remove everything
docker-compose -f docker-compose.prod.yml down -v

# Stop specific service
docker-compose -f docker-compose.prod.yml down api
```

### Manual Processes

```bash
# Kill API (port 4000)
lsof -ti:4000 | xargs kill -9

# Kill Web (port 3000)
lsof -ti:3000 | xargs kill -9

# Kill PostgreSQL (port 5432)
lsof -ti:5432 | xargs kill -9

# Kill Redis (port 6379)
lsof -ti:6379 | xargs kill -9
```

---

## 🔧 Troubleshooting

### "pnpm: command not found"

```bash
npm install -g pnpm@8
```

### "Port already in use"

```bash
# Find and kill process on port
lsof -ti:3001 | xargs kill -9  # API
lsof -ti:3000 | xargs kill -9  # Web
lsof -ti:5432 | xargs kill -9  # PostgreSQL
```

### "Database connection failed"

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml logs postgres

# Reset database
cd apps/api
pnpm prisma:migrate:reset --force
```

### "Node modules missing"

```bash
pnpm install
pnpm --filter @infamous-freight/shared build
```

### "Build fails"

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm --filter @infamous-freight/shared build
pnpm build
```

---

## 📝 Deployment Checklist

- [ ] Environment variables set (`.env` file)
- [ ] Database credentials configured
- [ ] API secret keys configured (JWT, Stripe, PayPal)
- [ ] `pnpm install` completed
- [ ] Shared package built
- [ ] Database migrated
- [ ] All tests passing
- [ ] API health check passing
- [ ] Web frontend loading
- [ ] Avatar system working
- [ ] Docker images built (if using Docker)
- [ ] Monitoring configured (Sentry, Datadog)
- [ ] Backups scheduled
- [ ] SSL/TLS configured (production)

---

## 🎯 Next Steps

1. **Choose Deployment Method**:
   - Docker Compose (simplest, recommended)
   - Manual (more control)
   - Cloud Platform (Vercel, Fly.io, etc.)

2. **Configure Environment**
   - Copy `.env.example` → `.env`
   - Fill in all required variables

3. **Deploy**
   - Follow the chosen deployment method above
   - Verify health checks pass

4. **Monitor**
   - Set up error tracking (Sentry)
   - Enable APM (Datadog)
   - Watch logs for errors

5. **Backup & Scale**
   - Schedule database backups
   - Configure CDN for static files
   - Scale API horizontally if needed

---

## 📞 Support

For detailed system information:

- See: [DEPLOYMENT_STATUS_100.md](DEPLOYMENT_STATUS_100.md)
- API Docs: http://localhost:4000/api/docs (when running)
- GitHub: https://github.com/MrMiless44/Infamous-freight-enterprises

---

**Version**: v2.2.0  
**Commit**: 5e352fa  
**Ready for Production**: ✅ YES
