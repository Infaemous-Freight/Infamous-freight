# Launch Day Checklist (12-Hour Launch Window)

**Launch Date**: [TO BE SET]  
**Launch Time**: [TO BE SET (6-8 AM recommended)]  
**Team Lead**: [Name]  
**On-Call**: [Name/Contact]  

---

## Pre-Launch (Week Before)

- [ ] All tests passing in CI
- [ ] Security audit completed
- [ ] Load testing passed (10K+ requests)
- [ ] Database backups created & tested
- [ ] Monitoring dashboards ready
- [ ] Runbooks printed & distributed
- [ ] Team trained on runbooks
- [ ] Incident response plan reviewed
- [ ] Customer communication drafted
- [ ] Rollback plan validated

---

## Launch Day: Hours 1-4 (Pre-Launch)

**Owner: DevOps Lead**

### Hour 1: Final Checks
- [ ] Git: All commits merged to main
- [ ] Tests: Latest CI run passing
- [ ] Code: No uncommitted changes
- [ ] Secrets: All env vars set in production
- [ ] Database: Connection verified
- [ ] Monitoring: Dashboards loading
- [ ] Status page: Set to "Deploying"

### Hour 2: Database Preparation
- [ ] Backup production database
- [ ] Test restore procedure
- [ ] Run final migrations (dry-run first)
- [ ] Verify schema matches code
- [ ] Document any schema changes

### Hour 3: Image & Deployment Prep
- [ ] Build Docker images (tag with version)
- [ ] Push to registry (verified push)
- [ ] Pull images to staging environment
- [ ] Verify image integrity
- [ ] Prepare Kubernetes manifests
- [ ] Verify all env vars in manifests

### Hour 4: Team Standup
- [ ] All team members online & in Slack
- [ ] Runbooks distributed & reviewed
- [ ] Communication channels verified
- [ ] Incident commander assigned
- [ ] War room setup (Zoom/Slack)

---

## Launch Day: Hours 5-10 (Active Deployment)

**Owner: DevOps Lead + QA Lead**

### Hour 5: Deploy API Service
- [ ] Run database migrations
- [ ] Verify schema applied
- [ ] Deploy API to staging (Kubernetes)
- [ ] Verify API pods healthy
- [ ] Check health endpoint: `/api/health`
- [ ] Tail logs for errors

### Hour 6: Deploy Web Service
- [ ] Deploy Web to CDN/Vercel
- [ ] Clear CDN cache
- [ ] Verify homepage loads
- [ ] Check for 404s in browser console
- [ ] Verify CSS/JS assets load

### Hour 7: Smoke Tests (QA)
- [ ] Health check: `GET /api/health` → 200
- [ ] Auth flow: Login → Token → Use token
- [ ] Create resource: `POST /api/shipments` → success
- [ ] List resources: `GET /api/shipments` → populated
- [ ] Update resource: `PUT /api/shipments/:id` → success
- [ ] Delete resource: `DELETE /api/shipments/:id` → success

### Hour 8: Monitoring & Alerts
- [ ] Prometheus metrics appearing
- [ ] Grafana dashboards loading data
- [ ] Alert rules active
- [ ] Email/Slack notifications working
- [ ] Error rate: < 0.1%
- [ ] P95 latency: < 500ms
- [ ] CPU/Memory: Normal ranges

### Hour 9: Cross-Browser Testing
- [ ] Chrome: Full user flow works
- [ ] Firefox: Full user flow works
- [ ] Safari: Full user flow works
- [ ] Mobile (iOS): Key flows work
- [ ] Mobile (Android): Key flows work

### Hour 10: Final Verification
- [ ] All tests passing
- [ ] No error spikes
- [ ] Database queries fast
- [ ] API response times normal
- [ ] Web performance acceptable
- [ ] Status page: Set to "Operational"

---

## Launch Day: Hours 11-12 (Post-Launch)

**Owner: Incident Commander**

### Hour 11: Launch Confirmation
- [ ] Team agrees: Production is stable
- [ ] Metrics all green
- [ ] No escalated issues
- [ ] Customer communications sent
- [ ] Team celebration! 🎉

### Hour 12: Documentation
- [ ] Document actual deployment time
- [ ] Log any issues encountered
- [ ] Record lessons learned
- [ ] Update runbooks if needed
- [ ] Thank you message to team

---

## Monitoring During Launch (First Hour is Critical)

**Watch these metrics every 5 minutes:**

| Metric | Good | Warning | Alert |
|--------|------|---------|-------|
| Error Rate | < 0.05% | 0.05-0.1% | > 0.1% |
| P95 Latency | < 200ms | 200-500ms | > 500ms |
| CPU | < 50% | 50-75% | > 75% |
| Memory | < 60% | 60-80% | > 80% |
| DB Connections | 5-15 | 15-20 | > 20 |

---

## If Issues Arise

### Error Rate Spiking (> 0.5%)

1. Check logs: `kubectl logs deployment/api --tail=100`
2. Identify error type (database, timeout, validation, etc.)
3. **Decision point:**
   - If quick fix possible (< 5 min): Fix & redeploy
   - If unclear: **ROLLBACK** (see below)

### Latency High (P95 > 1000ms)

1. Check database slow query logs
2. Check external service latencies (Stripe, etc.)
3. Scale up if needed: `kubectl scale deployment/api --replicas=5`
4. Monitor for 10 minutes, then rollback if not improving

### Database Connection Pool Exhausted

1. Check number of connections: `kubectl exec -it pod -- psql -c "SELECT count(*) FROM pg_stat_activity;"`
2. Increase pool size in config
3. Restart pods: `kubectl rollout restart deployment/api`

### Complete Rollback

```bash
# 1. Immediate: Route traffic back to previous version
kubectl set image deployment/api api=YOUR_REGISTRY/infamous-freight-api:0.9.0
kubectl rollout status deployment/api --timeout=5m

# 2. Database: Restore from backup (if schema changed)
kubectl exec -it deployment/api -- psql $DATABASE_URL < backup.sql

# 3. Verify: Run smoke tests again
# See "Smoke Tests" section of DEPLOYMENT_RUNBOOK_KUBERNETES.md

# 4. Communicate: Update status page
# Status: "Investigating" → "Investigating an issue"
# Timeline: Document rollback time

# 5. Post-mortem: Within 24 hours
# - What went wrong?
# - Why wasn't it caught in testing?
# - How do we prevent this?
```

---

## Communication During Launch

### Every 30 Minutes (Status Updates)

**To Stakeholders**: Status page + email
```
✅ Launch progressing normally
- API deployed: 15 mins ago, healthy
- Web deployed: 10 mins ago, healthy
- Smoke tests: 8/8 passed
- Error rate: 0.03%
- P95 latency: 145ms

Next: 30-min stability window
```

### If Issue Discovered

**Immediate**: Slack #launch channel
```
⚠️ Issue detected
- CPU spike detected (API pods)
- Error rate: 0.12% (above threshold)
- Action: Investigating root cause
- ETA update: 5 minutes
```

**Follow-up** (every 5 mins while investigating):
```
🔧 Investigating
- Root cause: Database connection leak
- Fix: Rolling out v1.0.1
- ETA resolution: 10 minutes
- Rollback available: Yes
```

---

## Post-Launch (First 24 Hours)

### Hour 1-4: Watch Everything
- [ ] Error monitoring (every 15 min)
- [ ] Performance metrics (every 15 min)
- [ ] Customer support tickets (in real-time)
- [ ] Infrastructure alerts (all active)

### Hour 4-12: Reduce Frequency
- [ ] Error monitoring (every hour)
- [ ] Performance metrics (every hour)
- [ ] Check for customer issues
- [ ] Review logs for warnings

### Hour 12-24: Return to Normal
- [ ] Daily monitoring as usual
- [ ] Team stand-up on any issues
- [ ] Performance report generation
- [ ] Lessons learned documentation

---

## Success Criteria

✅ Launch is **successful** if (at 24 hours):

- Error rate < 0.1%
- P95 latency < 500ms
- Uptime > 99.9%
- Zero critical issues
- All tests still passing
- Team confident in system
- Customer feedback positive

---

## Template: Incident Report

If issues occur, document:

```
INCIDENT REPORT
Date: [date]
Duration: [start] - [end] (X minutes total down)
Severity: [Critical/High/Medium/Low]

Timeline:
15:23 - Issue detected (error spike)
15:25 - Root cause identified (DB connection leak)
15:28 - Fix deployed (v1.0.1 pushed)
15:30 - System recovered (errors drop to 0.02%)

Impact:
- ~500 users affected
- ~150 requests failed
- Max downtime: 7 minutes

Root Cause:
[Detailed explanation]

Prevention:
[What testing/monitoring should have caught this]

Action Items:
- [ ] Add test case for this scenario
- [ ] Update monitoring alert threshold
- [ ] Update runbook with this scenario
- [ ] Team training on new patterns
```

---

## Celebration! 🎉

Launch successful! 

- Share the love: Thank team members
- Reflect: What went well?
- Learn: What would we do differently?
- Relax: You earned it!

---

**Launch Coordinator**: ____________________  
**Date**: 2026-01-22  
**Status**: Ready for Execution
