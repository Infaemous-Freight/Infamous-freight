# 🚀 Deployment Checklist

## Pre-Deployment Validation

### Code Quality

- [ ] All tests passing locally (`pnpm test`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Code reviewed and approved (at least 1 reviewer)
- [ ] All CI/CD workflows passing on main branch
- [ ] No blocking security vulnerabilities

### Database

- [ ] Database migrations tested locally
- [ ] Migration rollback plan documented
- [ ] Database backups verified and recent (< 24 hours)
- [ ] Connection strings configured for target environment
- [ ] Prisma client generated with production schema

### Environment Configuration

- [ ] All required secrets configured in deployment platform
  - [ ] `JWT_SECRET`
  - [ ] `DATABASE_URL`
  - [ ] `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` (if using AI)
  - [ ] `RENDER_DEPLOY_HOOK_URL` (for Render)
  - [ ] `VERCEL_TOKEN` (for Vercel)
- [ ] Environment variables match `.env.example`
- [ ] API URLs configured for target environment
- [ ] CORS origins updated for production domains

### Build Verification

- [ ] Shared package built successfully (`pnpm --filter @infamous-freight/shared build`)
- [ ] API builds without errors (`pnpm --filter infamous-freight-api build`)
- [ ] Web builds without errors (`pnpm --filter infamous-freight-web build`)
- [ ] Bundle size within budget (< 500KB for Web)
- [ ] No console warnings in build output

### Testing

- [ ] Unit tests passing (> 95% success rate)
- [ ] Integration tests passing
- [ ] E2E tests passing (if applicable)
- [ ] Manual smoke testing completed
- [ ] Performance tests within targets (API < 1s, Web LCP < 2.5s)

---

## Deployment Execution

### Pre-Deploy

- [ ] Team notified in communication channel (Slack/Discord)
- [ ] Deployment window scheduled (prefer off-peak hours)
- [ ] Rollback plan prepared and documented
- [ ] On-call engineer identified

### Deploy Steps

- [ ] **API Deployment:**
  - [ ] Trigger Render deployment (auto on push or manual)
  - [ ] Monitor build logs for errors
  - [ ] Wait for health check to pass
  - [ ] Verify `/api/health` endpoint returns 200

- [ ] **Web Deployment:**
  - [ ] Trigger Vercel deployment (auto on push or manual)
  - [ ] Monitor build logs for errors
  - [ ] Wait for deployment URL
  - [ ] Verify homepage loads without errors

- [ ] **Database Migrations:**
  - [ ] Run migrations on production database
  - [ ] Verify migration success in logs
  - [ ] Confirm schema changes applied

### Post-Deploy Verification

- [ ] Health checks passing (API + Web)
  - [ ] API: `curl https://api.infamous-freight.com/api/health`
  - [ ] Web: `curl https://infamous-freight.vercel.app`
- [ ] Critical user flows tested:
  - [ ] User authentication works
  - [ ] Dashboard loads
  - [ ] API endpoints responding
  - [ ] Database queries executing
- [ ] Error logs reviewed (no critical errors in last 10 minutes)
- [ ] Performance metrics within targets
- [ ] Monitoring dashboards checked:
  - [ ] Vercel Analytics (Web)
  - [ ] Render Dashboard (API)
  - [ ] Sentry (Error tracking)
  - [ ] Datadog RUM (if configured)

---

## Post-Deployment

### Immediate (0-15 minutes)

- [ ] Monitor error rates (should be < 1%)
- [ ] Check API response times (should be < 1s P95)
- [ ] Verify no spike in error logs
- [ ] Confirm deployment status in GitHub Actions
- [ ] Team notified of successful deployment

### Short-Term (15-60 minutes)

- [ ] Monitor user sessions (no unusual drop-offs)
- [ ] Check performance metrics (no degradation)
- [ ] Review customer support channels (no new issues)
- [ ] Verify scheduled jobs/cron tasks running

### Medium-Term (1-24 hours)

- [ ] Daily metrics reviewed (compared to baseline)
- [ ] No critical bugs reported
- [ ] Performance stable
- [ ] Database query performance acceptable
- [ ] Cost metrics within budget

---

## Rollback Procedure (If Needed)

### Trigger Rollback If

- Critical bugs affecting > 10% of users
- API error rate > 5%
- Database migration failures
- Security vulnerabilities discovered
- Performance degradation > 50%

### Rollback Steps

1. [ ] **Immediate:** Stop new deployments (cancel in-progress builds)
2. [ ] **Revert Code:**
   - [ ] Revert git commit: `git revert <commit-hash>`
   - [ ] Push to main: `git push origin main`
   - [ ] Wait for auto-deployment or trigger manually
3. [ ] **Database Rollback:**
   - [ ] Run migration rollback if schema changed
   - [ ] Restore database backup if necessary (last resort)
4. [ ] **Verify Rollback:**
   - [ ] Health checks passing
   - [ ] Error rates back to normal
   - [ ] User flows working
5. [ ] **Post-Mortem:**
   - [ ] Document what went wrong
   - [ ] Identify root cause
   - [ ] Create action items to prevent recurrence
   - [ ] Update this checklist if needed

---

## Communication Template

### Pre-Deployment Announcement

```
🚀 **Deployment Starting**

**Scope:** [API/Web/Both]
**Changes:** [Brief description]
**Expected Duration:** [X minutes]
**Downtime:** [None/Planned X minutes]
**Rollback Plan:** Ready if needed

Monitoring deployment...
```

### Post-Deployment Success

```
✅ **Deployment Complete**

**Deployed:** [API/Web/Both]
**Status:** All health checks passing
**Performance:** Within targets
**Rollback:** Not needed

Monitoring for next 24 hours.
```

### Deployment Failure/Rollback

```
❌ **Deployment Issue - Rolling Back**

**Issue:** [Brief description]
**Action:** Reverting to previous version
**ETA:** [X minutes]
**Impact:** [User-facing impact]

Post-mortem to follow.
```

---

## Deployment Schedule

**Preferred Times (EST):**

- Tuesday-Thursday: 10 AM - 2 PM (low traffic)
- Avoid: Fridays, weekends, holidays, evenings

**Emergency Deployments:**

- Security fixes: Deploy immediately
- Critical bugs: Within 2 hours
- Hotfixes: Within 4 hours

---

## Metrics to Track

| Metric                      | Pre-Deploy | Post-Deploy | Status |
| --------------------------- | ---------- | ----------- | ------ |
| **API Error Rate**          | < 1%       | —           | ⏳     |
| **API Response Time (P95)** | < 1s       | —           | ⏳     |
| **Web Page Load (LCP)**     | < 2.5s     | —           | ⏳     |
| **Active Users**            | [baseline] | —           | ⏳     |
| **Database Connections**    | [baseline] | —           | ⏳     |
| **Memory Usage**            | [baseline] | —           | ⏳     |

---

## Resources

- [Workflow Guide](./.github/WORKFLOW_GUIDE.md) - Deployment workflow details
- [Security Guide](./.github/SECURITY.md) - Secrets and access
- [Performance Guide](./.github/PERFORMANCE.md) - Performance targets
- [API Reference](../API_REFERENCE.md) - Testing endpoints
- [Render Dashboard](https://dashboard.render.com) - API deployment
- [Vercel Dashboard](https://vercel.com/dashboard) - Web deployment

---

**Last Updated:** December 31, 2025
**Maintained By:** DevOps Team
