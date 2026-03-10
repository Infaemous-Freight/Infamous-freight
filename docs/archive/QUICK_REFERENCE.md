# Quick Reference - Infamous Freight Enterprises

**Last Updated:** February 22, 2026  
**Version:** 2.0 (Post-Cleanup)

---

## 📋 Table of Contents

- [Essential Commands](#essential-commands)
- [Development Workflow](#development-workflow)
- [Building & Testing](#building--testing)
- [Debugging & Troubleshooting](#debugging--troubleshooting)
- [Deployment](#deployment)
- [Database Management](#database-management)
- [Performance & Optimization](#performance--optimization)
- [Codex CLI](#codex-cli)
- [Common Issues & Solutions](#common-issues--solutions)

---

## Essential Commands

### Installation & Setup

```bash
# Install dependencies
pnpm install

# Build shared package (required after type changes)
pnpm --filter @infamous-freight/shared build

# Install pre-commit hooks
husky install
```

### Start Development

```bash
# Start all services (API, Web, default ports)
pnpm dev

# Start API only (port 3001 in Docker, 4000 standalone)
pnpm api:dev

# Start Web only (port 3000)
pnpm web:dev

# Start with custom ports
API_PORT=5000 WEB_PORT=3001 pnpm dev
```

### Port Management

```bash
# Kill processes on specific ports (API: 3001, Web: 3000)
lsof -ti:3001 | xargs kill -9   # Kill API
lsof -ti:3000 | xargs kill -9   # Kill Web

# Check what's running on ports
lsof -i :3001
lsof -i :3000
```

---

## Development Workflow

### Creating Features

1. **Create branch from `main`**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - API changes: `apps/api/src/`
   - Web changes: `apps/web/`
   - Shared types: `packages/shared/src/types.ts`

3. **Test & validate**
   ```bash
   pnpm typecheck    # Type check all packages
   pnpm lint         # Lint code
   pnpm test         # Run unit tests
   pnpm build        # Build for production
   ```

4. **Commit with conventional format**
   ```bash
   git commit -m "feat(api): add new shipment endpoint"
   git commit -m "fix(web): resolve form validation bug"
   git commit -m "chore: update dependencies"
   ```

5. **Push & create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub (Husky hooks will auto-validate)
   ```

### Shared Package Changes

⚠️ **CRITICAL**: When modifying `packages/shared/src/types.ts`, `constants.ts`, or `utils.ts`:

```bash
# 1. Modify files
nano packages/shared/src/types.ts

# 2. Rebuild shared
pnpm --filter @infamous-freight/shared build

# 3. Restart services (types are now available)
pnpm dev
```

### Code Quality

```bash
# Format all code
pnpm format

# Check linting
pnpm lint

# Fix linting issues
pnpm lint --fix

# Type checking
pnpm check:types

# All checks (lint + type + test)
pnpm validate
```

---

## Building & Testing

### Running Tests

```bash
# All tests
pnpm test

# API tests only
pnpm --filter api test

# Watch mode (re-run on changes)
pnpm test --watch

# Coverage report
pnpm test --coverage
# HTML report: apps/api/coverage/index.html
```

### Test Coverage

API enforces ~75-84% coverage. View HTML report:

```bash
pnpm test --coverage
open apps/api/coverage/index.html  # macOS
xdg-open apps/api/coverage/index.html  # Linux
```

### Building for Production

```bash
# Full production build (all packages)
pnpm build

# Build specific package
pnpm --filter api build
pnpm --filter web build

# Build Web bundle analysis
cd apps/web
ANALYZE=true pnpm build
```

### Docker Build & Run

```bash
# Build Docker image
docker-compose build

# Start services (API + Web + Postgres)
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f api    # API logs
docker-compose logs -f web    # Web logs

# Stop services
docker-compose down

# Clean up (removes volumes)
docker-compose down -v
```

---

## Debugging & Troubleshooting

### Enable Debug Logging

```bash
# Set log level
LOG_LEVEL=debug pnpm api:dev
LOG_LEVEL=debug pnpm web:dev

# Verbose output
DEBUG=* pnpm dev
```

### Check Environment

```bash
# Verify .env file
cat .env

# Check critical env vars
echo "API_PORT: $API_PORT"
echo "WEB_PORT: $WEB_PORT"
echo "AI_PROVIDER: $AI_PROVIDER"
```

### Monitor Services

```bash
# Watch API logs
pnpm api:dev 2>&1 | grep -i error

# Check process status
ps aux | grep node

# System resource usage
top -p $(pgrep -f "node" | tr '\n' ',')
```

### Clear Cache & Rebuild

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Next.js cache
rm -rf apps/web/.next

# Reset Prisma
cd apps/api && pnpm prisma migrate reset --force

# Full clean rebuild
pnpm clean && pnpm install && pnpm build
```

---

## Debugging & Troubleshooting

### Common TypeScript Errors

**Error: Cannot find module '@infamous-freight/shared'**
- Solution: Rebuild shared package
  ```bash
  pnpm --filter @infamous-freight/shared build
  ```

**Error: Type mismatch in API response**
- Solution: Ensure types are imported from `@infamous-freight/shared`
  ```typescript
  import { ApiResponse, Shipment } from '@infamous-freight/shared';
  ```

**Error: Pre-push hook failed**
- Solution: Fix issues detected by hooks
  ```bash
  pnpm lint --fix
  pnpm typecheck
  pnpm test
  ```

### Common Port Conflicts

**Error: EADDRINUSE: address already in use**

```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9

# Or use different port
API_PORT=4001 WEB_PORT=3001 pnpm dev
```

### Database Issues

**Postgres connection failed**

```bash
# Restart Docker services
docker-compose down
docker-compose up -d postgres

# Check database status
cd apps/api && pnpm prisma db push
```

**Migration conflicts**

```bash
# Reset database (WARNING: Destructive)
cd apps/api && pnpm prisma migrate reset --force

# Or update migrations
cd apps/api && pnpm prisma migrate dev --name describe_change
```

### Memory Issues

```bash
# Increase Node heap size
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# Monitor memory usage
node --trace-gc apps/api/src/server.js 2>&1 | grep GC
```

---

## Deployment

### Pre-Deployment Checklist

```bash
# 1. Type checking
pnpm typecheck        # ✅ Must pass

# 2. Linting
pnpm lint            # ✅ Must pass

# 3. Tests
pnpm test            # ✅ Must pass

# 4. Build production
pnpm build           # ✅ Must succeed

# 5. Security audit
pnpm audit           # ✅ Review vulnerabilities
```

### Staging Deployment

```bash
# Build for staging
pnpm build

# Deploy Web to Vercel (staging branch)
git push origin feature/branch-name

# Deploy API to Railway/Fly.io
# CI/CD handles automatic deployment from main

# Verify deployment
curl https://staging-api.infamous-freight.com/api/health
```

### Production Deployment

```bash
# Merge PR to main (triggers CI/CD)
git checkout main
git pull origin main

# Verify deployments completed
curl https://api.infamous-freight.com/api/health
curl https://infamous-freight-enterprises.vercel.app/

# Monitor errors
# Sentry: https://sentry.io/ (configured in code)
```

### Rollback (if needed)

```bash
# API rollback (Git revert + redeploy)
git revert HEAD
git push origin main  # CI/CD triggers redeployment

# Web rollback (Vercel)
# Use Vercel dashboard to revert to previous deployment
```

---

## Database Management

### Prisma Commands

```bash
# View data in GUI
cd apps/api && pnpm prisma studio

# Create migration
cd apps/api && pnpm prisma migrate dev --name add_field_name

# Apply pending migrations
cd apps/api && pnpm prisma migrate deploy

# Reset database (destructive!)
cd apps/api && pnpm prisma migrate reset --force

# Generate Prisma client
cd apps/api && pnpm prisma generate

# Check migration status
cd apps/api && pnpm prisma migrate status
```

### Database Backups

```bash
# Backup production database
pg_dump postgresql://user:pass@host:5432/db > backup.sql

# Restore from backup
psql postgresql://user:pass@host:5432/db < backup.sql
```

---

## Performance & Optimization

### Bundle Analysis

```bash
# Next.js bundle analysis
cd apps/web
ANALYZE=true pnpm build
# Opens browser with interactive visualization
```

### Performance Monitoring

```bash
# Lighthouse audit
cd apps/web
pnpm build && pnpm start &
npx lighthouse http://localhost:3000 --view

# Check Core Web Vitals
# Dashboard: Vercel Analytics / Datadog RUM
```

### Database Query Optimization

```bash
# Enable query logging
DATABASE_URL="..." LOG_LEVEL=debug pnpm api:dev

# Use Prisma Studio to inspect queries
cd apps/api && pnpm prisma studio
```

---

## Codex CLI

The Codex CLI is an AI coding agent available in the dev container for interactive code generation and analysis.

### Interactive Mode

```bash
# Start interactive Codex session
codex

# Type your request:
# Example: "Generate a TypeScript function to validate email"
# Codex will execute AI-powered code generation
```

### CLI Commands

```bash
# Get help
codex --help

# Execute a single command
codex exec "Write a React component for loading spinner"

# Run with custom model
codex exec --model claude "Refactor this function for performance"

# View available options
codex config
```

### VS Code Integration

- **Keyboard Shortcut**: `Ctrl+Shift+C` (Opens Codex interactive mode)
- **Command Palette**: `Cmd+Shift+P` → Search "Codex: Start"

### Example Use Cases

```bash
# Generate API endpoint
codex "Create a POST endpoint for creating shipments with validation"

# Fix errors
codex "Fix TypeScript errors in apps/web/pages/dashboard.tsx"

# Optimize code
codex "Optimize database queries in shipments service"

# Write tests
codex "Write unit tests for the authentication middleware"

# Documentation
codex "Generate JSDoc comments for UserService class"
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Build fails: "Cannot find module"** | `pnpm install && pnpm build` |
| **Shared types not updating** | `pnpm --filter @infamous-freight/shared build` |
| **Pre-push hook fails** | `pnpm lint --fix && pnpm typecheck` |
| **Port already in use** | `lsof -ti:PORT \| xargs kill -9` |
| **Docker won't start** | `docker-compose down && docker-compose up` |
| **Tests timeout** | Increase timeout: `jest --testTimeout=10000` |
| **API returns 401** | Check JWT_SECRET and token validity |
| **Rate limit exceeded** | Wait 15 minutes or check rate limiter config |
| **Prisma migr ation conflict** | `cd apps/api && pnpm prisma migrate reset` |
| **Memory issues** | `NODE_OPTIONS="--max-old-space-size=4096" pnpm build` |

---

## Environment Variables Quick Reference

### API (.env)

```bash
# Server
API_PORT=4000                    # Default: 4000 (3001 in Docker)
NODE_ENV=development             # development|staging|production

# Database
DATABASE_URL="postgresql://..."  # Prisma connection string

# Auth
JWT_SECRET="your-secret-key"     # Used in tests: "test-secret"
JWT_EXPIRY=86400                 # Token expiry in seconds

# AI
AI_PROVIDER=synthetic            # openai|anthropic|synthetic
OPENAI_API_KEY=...              # (if using OpenAI)

# Voice
VOICE_MAX_FILE_SIZE_MB=10        # Default: 10MB

# Billing
STRIPE_SECRET_KEY=...            # Stripe Secret
STRIPE_API_VERSION=2026-01-28    # Latest tested version

# CORS
CORS_ORIGINS=http://localhost:3000  # Comma-separated list

# Logging
LOG_LEVEL=info                   # debug|info|warn|error
```

### Web (.env)

```bash
# Server
WEB_PORT=3000                    # Default: 3000

# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000  # API endpoint

# Analytics
NEXT_PUBLIC_ENV=production        # Enables analytics
NEXT_PUBLIC_DD_APP_ID=...        # Datadog RUM
NEXT_PUBLIC_DD_CLIENT_TOKEN=...
NEXT_PUBLIC_DD_SITE=datadoghq.com
```

---

## Resources

- **API Documentation**: See `apps/api/README.md`
- **Frontend Documentation**: See `apps/web/README.md`
- **Architecture Decisions**: See `ARCHITECTURE_DECISIONS.md`
- **Contributing Guide**: See `CONTRIBUTING.md`
- **Copilot Instructions**: See `.github/copilot-instructions.md`
- **Security Policy**: See `SECURITY.md`
- **Vulnerability Audit**: See `VULNERABILITY-AUDIT-REPORT.md`
- **Troubleshooting**: See `TROUBLESHOOTING_GUIDE.md`

---

## Support & Questions

- **Documentation**: Check [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- **Issues**: File GitHub issues with reproducible steps
- **Security**: Report vulnerabilities via [SECURITY.md](SECURITY.md)
- **Code Review**: See [CONTRIBUTING.md](CONTRIBUTING.md#code-review-process)

---

**Quick Wins to Get Started:**
1. `pnpm install` - Install dependencies
2. `pnpm dev` - Start dev environment  
3. `pnpm typecheck` - Verify types
4. `pnpm test` - Run tests
5. `codex` - Launch AI code assistant

**Happy coding!** 🚀
