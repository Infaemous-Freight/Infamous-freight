# Deployment Runbook

## Prerequisites

- [ ] All tests passing (`pnpm test`)
- [ ] Staging deployment verified
- [ ] Database migrations reviewed
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

## Pre-Deployment Checklist

```bash
# 1. Ensure working directory is clean
git status
git diff

# 2. Verify all tests pass
pnpm test
pnpm check:types
pnpm lint

# 3. Build all packages
pnpm build

# 4. Verify migrations are ready
cd api && pnpm prisma:migrate:status
```

## Deployment Steps

### Step 1: Apply Database Migrations

```bash
cd api

# Show pending migrations
pnpm prisma:migrate:status

# Apply migrations (may take minutes for large tables)
pnpm prisma:migrate:deploy

# Verify migration success
pnpm prisma:generate
```

### Step 2: Deploy API to Production

```bash
# Using Fly.io
flyctl deploy -a infamous-freight-api

# Monitor deployment
flyctl status -a infamous-freight-api

# Check logs
flyctl logs -a infamous-freight-api

# Verify health check
curl https://api.infamous-freight.com/api/health
```

### Step 3: Deploy Web to Production

```bash
# Push to main (Vercel auto-deploys)
git push origin main

# Monitor on Vercel dashboard
# https://vercel.com/infamous-freight-enterprises

# Verify deployment
curl https://infamous-freight-enterprises.vercel.app
```

### Step 4: Smoke Tests

```bash
# Test critical APIs
curl -H "Authorization: Bearer $TOKEN" \
  https://api.infamous-freight.com/api/health/detailed

# Check response times
time curl -H "Authorization: Bearer $TOKEN" \
  https://api.infamous-freight.com/api/shipments

# Verify auth flow
curl -X POST https://api.infamous-freight.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"..."}'
```

## Rollback Steps (If Needed)

### If API Deployment Fails

```bash
# Rollback to previous version
flyctl releases -a infamous-freight-api
flyctl releases rollback -a infamous-freight-api

# Verify rollback
curl https://api.infamous-freight.com/api/health
```

### If Database Migration Fails

```bash
# DO NOT rollback migrations automatically
# 1. Identify the failed migration
cd api && pnpm prisma:migrate:status

# 2. Investigate error
# 3. Fix schema.prisma or write recovery migration
# 4. Apply fix
pnpm prisma:migrate:deploy
```

### If Web Deployment Fails

```bash
# Rollback on Vercel dashboard
# https://vercel.com/infamous-freight-enterprises/settings/git

# Or via CLI
vercel rollback
```

## Post-Deployment Verification

```bash
# 1. Monitor error rates (Sentry dashboard)
# 2. Check performance metrics (Datadog)
# 3. Monitor database connections
# 4. Run E2E tests
pnpm test:e2e

# 5. Verify critical features
# - User login
# - Shipment creation
# - Payment processing
# - Subscription management
```

## Communication

- [ ] Notify team via Slack #deployments
- [ ] Post status in team standup
- [ ] Monitor alerts for 1 hour post-deployment
- [ ] Update deployment log with version/timestamp

## Rollback Criteria

Trigger rollback if:

- API error rate > 5%
- Response times > 2x baseline
- Database connection failures
- Payment processing broken
- Critical authentication issues

---

## Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `flyctl deploy` | Deploy API to Fly.io |
| `git push origin main` | Deploy web to Vercel |
| `pnpm prisma:migrate:deploy` | Apply pending migrations |
| `pnpm prisma:migrate:status` | Check migration status |
| `curl /api/health/detailed` | Full service health check |
| `flyctl logs` | View API logs |
| `pnpm test:e2e` | Run end-to-end tests |
