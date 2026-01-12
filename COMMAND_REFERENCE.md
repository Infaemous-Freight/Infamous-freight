# 🛠️ Infamous Freight Enterprises — Complete Command Reference

**Version**: 2.1.0  
**Status**: ✅ Production Live  
**Date**: January 12, 2026

---

## 🚀 Quick Start

```bash
# Start all services (web + API + database)
pnpm dev

# Start API only
pnpm dev:api
```

---

## 📦 Development Commands

| Command          | Description                             | Location |
| ---------------- | --------------------------------------- | -------- |
| `pnpm dev`       | Start all services (web, API, database) | Root     |
| `pnpm dev:api`   | Start API server only                   | Root     |
| `pnpm start`     | Production API startup                  | Root     |
| `pnpm start:api` | Production API startup (explicit)       | Root     |

---

## 🏗️ Building Commands

| Command             | Description                | Runs                      |
| ------------------- | -------------------------- | ------------------------- |
| `pnpm build`        | Build shared package + API | `packages/shared` → `api` |
| `pnpm build:shared` | Build shared package only  | `packages/shared`         |
| `pnpm build:api`    | Build API only             | `api`                     |
| `pnpm clean`        | Remove all node_modules    | Root                      |

---

## ✅ Testing Commands

| Command              | Description                | Framework  | Location         |
| -------------------- | -------------------------- | ---------- | ---------------- |
| `pnpm test`          | Run unit tests             | Jest       | `api/__tests__/` |
| `pnpm test:api`      | Run API unit tests (alias) | Jest       | `api/__tests__/` |
| `pnpm test:e2e`      | Run E2E tests              | Playwright | `tests/e2e/`     |
| `pnpm test:coverage` | Generate coverage report   | Jest       | `api/coverage/`  |

### Test Suites Available

**Unit Tests** (10 suites, 50+ tests):

- Health checks (3 tests)
- AI commands (8 tests)
- Billing (6 tests)
- Voice (5 tests)
- Users (7 tests)
- Shipments (8 tests)
- AI Synthetic (4 tests)
- Metrics (2 tests)
- Validation (4 tests)
- Error handler (3 tests)

**E2E Tests** (6 suites, 24+ tests):

- Homepage (3 tests)
- Auth flow (4 tests)
- Payment flow (4 tests)
- API integration (3 tests)
- Shipments (5 tests)
- Shipment tracking (5 tests)

### Running Specific Tests

```bash
# Run API unit tests with watch mode
cd api && npm run test:watch

# Run tests with coverage
pnpm test:coverage

# View coverage HTML report
open api/coverage/index.html

# Run E2E tests
pnpm test:e2e

# View E2E report
open playwright-report/index.html
```

---

## 🗄️ Database Commands

| Command                   | Description                  | Tool   | Location                |
| ------------------------- | ---------------------------- | ------ | ----------------------- |
| `pnpm prisma:migrate:dev` | Create & apply new migration | Prisma | `api/prisma/`           |
| `pnpm prisma:migrate`     | Apply existing migrations    | Prisma | `api/prisma/`           |
| `pnpm prisma:generate`    | Generate Prisma client       | Prisma | `api/prisma/`           |
| `pnpm prisma:studio`      | Open Prisma Studio UI        | Prisma | `http://localhost:5555` |

### Database Workflow

```bash
# 1. Create/edit schema
# Edit: api/prisma/schema.prisma

# 2. Create migration
pnpm prisma:migrate:dev --name add_feature_name

# 3. Generate Prisma client
pnpm prisma:generate

# 4. Verify in Prisma Studio
pnpm prisma:studio

# 5. Seed data (optional)
cd api && npm run prisma:seed
```

---

## 📋 Code Quality Commands

| Command          | Description             | Tool       | Scans                       |
| ---------------- | ----------------------- | ---------- | --------------------------- |
| `pnpm lint`      | Check code quality      | ESLint     | `api/`                      |
| `pnpm lint:fix`  | Auto-fix linting issues | ESLint     | `api/`                      |
| `pnpm typecheck` | Check TypeScript types  | TypeScript | `packages/shared/` + `api/` |

### Pre-commit Hooks

Git hooks are configured via Husky:

- **Pre-commit**: ESLint + Prettier
- **Commit-msg**: Validate message format
- **Pre-push**: Tests + linting

```bash
# Bypass hooks (use carefully!)
git commit --no-verify
git push --no-verify
```

---

## 🚀 Deployment Commands

### Web Frontend (Vercel)

```bash
# Automatic: Push to main triggers CI/CD
git push origin main

# Manual Vercel deployment
vercel deploy --prod

# View deployment logs
vercel logs https://mrmiless44-genesis.vercel.app
```

### API Backend (Fly.dev)

```bash
# Build Docker image and deploy
flyctl deploy --remote-only

# Requires: flyctl auth login (one-time)
flyctl auth login

# View deployment status
flyctl status -a infamous-freight-api

# View live logs
flyctl logs -a infamous-freight-api

# Scale machines
flyctl scale count 3 -a infamous-freight-api

# SSH into machine
flyctl ssh console -a infamous-freight-api

# Monitor metrics
flyctl metrics -a infamous-freight-api
```

### CI/CD Pipeline (GitHub Actions)

Triggered automatically on `git push origin main`:

1. **Lint** — ESLint check
2. **Type Check** — TypeScript validation
3. **Tests** — Jest unit tests + coverage
4. **Build** — Next.js + API build
5. **Vercel Deploy** — Web deployment (auto)
6. **Post-Deploy Health** — API + Web health checks

View at: `https://github.com/MrMiless44/Infamous-freight-enterprises/actions`

---

## 🐳 Docker Commands

| Command               | Description       | Effect                         |
| --------------------- | ----------------- | ------------------------------ |
| `pnpm docker:up`      | Start services    | `docker-compose up -d`         |
| `pnpm docker:down`    | Stop services     | `docker-compose down`          |
| `pnpm docker:logs`    | Stream logs       | `docker-compose logs -f`       |
| `pnpm docker:rebuild` | Rebuild & restart | `docker-compose up -d --build` |

### Docker Compose Services

```yaml
# Services in docker-compose.yml:
services:
  api: # Express API on port 4000
  web: # Next.js on port 3000
  postgres: # PostgreSQL on port 5432
  redis: # Redis (optional, on port 6379)
```

### Manual Docker Commands

```bash
# Build API image
docker build -f Dockerfile.fly -t infamous-freight-api .

# Run container locally
docker run -p 4000:4000 -e NODE_ENV=development infamous-freight-api

# View images
docker images | grep infamous

# Remove image
docker rmi infamous-freight-api
```

---

## 🔍 Verification Commands

```bash
# Check Node version
node --version  # Should be ≥22.16.0

# Check pnpm version
pnpm --version  # Should be ≥8.15.9

# Check installed dependencies
pnpm list --depth=0

# Verify API server
curl http://localhost:4000/api/health

# Verify web frontend
curl http://localhost:3000

# Check environment variables
env | grep -E "JWT_SECRET|API_PORT|NODE_ENV"

# List running processes
ps aux | grep "node\|next"

# Check ports in use
lsof -i :3000    # Web
lsof -i :4000    # API
lsof -i :5432    # PostgreSQL
lsof -i :6379    # Redis
```

---

## 🔧 Troubleshooting Commands

```bash
# Clear all caches and reinstall
pnpm clean && pnpm install

# Kill all Node processes
killall node

# Kill specific port
lsof -ti:3000 | xargs kill -9  # Web
lsof -ti:4000 | xargs kill -9  # API
lsof -ti:5432 | xargs kill -9  # PostgreSQL

# Reset Prisma database
cd api && pnpm prisma migrate reset --force

# View environment file
cat .env.local

# Test API health
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/health

# Generate test JWT
node -e "console.log(require('jsonwebtoken').sign({sub:'test', scopes:['ai:command']}, process.env.JWT_SECRET))"

# View logs in real-time
tail -f /var/log/syslog | grep infamous
```

---

## 📊 Monitoring Commands

```bash
# API Health
curl https://infamous-freight-api.fly.dev/api/health

# Web Uptime
curl -I https://mrmiless44-genesis.vercel.app

# Fly.dev Metrics
flyctl metrics -a infamous-freight-api

# Check Sentry Errors
# https://sentry.io/organizations/infamous/issues/

# Vercel Analytics
# https://vercel.com/dashboard

# Docker Compose Status
docker-compose ps

# Database Connection
psql postgresql://user:password@localhost/infamous_freight
```

---

## 🎯 Common Workflows

### Local Development

```bash
# 1. Start all services
pnpm dev

# 2. Make code changes
# Edit files in api/src/, web/pages/, etc.

# 3. Watch for changes (hot reload active)
# Services auto-reload on file save

# 4. Test your changes
pnpm test
pnpm test:e2e

# 5. Check code quality
pnpm lint
pnpm typecheck

# 6. Commit and push (triggers CI/CD)
git add .
git commit -m "feat: your feature"
git push origin main
```

### Database Migration

```bash
# 1. Edit schema
# File: api/prisma/schema.prisma

# 2. Create and apply migration
pnpm prisma:migrate:dev --name descriptive_name

# 3. Generate client
pnpm prisma:generate

# 4. Test migration
pnpm test

# 5. Commit migration files
git add api/prisma/migrations/
git commit -m "db: add migration"
git push origin main
```

### Bug Fix Deployment

```bash
# 1. Create fix branch (optional)
git checkout -b fix/bug-name

# 2. Fix code
# Edit files

# 3. Test fix
pnpm test

# 4. Commit with conventional message
git commit -m "fix: bug description"

# 5. Push to deploy
git push origin main  # Or create PR for review

# 6. Monitor deployment
# View: https://github.com/MrMiless44/Infamous-freight-enterprises/actions
# Web: https://mrmiless44-genesis.vercel.app
# API: https://infamous-freight-api.fly.dev
```

### Performance Debugging

```bash
# Check bundle size
cd web && pnpm build && du -sh .next

# Analyze dependencies
cd api && npm ls

# Performance profile API
NODE_OPTIONS="--prof" pnpm start:api
node --prof-process isolate-*.log > profile.txt

# Check memory usage
ps aux | grep node

# Monitor real-time
top -p $(pgrep node)
```

---

## 📚 File Reference

| File                       | Purpose                     | Edit For                 |
| -------------------------- | --------------------------- | ------------------------ |
| `package.json`             | Root scripts                | Adding new commands      |
| `api/package.json`         | API dependencies            | Adding packages, scripts |
| `web/package.json`         | Web dependencies            | Web packages, scripts    |
| `api/prisma/schema.prisma` | Database schema             | Adding/modifying models  |
| `.env.example`             | Env template                | Reference for vars       |
| `.env.local`               | Local secrets (git-ignored) | Development credentials  |
| `docker-compose.yml`       | Local services              | Service config           |
| `Dockerfile.fly`           | Production image            | Docker optimization      |
| `fly.toml`                 | Fly.dev config              | Deployment settings      |
| `vercel.json`              | Vercel config               | Build, deploy settings   |
| `.github/workflows/`       | CI/CD pipelines             | Automation rules         |

---

## 🌐 Live Services

| Service               | URL                                      | Command to Verify                                      |
| --------------------- | ---------------------------------------- | ------------------------------------------------------ |
| **Web Frontend**      | https://mrmiless44-genesis.vercel.app    | `curl -I https://mrmiless44-genesis.vercel.app`        |
| **API Backend**       | https://infamous-freight-api.fly.dev     | `curl https://infamous-freight-api.fly.dev/api/health` |
| **Local API**         | http://localhost:4000                    | `curl http://localhost:4000/api/health`                |
| **Local Web**         | http://localhost:3000                    | `curl http://localhost:3000`                           |
| **Prisma Studio**     | http://localhost:5555                    | `pnpm prisma:studio`                                   |
| **Sentry Errors**     | https://sentry.io                        | Dashboard only                                         |
| **Vercel Dashboard**  | https://vercel.com/dashboard             | Dashboard only                                         |
| **Fly.dev Dashboard** | https://fly.io/apps/infamous-freight-api | Dashboard only                                         |

---

## ⚡ Performance Tips

```bash
# Fast build (skip tests)
pnpm build && pnpm start:api

# Fast tests (no coverage)
pnpm test

# Fast E2E (single browser)
cd tests/e2e && npx playwright test --project=chromium

# Dev with only API (skip web)
pnpm dev:api

# Rebuild Docker image only
docker build -f Dockerfile.fly -t infamous-freight-api .

# Skip git hooks on commit
git commit --no-verify
```

---

## 🔐 Security

```bash
# Validate environment variables
pnpm validate:env

# Check for exposed secrets
git log -p --all -S "password\|token\|secret" | head -20

# Audit dependencies
npm audit
pnpm audit

# Update to latest versions
pnpm update --interactive
```

---

## ✅ Pre-Deployment Checklist

```bash
# 1. Run all tests
pnpm test && pnpm test:e2e

# 2. Check code quality
pnpm lint && pnpm typecheck

# 3. Build for production
pnpm build

# 4. Verify environment
cat .env.local | wc -l  # Should have required vars

# 5. Test locally
pnpm start:api &
# Verify: curl http://localhost:4000/api/health

# 6. Check git status
git status

# 7. Push to deploy
git push origin main
```

---

## 📞 Help & Support

```bash
# View script help
npm run --help

# View pnpm help
pnpm --help

# Check Node version compatibility
node --version

# Update tools
pnpm install -g pnpm@latest
npm install -g npm@latest

# Clear cache
pnpm cache clean
npm cache clean --force
```

---

**Status**: ✅ All commands verified and operational  
**Version**: 2.1.0  
**Last Updated**: January 12, 2026

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  🚀 Ready for development and deployment       │
│                                                 │
│  Use: pnpm dev           (start all)           │
│  Use: pnpm test          (run tests)           │
│  Use: git push origin    (deploy)              │
│                                                 │
└─────────────────────────────────────────────────┘
```
