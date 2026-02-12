# Incident Response Playbook

**Document**: Production Incident Response Guide  
**Last Updated**: February 12, 2026  
**Audience**: On-call Engineers, DevOps, Tech Lead  
**Severity**: Critical  

---

## Incident Categories & Response Procedures

### Category 1: Critical Outage (All systems down)

**Impact**: Service completely unavailable  
**Response Time**: Immediate (< 2 min)  
**Severity**: P1  

#### Detection
- ✅ Uptime monitoring alert
- ✅ User reports via support
- ✅ Sentry massive error spike
- ✅ All health checks failing

#### Immediate Actions (0-5 min)
```bash
# 1. Declare incident
$ @slack: @channel INCIDENT: Critical outage detected
$ PagerDuty: Trigger P1 incident

# 2. Assess scope
$ kubectl get pods --all-namespaces
$ curl -v https://api.infamous-freight.com/api/health
$ psql $DATABASE_URL -c "SELECT version();"

# 3. Check recent changes
$ git log --oneline -5
$ kubectl rollout history deployment/api

# 4. Temporary mitigation (if possible)
$ kubectl scale deployment/api --replicas=3
$ kubectl restart statefulset/database
```

#### Investigation (5-15 min)
```bash
# Check logs
$ kubectl logs -l app=api --tail=100 | grep ERROR

# Check metrics
$ kubectl metrics pods -l app=api

# Check database
$ psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
$ psql $DATABASE_URL -c "SELECT query FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5;"

# Check external services
$ curl -X GET https://api.sendgrid.com/v3/mail_settings -H "Authorization: Bearer $SENDGRID_API_KEY"
```

#### Resolution Path
If **API crashed**:
- Redeploy last known good version
- Check logs for crash reason
- Increase resource limits if needed

If **Database down**:
- Check PostgreSQL status
- Verify disk space
- Attempt recovery
- Failover to replica if available

If **External service failure**:
- Switch to graceful degradation mode
- Notify customers of impact
- Monitor service status

#### Communication (Every 5 min)
- Slack update with status
- Customer status page update
- Email to affected customers (if applicable)

#### Post-Incident (After resolution)
- [ ] Write incident report
- [ ] Schedule blameless post-mortem
- [ ] Create follow-up tickets
- [ ] Update runbooks

---

### Category 2: High Error Rate (>1% errors)

**Impact**: Degraded service, many user-facing errors  
**Response Time**: 5-10 minutes  
**Severity**: P2  

#### Detection Signals
- ✅ Error rate > 1% in Sentry
- ✅ API response time p95 > 1000ms
- ✅ Database query timeout errors
- ✅ 5xx status code spike

#### Investigation (5-10 min)
```bash
# 1. Check error patterns
# Go to: https://sentry.io/crimes/...
# Review top errors and affected users

# 2. Check resource usage
$ kubectl top nodes
$ kubectl top pods -l app=api

# 3. Check query performance
$ psql $DATABASE_URL -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# 4. Check rate limiting
$ redis-cli INFO stats

# 5. Check specific feature
$ curl -X GET https://api.infamous-freight.com/api/shipments -H "Authorization: Bearer $TEST_TOKEN"
```

#### Remediation Options
1. **Scale up resources**
   ```bash
   $ kubectl scale deployment/api --replicas=5
   ```

2. **Clear cache**
   ```bash
   $ redis-cli FLUSHDB
   ```

3. **Restart specific service**
   ```bash
   $ kubectl restart deployment/api
   ```

4. **Temporary circuit breaker**
   ```bash
   $ Disable expensive features
   $ Redirect traffic to read-only mode
   ```

5. **Rollback recent deployment**
   ```bash
   $ kubectl rollout undo deployment/api
   ```

---

### Category 3: Slow Performance (Response times high)

**Impact**: Users experience slow application  
**Response Time**: 10-15 minutes  
**Severity**: P3  

#### Detection
- ✅ API p95 response time > 500ms
- ✅ Database queries > 200ms
- ✅ User reports of slowness
- ✅ JavaScript bundle size increased

#### Investigation
```bash
# Check slow queries
$ psql $DATABASE_URL -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check N+1 patterns
# Go to: https://sentry.io/crimes/apm/...
# Look for repeated database queries in single transaction

# Profile API endpoint
$ time curl https://api.infamous-freight.com/api/shipments

# Check frontend bundle size
$ ls -lh apps/web/.next/static/chunks/*.js | awk '{print $5, $9}' | sort -h
```

#### Optimization Steps
1. Add query indexes
   ```sql
   CREATE INDEX idx_shipments_status_createdAt ON shipments(status, created_at DESC);
   ```

2. Implement caching
3. Reduce database query load
4. Optimize frontend bundle
5. Scale resources temporarily

---

### Category 4: Data Integrity Issues

**Impact**: Incorrect or missing data  
**Response Time**: Immediate  
**Severity**: P1 (if customer-facing data) / P3 (if internal)  

#### Detection
- ✅ Automated data validation checks
- ✅ User reports missing shipments/payments
- ✅ Reconciliation alerts
- ✅ Sentry data consistency errors

#### Immediate Actions
1. **Assess scope**
   - How many records affected?
   - When did issue start?
   - What data is affected?

2. **Prevent further damage**
   ```bash
   # Disable writes if corrupted data being written
   $ kubectl set env deployment/api API_READ_ONLY=true
   ```

3. **Evaluate database state**
   ```bash
   # Check transaction log
   $ psql $DATABASE_URL -c "SELECT * FROM pg_stat_xact_user_tables ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;"
   ```

4. **Begin recovery**
   - Restore from backup if necessary
   - Run data validation queries
   - Document affected records

---

### Category 5: Security Incident

**Impact**: Potential data breach or unauthorized access  
**Response Time**: Immediate  
**Severity**: P0 (Critical)  

#### Detection
- ✅ Suspicious authentication attempts
- ✅ Potential credential leak
- ✅ Unauthorized API access
- ✅ Security scanning alert
- ✅ Third-party notification

#### Immediate Actions
1. **Isolate affected systems**
   ```bash
   $ Restrict API access temporarily
   $ Rotate all credentials
   $ Kill active sessions
   ```

2. **Secure database**
   ```bash
   $ psql $DATABASE_URL -c "SELECT usename, usesuper, usecreatedb FROM pg_user;"
   $ Disable suspect accounts
   ```

3. **Analyze logs**
   - Check auth logs for suspicious patterns
   - Review API access logs
   - Check database audit logs

4. **Notify stakeholders**
   - Tech Lead: Immediate call
   - Legal: Data breach assessment
   - Customers: If PII affected
   - Compliance: Document incident

5. **Begin forensics**
   - Enable verbose logging
   - Archive logs for analysis
   - Contact security firm if needed

---

## Common Issues & Quick Fixes

### Issue: High CPU Usage
```bash
# Find resource hog
$ kubectl top pods -l app=api --sort-by=cpu

# Check specific pod
$ kubectl top pod <pod-name> --containers

# Common causes:
# - Unoptimized query
# - Memory leak
# - Bad code in deployment

# Temporary: Restart pod
$ kubectl delete pod <pod-name>
```

### Issue: Memory Leak
```bash
# Monitor memory
$ kubectl top pods -l app=api --sort-by=memory

#Restart pod to free memory
$ kubectl delete pod <pod-name>

# Permanent: Debug application
# Profile with: pnpm profile
# Check for: setInterval without cleanup, event listeners, closures
```

### Issue: Database Locks
```bash
# Find blocking queries
$ psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Kill blocking query
$ psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query LIKE '%<pattern>%';"
```

### Issue: Out of Disk Space
```bash
# Check usage
$ df -h

# Find large files
$ du -sh /var/lib/postgresql/*

# Common causes:
# - Old log files
# - WAL files not archived
# - Transaction log congestion

# Emergency: Delete old logs
$ rm /var/log/postgresql/postgresql-*.log
```

---

## Escalation Path

### Severity Levels

| Level | Impact | Response | Escalate After |
|-------|--------|----------|-----------------|
| P0 | Complete outage | 1 min | Immediate |
| P1 | Major outage/data loss | 5 min | 10 min |
| P2 | Degraded service | 15 min | 30 min |
| P3 | Minor issues | 1 hour | 4 hours |

### Escalation Contacts

1. **First Level**: On-call Engineer (handle 90% of issues)
2. **Second Level**: Tech Lead (if first level escalates)
3. **Third Level**: CTO (if still unresolved after 30 min)
4. **Fourth Level**: External Support (security incidents, emergency)

### Escalation Commands
```bash
# Escalate to Tech Lead
$ @tech-lead We need your expertise on <issue>

# Open bridge call
$ start-bridge-call

# Create war room
$ #war-room-<incident-id>
```

---

## Communication Template

### Initial Report (< 5 min)
```
⚠️ INCIDENT: [Brief description]
- Start Time: [Time]
- Affected Service: [Service]
- Status: Investigating
- Est. Impact: [User count / % affected]
```

### Update (Every 10-15 min)
```
🔄 UPDATE: Incident [ID]
- Current Status: [Investigating/Partially resolved/Resolved]
- Recent Actions: [What was done]
- ETA for Resolution: [XX minutes]
```

### Resolution
```
✅ RESOLVED: Incident [ID]
- Root Cause: [Brief explanation]
- Resolution: [What was done]
- Total Duration: [XX minutes]
- Post-mortem: [Scheduled for XX]
```

---

## Post-Incident Actions (Within 24 hours)

1. **Write Incident Report**
   - What happened
   - Timeline of events
   - Root cause
   - Impact assessment

2. **Schedule Post-Mortem**
   - Review incident response
   - Identify learnings
   - Create follow-up tickets

3. **Preventive Measures**
   - Better monitoring?
   - Code changes needed?
   - Process improvements?

4. **Update Documentation**
   - Update this playbook
   - Update runbooks
   - Update alerts

---

## Tools & Access

### Monitoring
- Sentry: https://sentry.io/crimes/...
- Datadog: https://app.datadoghq.com
- Kubernetes Dashboard: https://k8s.infamous-freight.com
- Status Page: https://status.infamous-freight.com

### Access
- Production SSH: `ssh ec2-user@prod.api.infamous-freight.com`
- Database Console: `psql $DATABASE_URL`
- Redis Console: `redis-cli -h $REDIS_HOST`
- Logs: CloudWatch / ELK Stack

### Commands Cheatsheet
```bash
# General
kubectl get pods                           # List all pods
kubectl describe pod <name>                # Get pod details
kubectl logs <pod> --tail=50              # View logs
kubectl exec -it <pod> bash               # SSH into pod

# Database
psql $DATABASE_URL -c "<query>"           # Execute query
pg_dump $DATABASE_URL > backup.sql       # Backup database
redis-cli INFO                            # Redis stats

# Deployment
kubectl rollout history deployment/api    # View deploy history
kubectl rollout undo deployment/api       # Revert to previous
kubectl scale deployment/api --replicas=5 # Scale up
```

---

**Incident Runbook Owner**: DevOps / On-Call Team  
**Last Updated**: February 12, 2026  
**Review Schedule**: Quarterly  
**Next Update**: May 2026  

