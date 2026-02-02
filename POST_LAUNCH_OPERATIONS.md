# 🚀 Post-Launch Operations Guide

**Infæmous Freight - Live Deployment**  
**Effective Date**: February 2, 2026  
**Owner**: DevOps / SRE Team

---

## 📋 Weekly Operations Checklist

### Every Monday Morning

- [ ] Review **Sentry errors** from past week (<https://sentry.io>)
  - [ ] Triage critical issues (P0 = respond immediately)
  - [ ] Create tickets for P1/P2 issues
- [ ] Check **Vercel Analytics** (<https://vercel.com/dashboard>)
  - [ ] HTTP error rates < 1%
  - [ ] API response time < 500ms
  - [ ] No 5xx errors spike
- [ ] Run health check: `curl https://<your-url>/api/health`
  - [ ] Confirm `database: "connected"`
  - [ ] Check uptime > 99.9%

### Every Friday End-of-Day

- [ ] Generate **weekly deployment report**:
  - Error count, request volume, latency metrics
  - Share with team
- [ ] Backup Supabase database (automated if enabled)
- [ ] Verify monitoring alerts are firing correctly

---

## 🔐 Credential Rotation Schedule

### JWT_SECRET - Rotate Every 90 Days

**Timeline**: Next rotation due **May 2, 2026**

**Steps:**

1. Generate new secret:

   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. Update in Vercel:
   - Dashboard → Settings → Environment Variables
   - Replace `JWT_SECRET` with new value
   - Redeploy app
3. Document in [NEW_JWT_SECRET.md](NEW_JWT_SECRET.md) with date
4. Notify team of rotation
5. Monitor for auth failures post-rotation

**⚠️ CRITICAL**: Keep old secret for 48 hours for session grace period.

### Database Password - Rotate Every 180 Days

**Timeline**: Next rotation due **August 2, 2026**

**Steps:**

1. In Supabase Dashboard:
   - Project Settings → Database → Password
   - Click "Reset Database Password"
2. Update `DATABASE_URL` in Vercel with new password
3. Redeploy API
4. Test migrations still work
5. Verify no connection errors in logs

**Note**: Previous password becomes invalid immediately.

### API Keys - Monitor Quarterly

- [ ] **Stripe** keys (commerce)
- [ ] **OpenAI** keys (AI features)
- [ ] **Anthropic** keys (AI fallback)
- [ ] Confirm none are leaked in logs

---

## 📊 Monitoring & Observability

### Sentry Error Tracking (<https://sentry.io>)

**Setup:**

```bash
# Verify in Vercel env vars
NEXT_PUBLIC_SENTRY_DSN=<your-dsn>
```

**Weekly Review Targets:**

- **Critical (P0)**: Must fix within 24 hours
  - Auth failures, database errors, deployment issues
- **High (P1)**: Fix within 1 week
  - Unhandled exceptions, API timeouts
- **Medium (P2)**: Fix within 2 weeks
  - Deprecation warnings, performance issues

**Alert Rules:**

- [ ] Enable alerts for "New Issue" in project
- [ ] Set email notifications to team
- [ ] Configure Slack webhook for critical errors

### Vercel Analytics (Built-In)

**Weekly Metrics to Track:**

- **Page Load Time**: Target < 2s (Lighthouse)
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
- **Error Rate**: < 1%
- **Request Volume**: Growing trend?

**Optimization Actions:**

- If LCP degrades: Review image optimization, font loading
- If error rate spikes: Check Sentry simultaneously
- If latency increases: Check database queries, API endpoints

### UptimeRobot Monitoring (Optional)

**Setup Health Check:**

```
Monitor URL: https://<your-url>/api/health
Frequency: Every 5 minutes
Alert: SMS + Email on failure
```

**Expected Response:**

```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 123.45
}
```

**Acceptable Downtime:**

- Planned: Schedule at 2-4 AM UTC
- Unplanned: < 15 minutes = OK, > 1 hour = page on-call team

---

## 🛠️ Deployment & Rollback Procedures

### Hot Fix Deployment

**If critical bug found in production:**

1. **Assess impact** (5 min)
   - User-facing? Data loss? Auth broken?
   - P0 = deploy immediately, P1 = plan next iteration

2. **Quick fix locally** (10-15 min)
   - Branch: `git checkout -b hotfix/issue-name`
   - Fix code
   - Run tests: `pnpm test`

3. **Deploy** (5 min)
   - Commit & push to main
   - GitHub Actions auto-deploys
   - Vercel deploys within 2-3 min

4. **Verify** (5 min)
   - Check `/api/health`
   - Monitor Sentry for repeat errors
   - Confirm user issue resolved

**Total Time**: ~30 minutes

### Rollback (If Deployment Fails)

1. **Revert last commit**:

   ```bash
   git revert HEAD
   git push
   ```

2. GitHub Actions auto-redeploys previous version
3. Monitor health endpoint for recovery

**Expected recovery time**: < 5 minutes

---

## 🔍 Monthly Maintenance

### First of Each Month

- [ ] Update dependencies:

  ```bash
  pnpm up --latest
  pnpm --filter @infamous-freight/shared up --latest
  ```

- [ ] Run security audit:

  ```bash
  pnpm audit
  npm audit --audit-level=moderate
  ```

- [ ] Review cost optimization:
  - Vercel usage
  - Supabase request count
  - Data transfer volumes

### Quarterly (Every 3 Months)

- [ ] Database maintenance:
  - Analyze slow queries
  - Update table statistics
  - Archive old logs
- [ ] Security audit:
  - Review IAM permissions
  - Check inactive users
  - Audit API usage patterns
- [ ] Performance optimization:
  - Identify bottleneck endpoints
  - Implement caching where needed
  - Optimize database queries

---

## 🆘 Incident Response

### If API is Down

1. **Alert team** (immediately):
   - Slack, email, SMS depending on severity
2. **Check status**:
   - `curl https://<your-url>/api/health` → should fail
   - Check Sentry for error traces
   - Check Fly.io dashboard for deployment status
3. **Immediate actions**:
   - Rollback: `git revert HEAD && git push`
   - Or: Restart in Fly.io dashboard
4. **Investigate** (post-incident):
   - Root cause analysis
   - Document changes that caused failure
   - Update deployment checklist

### If Database is Down

1. **Check Supabase status**: <https://supabase.com/status>
2. **If regional outage**: Contact Supabase support
3. **If connection issue**:
   - Verify `DATABASE_URL` in Vercel is correct
   - Check RLS policies aren't blocking queries
   - Verify firewall rules
4. **Restore from backup** (if data corruption):
   - Supabase Dashboard → Backups
   - Request restore from Supabase support

### If Auth System Breaks

1. Check JWT_SECRET is still valid in Vercel
2. Verify Supabase is responding (`SELECT 1` query)
3. Check for JWT expiry issues in logs
4. If broken, rotate JWT_SECRET immediately

---

## 📈 Performance Baselines

Track these metrics over time:

| Metric              | Target  | Action if Exceeded          |
| ------------------- | ------- | --------------------------- |
| API Response Time   | < 500ms | Profile slow queries        |
| Error Rate          | < 1%    | Review Sentry immediately   |
| Database CPU        | < 80%   | Optimize queries or upgrade |
| Request Latency P95 | < 2s    | Check CDN cache strategy    |
| Uptime              | > 99.9% | Investigate SLA breach      |

---

## 📞 Escalation Contacts

**For Issues:**

- **Slack**: #incidents channel
- **On-Call**: Check rotation schedule
- **Vercel Support**: <https://vercel.com/support>
- **Supabase Support**: <https://supabase.com/support>

---

## ✅ Checklist Template (Use Weekly)

```markdown
- [ ] Monday: Review Sentry errors
- [ ] Monday: Check Vercel Analytics
- [ ] Monday: Run health check
- [ ] Friday: Generate report
- [ ] Friday: Verify backups
- [ ] Every 90 days: Rotate JWT_SECRET
- [ ] Every 180 days: Rotate DB password
- [ ] Every quarter: Security audit
```

---

**Last Updated**: February 2, 2026  
**Next Review**: February 9, 2026
