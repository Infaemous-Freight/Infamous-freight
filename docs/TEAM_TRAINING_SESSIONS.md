# 🎓 Team Training Sessions - Complete Curriculum

**Training Program**: All 3 Tracks Post-Deployment Training  
**Duration**: 6 hours (3 sessions × 2 hours)  
**Format**: Hands-on with live system  
**Certification**: Required for production access

---

## 📅 SESSION SCHEDULE

### Session 1: Deployment & Monitoring (2 hours)

**Date**: TBD  
**Time**: 9:00 AM - 11:00 AM  
**Attendees**: Engineering team, DevOps, Operations  
**Location**: Conference Room A / Zoom

### Session 2: Feature Flags & A/B Testing (2 hours)

**Date**: TBD  
**Time**: 1:00 PM - 3:00 PM  
**Attendees**: Product team, Engineering, QA  
**Location**: Conference Room A / Zoom

### Session 3: Incident Response & Rollback (2 hours)

**Date**: TBD  
**Time**: 9:00 AM - 11:00 AM  
**Attendees**: All teams + stakeholders  
**Location**: Conference Room A / Zoom

---

## 🎯 SESSION 1: DEPLOYMENT & MONITORING

### Learning Objectives

- ✅ Execute production deployment independently
- ✅ Read and interpret monitoring dashboards
- ✅ Identify performance issues
- ✅ Perform health checks
- ✅ Review deployment logs

### Agenda

#### Part 1: Deployment Workflow (60 min)

**1. Pre-Deployment Checklist (15 min)**

```bash
# Hands-on: Each attendee runs pre-flight checks
./scripts/pre-flight-check.sh

# Review checklist:
- [ ] All tests passing
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Backup completed
- [ ] Rollback plan ready
- [ ] Team notified
```

**2. Deployment Execution (30 min)**

```bash
# Live deployment demo
./scripts/deploy.sh production

# Each attendee deploys to staging
./scripts/deploy.sh staging

# Monitor deployment progress
watch -n 2 'curl -s http://api/health | jq'
```

**3. Post-Deployment Verification (15 min)**

```bash
# Verify deployment success
./scripts/health-check-runner.sh

# Check key endpoints
curl http://api/health/details | jq
curl http://api/shipments?limit=10 | jq
```

#### Part 2: Monitoring Deep Dive (60 min)

**1. Dashboard Tour (20 min)**

- Executive Dashboard (KPIs, business metrics)
- Operations Dashboard (system health, alerts)
- Developer Dashboard (API performance, errors)
- Capacity Planning Dashboard (resource usage trends)

**2. Metric Interpretation (20 min)**

| Metric        | Good  | Warning | Critical | Action             |
| ------------- | ----- | ------- | -------- | ------------------ |
| Response Time | <15ms | 15-30ms | >30ms    | Check slow queries |
| Error Rate    | <0.5% | 0.5-1%  | >1%      | Review error logs  |
| Cache Hit     | >85%  | 70-85%  | <70%     | Tune TTL           |
| CPU Usage     | <60%  | 60-80%  | >80%     | Scale up           |
| Memory        | <70%  | 70-85%  | >85%     | Check memory leaks |

**3. Alert Response (20 min)**

**Exercise**: Simulate alerts and practice response

```bash
# Trigger test alert
./scripts/trigger-test-alert.sh high-response-time

# Attendees must:
1. Acknowledge alert
2. Check dashboard
3. Identify root cause
4. Propose solution
5. Document in incident log
```

### Hands-On Exercises

**Exercise 1: Deploy to Staging**

- Each attendee deploys latest version to their staging environment
- Verify health checks pass
- Review deployment logs

**Exercise 2: Dashboard Analysis**

- Given a set of metrics, identify performance issues
- Propose optimization strategies
- Estimate impact of changes

**Exercise 3: Alert Triage**

- Respond to 3 simulated alerts
- Classify severity (S1, S2, S3)
- Execute appropriate response procedures

### Assessment

**Quiz (10 questions)**:

1. What are the 5 pre-deployment checks?
2. How do you verify deployment success?
3. What's the target response time?
4. What cache hit rate is acceptable?
5. How do you acknowledge an alert?
6. What's an S1 incident?
7. Where are deployment logs stored?
8. How do you check database migration status?
9. What's the rollback command?
10. When should you escalate an incident?

**Pass Criteria**: 8/10 correct

---

## 🚩 SESSION 2: FEATURE FLAGS & A/B TESTING

### Learning Objectives

- ✅ Create and manage feature flags
- ✅ Set up percentage-based rollouts
- ✅ Configure A/B tests
- ✅ Analyze test results
- ✅ Declare test winners

### Agenda

#### Part 1: Feature Flags (60 min)

**1. Feature Flag Basics (15 min)**

What are feature flags?

- Runtime toggles for features
- Enable/disable without deployment
- Gradual rollout to users
- Quick rollback if issues

**2. Creating Feature Flags (20 min)**

**Demo**: Create a feature flag

```typescript
// Navigate to admin dashboard
http://localhost:3000/admin/feature-flags

// Create new flag
{
  "key": "new_shipment_ui",
  "name": "New Shipment Creation UI",
  "description": "Redesigned shipment creation flow",
  "enabled": false,
  "rollout_percentage": 0,
  "target_users": []
}
```

**Hands-on**: Each attendee creates 2 flags

1. Backend feature flag
2. Frontend UI flag

**3. Rollout Strategies (25 min)**

**Strategy 1: Percentage Rollout**

```typescript
// Start at 5% of users
updateFeatureFlag("new_ui", { rollout_percentage: 5 });

// Monitor for 24 hours
// If metrics good, increase to 25%
updateFeatureFlag("new_ui", { rollout_percentage: 25 });

// Continue: 5% → 25% → 50% → 100%
```

**Strategy 2: User Targeting**

```typescript
// Target specific users
updateFeatureFlag("beta_feature", {
  target_users: ["user123", "user456"],
  target_groups: ["beta_testers", "internal_team"],
});
```

**Strategy 3: Kill Switch**

```typescript
// Emergency disable
updateFeatureFlag("problematic_feature", { enabled: false });
```

#### Part 2: A/B Testing (60 min)

**1. A/B Test Design (15 min)**

**Example Test**:

- **Hypothesis**: New checkout flow increases conversions
- **Variants**:
  - A (Control): Current checkout
  - B (Treatment): New checkout
- **Metric**: Conversion rate
- **Sample Size**: 1000 users per variant
- **Duration**: 7 days

**2. Creating A/B Tests (20 min)**

**Demo**: Set up A/B test

```typescript
// Navigate to A/B test dashboard
http://localhost:3000/admin/ab-tests

// Create test
{
  "key": "checkout_redesign",
  "name": "Checkout Flow Redesign",
  "hypothesis": "New flow increases conversions by 15%",
  "variants": [
    { "key": "control", "name": "Current Flow", "weight": 50 },
    { "key": "treatment", "name": "New Flow", "weight": 50 }
  ],
  "metrics": [
    { "key": "conversion", "type": "binary", "success_event": "purchase_complete" },
    { "key": "cart_abandonment", "type": "binary", "success_event": "cart_abandoned" }
  ],
  "sample_size": 2000,
  "min_runtime_days": 7
}
```

**Hands-on**: Create A/B test for:

1. Email subject line optimization
2. Pricing display format

**3. Analyzing Results (25 min)**

**Statistical Significance**:

```typescript
// View test results
{
  "test_key": "checkout_redesign",
  "status": "running",
  "days_running": 5,
  "results": {
    "control": {
      "users": 1000,
      "conversions": 180,
      "rate": 0.18
    },
    "treatment": {
      "users": 1000,
      "conversions": 225,
      "rate": 0.225
    },
    "improvement": "+25%",
    "confidence": 0.95,
    "statistical_significance": true,
    "recommendation": "Declare treatment as winner"
  }
}
```

**When to declare a winner?**

- ✅ Statistical significance > 95%
- ✅ Minimum runtime met (7 days)
- ✅ Sample size adequate
- ✅ Results stable (not fluctuating)

### Hands-On Exercises

**Exercise 1: Feature Flag Rollout**

- Create feature flag for new feature
- Roll out to 10% of users
- Monitor dashboards
- Increase to 50%
- Analyze impact

**Exercise 2: A/B Test Setup**

- Design A/B test for given hypothesis
- Configure variants and metrics
- Determine sample size
- Set success criteria

**Exercise 3: Result Analysis**

- Given test results, calculate statistical significance
- Make go/no-go decision
- Document findings
- Plan full rollout or rollback

### Assessment

**Practical Exam**:

1. Create a feature flag (2 points)
2. Set up 25% rollout (2 points)
3. Create A/B test with 2 variants (3 points)
4. Analyze results and make recommendation (3 points)

**Pass Criteria**: 7/10 points

---

## 🚨 SESSION 3: INCIDENT RESPONSE & ROLLBACK

### Learning Objectives

- ✅ Classify incident severity
- ✅ Execute incident response procedures
- ✅ Perform emergency rollback
- ✅ Conduct post-mortem analysis
- ✅ Implement preventive measures

### Agenda

#### Part 1: Incident Classification (30 min)

**1. Severity Levels (15 min)**

| Severity          | Impact                  | Response Time | Examples                                   |
| ----------------- | ----------------------- | ------------- | ------------------------------------------ |
| **S1 - Critical** | Service down, data loss | 5 minutes     | API completely offline, database corrupted |
| **S2 - High**     | Major feature broken    | 15 minutes    | Authentication failing, payments broken    |
| **S3 - Medium**   | Minor feature broken    | 1 hour        | Dashboard not loading, slow reports        |
| **S4 - Low**      | Cosmetic issues         | 24 hours      | Typos, styling issues                      |

**2. Incident Response Flow (15 min)**

```
Incident Detected
       ↓
 Classify Severity
       ↓
    ┌──────────────┐
    │              │
   S1/S2          S3/S4
    │              │
    ↓              ↓
Assemble      Assign to
War Room      On-call
    │              │
    ↓              ↓
Investigate   Investigate
    │              │
    ↓              ↓
 Fix/Rollback  Fix Normally
    │              │
    ↓              ↓
  Verify        Verify
    │              │
    └──────┬───────┘
           ↓
    Post-Mortem
```

#### Part 2: Rollback Procedures (45 min)

**1. When to Rollback (10 min)**

Rollback immediately if:

- ✅ Error rate spikes > 5%
- ✅ Response time > 2x normal
- ✅ Database corruption detected
- ✅ Security vulnerability exploited
- ✅ Data loss occurring
- ✅ Unable to identify fix quickly

**2. Rollback Execution (20 min)**

**Method 1: Automated Rollback**

```bash
# Rollback to previous version
./scripts/rollback.sh

# Specify version
./scripts/rollback.sh v2.0.0

# Verify rollback
./scripts/health-check-runner.sh
```

**Method 2: Manual Rollback**

```bash
# 1. Identify previous good version
git log --oneline -10

# 2. Checkout previous version
git checkout v2.0.0

# 3. Deploy
./scripts/deploy.sh production --force

# 4. Verify
curl http://api/health
```

**Method 3: Database Rollback**

```bash
# Rollback migrations
cd api && pnpm prisma:migrate:resolve --rollback

# Restore from backup if needed
./scripts/restore-backup.sh 2026-01-14-23-00
```

**3. Rollback Drill (15 min)**

**Scenario**: Critical bug deployed to production

**Team Exercise**:

1. Detect issue (simulated alert)
2. Classify as S1
3. Assemble war room
4. Execute rollback
5. Verify system health
6. Communicate to stakeholders

**Timer**: 10 minutes to complete

#### Part 3: Post-Mortem Process (45 min)

**1. Post-Mortem Template (15 min)**

```markdown
# Incident Post-Mortem

## Summary

- **Incident ID**: INC-2026-001
- **Date**: January 15, 2026
- **Duration**: 23 minutes
- **Severity**: S1
- **Impact**: API unavailable for all users

## Timeline

- 14:32 - Deployment v2.1.0 started
- 14:35 - Error rate spike detected (3%)
- 14:37 - Alert triggered
- 14:38 - War room assembled
- 14:40 - Issue identified (database migration failure)
- 14:45 - Rollback initiated
- 14:50 - Rollback complete
- 14:55 - System verified healthy

## Root Cause

Database migration script contained syntax error that wasn't caught in staging due to different PostgreSQL version.

## Impact

- Users affected: 100% (all users)
- Downtime: 23 minutes
- Revenue loss: Estimated $2,300
- Customer complaints: 47

## What Went Well

- Alert fired within 2 minutes
- Team assembled quickly
- Rollback executed smoothly
- Communication clear

## What Went Wrong

- Staging environment not matching production
- Migration not tested on production-like database
- No pre-deployment validation of migrations

## Action Items

- [ ] Upgrade staging PostgreSQL to match production (Owner: DevOps, Due: Jan 20)
- [ ] Add migration validation to CI/CD (Owner: Engineering, Due: Jan 18)
- [ ] Implement blue-green deployments (Owner: DevOps, Due: Feb 1)
- [ ] Database version check in pre-flight (Owner: Engineering, Due: Jan 17)
```

**2. Blameless Culture (15 min)**

**Principles**:

- Focus on systems, not individuals
- Learn from failures
- Improve processes
- Share knowledge
- No punishment for honest mistakes

**Bad Post-Mortem**:

> "John deployed broken code and didn't test it properly."

**Good Post-Mortem**:

> "Our deployment process allowed untested database migrations to reach production. We need automated validation."

**3. Prevention Strategies (15 min)**

**Common Prevention Tactics**:

1. **Better Testing**: Unit, integration, E2E
2. **Environment Parity**: Staging = Production
3. **Gradual Rollouts**: Canary deployments
4. **Automated Validation**: Pre-flight checks
5. **Feature Flags**: Quick disable without deployment
6. **Monitoring**: Early detection
7. **Disaster Recovery**: Backup, rollback plans

### Hands-On Exercises

**Exercise 1: Incident Simulation**

- Respond to simulated S1 incident
- Execute rollback
- Document timeline
- Complete under 15 minutes

**Exercise 2: Post-Mortem Writing**

- Given incident details, write complete post-mortem
- Include timeline, root cause, action items
- Follow blameless principles

**Exercise 3: Prevention Planning**

- Review historical incidents
- Identify patterns
- Propose preventive measures
- Estimate implementation effort

### Assessment

**Simulation Exam**:

1. Classify 5 incident scenarios (S1-S4)
2. Execute rollback in simulated environment
3. Write post-mortem for given incident
4. Propose 3 preventive measures

**Pass Criteria**: Complete all 4 tasks successfully

---

## 📜 CERTIFICATION

### Requirements

- ✅ Attend all 3 sessions
- ✅ Pass all assessments (80%+ score)
- ✅ Complete hands-on exercises
- ✅ Shadow 1 production deployment
- ✅ Participate in 1 incident drill

### Certificate Issued

```
═══════════════════════════════════════════════════════════
           INFAMOUS FREIGHT ENTERPRISES
    POST-DEPLOYMENT OPERATIONS CERTIFICATION
═══════════════════════════════════════════════════════════

This certifies that

                    [EMPLOYEE NAME]

has successfully completed the Post-Deployment Operations
Training Program and is qualified to:

✓ Execute production deployments
✓ Manage feature flags and A/B tests
✓ Respond to production incidents
✓ Perform emergency rollbacks
✓ Conduct post-mortem analysis

Certified on: [DATE]
Valid until: [DATE + 1 YEAR]

_________________________        _________________________
Engineering Manager              CTO

═══════════════════════════════════════════════════════════
```

### Access Granted

With certification, employees receive:

- ✅ Production deployment access
- ✅ Feature flag admin access
- ✅ A/B testing dashboard access
- ✅ Incident war room access
- ✅ Post-mortem write access

---

## 📊 TRAINING METRICS

### Success Criteria

- **Attendance**: 100% of required team members
- **Pass Rate**: >90% on all assessments
- **Deployment Success**: >95% of deployments successful post-training
- **Incident Response**: <10 minutes to respond to S1
- **Post-Mortem Quality**: All incidents documented within 48 hours

### Follow-Up

- **1 Week**: Check-in meeting with each trainee
- **1 Month**: Review deployment metrics
- **3 Months**: Refresher session if needed
- **1 Year**: Re-certification required

---

## 📚 ADDITIONAL RESOURCES

### Documentation

- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md)
- [Incident Response Playbook](./INCIDENT_RESPONSE_PLAYBOOK.md)
- [Feature Flags Guide](./FEATURE_FLAGS_GUIDE.md)
- [A/B Testing Guide](./AB_TESTING_GUIDE.md)

### Practice Environments

- Staging: <https://staging.infamousfreight.com>
- Training: <https://training.infamousfreight.com>

### Support

- Slack: #deployment-support
- On-call: +1 (555) 123-4567
- Email: <devops@infamousfreight.com>

---

**Training Program Version**: 1.0  
**Last Updated**: January 15, 2026  
**Next Review**: July 15, 2026
