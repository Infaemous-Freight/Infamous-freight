# Runbook: Normal Production Deployment

**Duration:** 15-30 minutes **Risk Level:** Low (assuming all checks pass)
**Rollback Time:** 5 minutes (if needed)

---

## Prerequisites

- [ ] All tests passing on main branch
- [ ] Code review approved
- [ ] No critical bugs in issue tracker
- [ ] On-call engineer available
- [ ] Deployment window confirmed (outside maintenance windows)

---

## Step-by-Step Deployment

### 0. Pre-Deployment (5 minutes)

```bash
# 1. Ensure PROD_FREEZE is disabled
gh secret get PROD_FREEZE --env production
# Should output: false

# 2. If frozen, unfreeze
gh secret set PROD_FREEZE --env production "false"

# 3. Run verification
bash ./scripts/verify-vercel-setup.sh
# Should show: ✅ ALL CHECKS PASSED

# 4. Notify team
echo "Starting production deployment in 2 minutes..."
```

**Slack Announcement:**

```
📢 Deploying to production
Version: v1.x.x
Changes: [descriptor]
ETA: 20 minutes
```

### 1. Merge to Main (5 minutes)

**In GitHub:**

1. ✅ Open pull request
2. ✅ Verify all CI checks pass (green checkmarks)
3. ✅ Get code review approval
4. ✅ Check for merge conflicts → resolve if needed
5. ✅ Click "Squash and merge" (for cleaner history)
6. ✅ Confirm merge

**Expected:** Vercel auto-deploys on merge to main

### 2. Monitor Deployment (10 minutes)

**Watch Dashboard:**

```bash
# Terminal: Watch Vercel deployment
watch -n 5 'curl -s https://api.vercel.com/v13/deployments?teamId=$TEAM_ID | jq .[0].state'
# Should progress: QUEUED → BUILDING → READY
```

**Concurrently (Tabs):**

**Tab 1 - Sentry Errors:**

```
https://sentry.io/organizations/infamousfreight/issues/
(Watch for error spike)
```

**Tab 2 - Health Check:**

```bash
# Every 30 seconds
watch -n 30 'curl -s https://your-domain.com/api/health | jq .'
```

**Tab 3 - Logs:**

```bash
# If using Fly.io
flyctl logs -a api-app-name
# Should show: New deployment scaling up
```

**Tab 4 - Status:** Monitor in Vercel Dashboard:

- Deployments tab shows: "Deployment ready"
- No red error badges

### 3. Post-Deployment Verification (5 minutes)

**Health Checks** (after deployment shows "Ready"):

```bash
# Wait 2 minutes for DNS propagation
sleep 120

# 1. Health endpoint
curl -s https://your-domain.com/api/health | jq .
# Expected: {"ok":true,"node":"v24.x.x",...}

# 2. Homepage loads
curl -s -I https://your-domain.com | grep "200 OK"
# Expected: HTTP/2 200

# 3. Authentication works
curl -s -X POST https://api.your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' | jq .
# Expected: No 500 errors

# 4. Database connectivity
curl -s https://api.your-domain.com/api/shipments?limit=1 | jq '.data | length'
# Expected: Number > 0 (data returned)
```

**Error Monitoring:**

```bash
# 1. Check Sentry
# https://sentry.io/organizations/infamousfreight/issues/
# Should see NO new errors

# 2. Check Datadog (if enabled)
# https://app.datadoghq.com/apm/traces
# Should show normal latencies

# 3. Check performance
# Run Lighthouse
npx lighthouse https://your-domain.com --output=json > lighthouse.json
cat lighthouse.json | jq .lighthouseVersion
```

### 4. Team Communication (Ongoing)

**Slack Updates:**

```
✅ Deployment in progress...
│ Build: BUILDING (2 min remaining)
│ Tests: PASSING
│ Health: PENDING
```

**After verification:**

```
✅ Production deployment successful!
Version: v1.x.x
Status: HEALTHY
Metrics: Normal
ETA for full rollout: 5 minutes (CDN cache warming)
```

### 5. Final Checks (After 10 minutes)

```bash
# Monitor for issues
for i in {1..5}; do
  echo "Check $i/5..."
  curl -s https://your-domain.com/api/health | jq '.ok'
  sleep 2m
done

# Check error rate is stable
# Sentry should be < 1 error per minute on average
```

---

## Success Criteria

✅ **Deployment is successful when:**

- [ ] Health endpoint returns 200 OK
- [ ] No new errors in Sentry (< 5 errors after 10 min)
- [ ] No 5xx errors in logs
- [ ] Response times within normal range (< 2s)
- [ ] Database queries responding normally
- [ ] CDN cache warming complete
- [ ] Users not reporting issues
- [ ] Performance metrics stable

---

## Troubleshooting

### Issue: Deployment shows "Failed"

**Solution:**

```bash
# 1. Check what failed
vercel projects inspect

# 2. Check build logs
vercel logs --follow

# 3. Revert PR or fix issue
git revert HEAD
git push

# 4. Document issue
# Create GitHub issue with error details
```

### Issue: Health endpoint returns 500

**Solution:**

```bash
# 1. Check environment variables
echo $DATABASE_URL  # Should not be empty

# 2. Check database connectivity
psql $DATABASE_URL -c "SELECT 1" # Should return 1

# 3. Check logs for errors
# Vercel: Deployments → Select deployment → Logs

# 4. Rollback if needed (see rollback runbook)
```

### Issue: Error spike in Sentry

**Solution:**

```bash
# 1. Identify error pattern
# Sentry: Issues → Select error → See stack trace

# 2. If widespread (> 10 errors/min)
#    Execute emergency rollback (see runbook)

# 3. If isolated (1-2 errors)
#    Monitor, don't panic. May be user error.
```

---

## Post-Deployment Tasks

### Immediate (within 1 hour)

- [ ] Monitor error rate: stays < 1/min
- [ ] Monitor uptime: stays 100%
- [ ] Check Slack for user reports
- [ ] Verify no database deadlocks
- [ ] Review new code paths for issues

### Before Next Deployment

- [ ] Document any issues encountered
- [ ] Update deployment checklist if needed
- [ ] Notify product of successful release
- [ ] Create release notes for changelog

---

## Rollback (if needed)

**See: docs/runbooks/emergency-rollback.md**

Quick rollback:

```bash
# In Vercel Dashboard:
# Deployments → Select previous version → Rollback button
# ETA: 2-5 minutes
```

---

## Post-Mortem (if issues occurred)

Schedule within 24 hours:

- What went wrong?
- Why did it happen?
- How to prevent next time?
- Action items for team

---

**Deployment Completed!** ✅

Time taken: **\_** minutes Deployed by: **\_** Issues encountered: None /
[describe] Follow-up actions: None / [describe]

**Celebrate! 🎉 Your code is live!**
