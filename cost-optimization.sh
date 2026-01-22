#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# PHASE 9: COST OPTIMIZATION AUTOMATION
# Reduce infrastructure costs by 30-50% while maintaining performance
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="cost_analysis_${TIMESTAMP}.txt"

# ═══════════════════════════════════════════════════════════════════════════
# CURRENT COST ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════

analyze_current_costs() {
  echo -e "${BLUE}💰 Analyzing current infrastructure costs...${NC}"
  
  cat << EOF | tee -a "$REPORT_FILE"

╔═══════════════════════════════════════════════════════════════════════════╗
║               CURRENT INFRASTRUCTURE COST ANALYSIS                        ║
║                        Generated: $(date)                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

1. FLY.IO COSTS (API & Database)
═══════════════════════════════════════════════════════════════════════════

  Current Setup (Pay-as-you-go):
  ├─ API Service: 2 shared-cpu instances @ \$5.70/mo each = \$11.40/mo
  ├─ Database: Postgres instance (3GB) = ~\$30-50/mo
  ├─ Data transfer (outbound): ~\$0.02/GB
  ├─ Backups: Automatic = included
  └─ Total Fly.io: ~\$45-65/mo

2. VERCEL COSTS (Web Frontend)
═══════════════════════════════════════════════════════════════════════════

  Current Setup:
  ├─ Pro plan: \$20/mo
  ├─ Analytics: Included
  ├─ CDN/Bandwidth: ~\$0-10/mo (included in pro)
  └─ Total Vercel: ~\$20-30/mo

3. SERVICES & ADD-ONS
═══════════════════════════════════════════════════════════════════════════

  Optional Services (if enabled):
  ├─ Sentry: Free tier or \$29/mo starter
  ├─ Datadog: \$15-30/mo (basic APM)
  ├─ PagerDuty: Free tier or \$0.02/incident
  ├─ Redis (managed): Not needed (can be local)
  └─ Total Services: \$0-70/mo (varies)

4. STORAGE & BACKUPS
═══════════════════════════════════════════════════════════════════════════

  ├─ Database backups: Included with Fly.io
  ├─ Object storage (if used): Not currently active
  └─ Total Storage: \$0/mo

5. CURRENT MONTHLY ESTIMATE
═══════════════════════════════════════════════════════════════════════════

  Minimum:    \$65-80/mo   (Just Fly.io + Vercel)
  Standard:   \$95-110/mo  (+ free monitoring)
  Premium:    \$140-180/mo (+ paid services)

EOF
}

# ═══════════════════════════════════════════════════════════════════════════
# COST OPTIMIZATION STRATEGIES
# ═══════════════════════════════════════════════════════════════════════════

optimization_strategy() {
  cat << EOF | tee -a "$REPORT_FILE"

╔═══════════════════════════════════════════════════════════════════════════╗
║                    COST OPTIMIZATION STRATEGIES                           ║
║                      (Save 30-50% immediately)                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

STRATEGY 1: FLY.IO RESERVED CAPACITY
═══════════════════════════════════════════════════════════════════════════

  Current: Pay-as-you-go ~\$45-65/mo
  
  Option A - Shared CPU Commitment (RECOMMENDED)
  ├─ Switch to shared-cpu-1x instances
  ├─ Use reserved capacity (1-year commitment)
  ├─ Savings: ~30% vs. pay-as-you-go
  ├─ Cost: ~\$32-45/mo (vs \$45-65)
  └─ Impact: Same performance for smaller apps
  
  Option B - Premium Tier (if scaling needed)
  ├─ Dedicated CPU instances
  ├─ Auto-scaling enabled
  ├─ Cost: \$60-80/mo (as needed)
  └─ Impact: Better for high-traffic periods
  
  Action Plan:
  1. Analyze current CPU/memory usage
     flyctl status -a infamous-freight-api --json | jq '.Instances'
  2. Right-size instances
     flyctl machine update <id> --vm-memory 256
  3. Consider spot instances for non-critical tasks
     flyctl scale count -a infamous-freight-api 1 --auto-start

STRATEGY 2: DATABASE OPTIMIZATION
═══════════════════════════════════════════════════════════════════════════

  Current: ~\$30-50/mo (managed Postgres)
  
  Option A - Self-Hosted on Fly.io (SAVE 40%)
  ├─ Run PostgreSQL in container on Fly.io
  ├─ Manage backups with scripts
  ├─ Cost: ~\$15-20/mo (includes compute)
  ├─ Savings: ~\$15-30/mo
  └─ Trade-off: Manual backup management
  
  Option B - Database Sharing (SAVE 50%)
  ├─ Use hosted services with lower tiers
  ├─ Implement read replicas for scaling
  ├─ Cost: ~\$15-25/mo (cheaper tier)
  └─ Trade-off: Lower resource limits
  
  Option C - PostgreSQL Citus (SAVE 20%)
  ├─ Keep managed DB but switch to optimized plan
  ├─ Better query performance = fewer resources needed
  ├─ Cost: \$25-35/mo
  └─ Savings: \$5-15/mo
  
  Action Plan:
  1. Analyze current DB usage
     flyctl pg statistics -a infamous-freight-db
  2. Implement indexes (free performance boost)
     bash DATABASE_OPTIMIZATION.md
  3. Consider right-sizing database tier

STRATEGY 3: BANDWIDTH OPTIMIZATION
═══════════════════════════════════════════════════════════════════════════

  Current: ~\$0-20/mo (outbound data transfer)
  
  Optimizations (SAVE 10-20%):
  ├─ Enable gzip compression (done in Next.js)
  ├─ Use CDN for static assets (Vercel + Fly.io handles)
  ├─ Optimize API response sizes
  │  ├─ Remove unused fields from queries
  │  ├─ Implement pagination
  │  └─ Use field selection (GraphQL or sparse JSON)
  ├─ Implement caching headers
  │  ├─ Set Cache-Control: max-age=3600
  │  ├─ Use ETag for conditional requests
  │  └─ Implement 304 Not Modified responses
  └─ Compress images and media
  
  Action Plan:
  1. Audit API endpoints for large responses
     flyctl logs -a infamous-freight-api | grep "size\|bytes"
  2. Enable compression middleware (already configured)
  3. Add cache headers to static endpoints

STRATEGY 4: COMPUTE RESOURCE OPTIMIZATION
═══════════════════════════════════════════════════════════════════════════

  Current: Potentially over-provisioned for current load
  
  Optimizations (SAVE 40-60%):
  ├─ Rightsize machine specs
  │  ├─ Monitor actual usage: flyctl metrics
  │  ├─ Drop from 2GB to 1GB if < 50% utilized
  │  └─ Savings: ~\$10-20/mo per instance
  ├─ Use autoscaling instead of fixed capacity
  │  ├─ Scale down during off-hours
  │  ├─ Scale up for traffic spikes
  │  └─ Savings: ~20-30% on compute
  ├─ Consolidate services
  │  ├─ Run multiple services on shared instance
  │  └─ Savings: \$5-10/mo per service
  └─ Implement request batching
     └─ Reduce number of database queries
  
  Action Plan:
  1. Check current CPU/memory usage
     flyctl metrics -a infamous-freight-api
  2. Right-size if over-provisioned
     flyctl scale memory 512 -a infamous-freight-api
  3. Implement auto-start/stop for staging

STRATEGY 5: FREE SERVICES INSTEAD OF PAID
═══════════════════════════════════════════════════════════════════════════

  Potential Savings (SAVE \$50-80/mo):
  ├─ Sentry: Free tier (100 events/month)
  │  └─ Upgrade to \$29/mo only if needed
  ├─ Datadog: Free tier (limited APM)
  │  └─ Upgrade to \$15/mo for production
  ├─ PagerDuty: Free tier + community plan
  │  └─ Upgrade to \$0.02/incident as needed
  ├─ Redis: Local vs. managed
  │  ├─ If using managed: ~\$10-20/mo
  │  ├─ Use local Redis on Fly.io: FREE
  │  └─ Savings: \$10-20/mo
  └─ Email service: Use SendGrid free tier
     └─ 100 emails/day free
  
  Recommendation:
  - Start with free tiers for monitoring
  - Move to paid only when needed
  - Implement cost alerts

STRATEGY 6: LONG-TERM COMMITMENTS
═══════════════════════════════════════════════════════════════════════════

  1-Year Commitments (SAVE 30%):
  ├─ Fly.io: Request 1-year commitment discount
  ├─ Vercel Pro: Pay annually (~\$180/year = \$15/mo)
  ├─ Datadog: Annual commitment = ~\$12/mo (vs \$15/mo)
  └─ Potential Savings: ~\$40-50/mo

  Requirement:
  - Commit to platform for 1 year
  - May include onboarding discounts
  - Contact sales team for custom pricing

STRATEGY 7: RESOURCE CONSOLIDATION
═══════════════════════════════════════════════════════════════════════════

  Consolidate Services (SAVE 20%):
  ├─ API + Worker service on same instance
  │  ├─ Current: \$11.40/mo each (2 services)
  │  ├─ Consolidated: \$11.40/mo (1 instance)
  │  └─ Savings: \$11.40/mo
  ├─ Staging on shared instance
  │  ├─ Current: \$11.40/mo
  │  ├─ Consolidated: Auto-start when needed
  │  └─ Savings: \$11.40/mo
  └─ Total potential: ~\$22-30/mo

  Implementation:
  1. Keep API on its own instance (critical)
  2. Move staging to shared machine (auto-start)
  3. Run workers in background on main instance

EOF
}

# ═══════════════════════════════════════════════════════════════════════════
# IMPLEMENTATION ROADMAP
# ═══════════════════════════════════════════════════════════════════════════

implementation_roadmap() {
  cat << EOF | tee -a "$REPORT_FILE"

╔═══════════════════════════════════════════════════════════════════════════╗
║              COST OPTIMIZATION IMPLEMENTATION ROADMAP                     ║
║                        (Phased approach)                                  ║
╚═══════════════════════════════════════════════════════════════════════════╝

PHASE 1: IMMEDIATE WINS (Week 1 - SAVE \$15-25/mo, 0% risk)
═══════════════════════════════════════════════════════════════════════════

  [ ] 1.1 Enable Response Compression
      - Status: Likely already enabled
      - Effort: 5 minutes
      - Savings: \$2-5/mo (less bandwidth)
      - Command: npm test (verify gzip middleware)
  
  [ ] 1.2 Implement Cache Headers
      - Status: Partial (needs enhancement)
      - Effort: 2 hours
      - Savings: \$3-8/mo (better caching)
      - Files: api/src/middleware/securityHeaders.js
  
  [ ] 1.3 Right-Size Database Queries
      - Status: Partially optimized
      - Effort: 4 hours
      - Savings: \$5-10/mo (fewer DB operations)
      - Files: DATABASE_OPTIMIZATION.md
  
  [ ] 1.4 Analyze Current Usage
      - Status: Ready now
      - Effort: 1 hour
      - Savings: Data for decision-making
      - Commands: flyctl metrics, flyctl pg statistics
  
  Subtotal Savings: \$15-25/mo

PHASE 2: LOW-RISK OPTIMIZATIONS (Week 2 - SAVE \$20-40/mo, <5% risk)
═══════════════════════════════════════════════════════════════════════════

  [ ] 2.1 Switch to Shared-CPU Instances
      - Status: Ready to implement
      - Effort: 30 minutes
      - Savings: \$10-15/mo
      - Rollback: 2 minutes
      - Risk: Minimal (can scale up if needed)
      - Command: flyctl machine update <id> --vm-size shared-cpu-1x
  
  [ ] 2.2 Implement Auto-Scaling
      - Status: Ready to configure
      - Effort: 1 hour
      - Savings: \$5-10/mo
      - Rollback: Can disable anytime
      - Risk: Low (with proper thresholds)
      - Command: flyctl scale auto -a infamous-freight-api
  
  [ ] 2.3 Use Free Tier Monitoring
      - Status: Ready now
      - Effort: 1 hour
      - Savings: \$0-29/mo (depends on current setup)
      - Risk: Low (upgrade if needed)
      - Action: Use Sentry free tier, Datadog free tier
  
  Subtotal Savings: \$20-40/mo

PHASE 3: MEDIUM-RISK OPTIMIZATIONS (Week 3-4 - SAVE \$30-60/mo, 10-15% risk)
═══════════════════════════════════════════════════════════════════════════

  [ ] 3.1 Consolidate Services
      - Status: Needs planning
      - Effort: 8 hours
      - Savings: \$10-20/mo
      - Rollback: Split back to separate instances
      - Risk: Medium (requires load testing)
      - Plan: Keep API separate, move staging to shared instance
  
  [ ] 3.2 Optimize Database Tier
      - Status: Needs analysis
      - Effort: 2 hours
      - Savings: \$10-20/mo
      - Rollback: Upgrade back if needed
      - Risk: Medium (performance risk if downsized too much)
      - Action: Analyze usage, consider smaller tier or optimization
  
  [ ] 3.3 Implement Read Replicas (if needed)
      - Status: Not needed yet
      - Effort: 6 hours
      - Savings: \$5-10/mo (with proper caching)
      - Risk: Medium (replication setup)
      - Decision: Only if database is bottleneck
  
  Subtotal Savings: \$30-60/mo

PHASE 4: ADVANCED OPTIMIZATIONS (Month 2+ - SAVE \$40-100/mo, 15-25% risk)
═══════════════════════════════════════════════════════════════════════════

  [ ] 4.1 Self-Hosted Database
      - Status: Advanced implementation
      - Effort: 20 hours (includes ops burden)
      - Savings: \$15-30/mo
      - Rollback: Migrate back to managed (1-2 days)
      - Risk: High (backup management responsibility)
      - Decision: Only if team comfortable with ops
  
  [ ] 4.2 1-Year Commitments
      - Status: Ready to negotiate
      - Effort: 2 hours
      - Savings: \$40-50/mo (30% discount)
      - Risk: Low (locked in for 1 year)
      - Action: Contact Fly.io, Vercel, Datadog sales
  
  [ ] 4.3 Multi-Region Optimization
      - Status: Not needed for MVP
      - Effort: 40 hours
      - Savings: Depends on traffic distribution
      - Risk: High (complex infrastructure)
      - Decision: Implement only for large scale
  
  Subtotal Savings: \$40-100/mo

TOTAL POTENTIAL SAVINGS
═══════════════════════════════════════════════════════════════════════════

  Phase 1 (Immediate):      \$15-25/mo   (implement ALL)
  Phase 2 (Week 2):         \$20-40/mo   (implement 2.1 + 2.2)
  Phase 3 (Week 3-4):       \$30-60/mo   (implement 3.1 carefully)
  Phase 4 (Month 2+):       \$40-100/mo  (evaluate for long-term)
  ────────────────────────────────────────────────
  REALISTIC TOTAL:          \$80-150/mo  (within 4 weeks)
  MAXIMUM POTENTIAL:        \$150-225/mo (with all optimizations)

  Current Estimate:         \$100-130/mo
  Optimized Estimate:       \$20-50/mo   (realistic)
  
  SAVINGS: 60-80% reduction possible!

EOF
}

# ═══════════════════════════════════════════════════════════════════════════
# IMPLEMENTATION GUIDE
# ═══════════════════════════════════════════════════════════════════════════

implementation_guide() {
  cat << EOF | tee -a "$REPORT_FILE"

╔═══════════════════════════════════════════════════════════════════════════╗
║              STEP-BY-STEP IMPLEMENTATION GUIDE                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

STEP 1: ANALYZE CURRENT USAGE
═══════════════════════════════════════════════════════════════════════════

  # Check API resource usage
  flyctl metrics -a infamous-freight-api

  # Check database usage
  flyctl pg statistics -a infamous-freight-db

  # Check which services are running
  flyctl status -a infamous-freight-api

  ACTION: Document current usage for comparison

STEP 2: IMPLEMENT PHASE 1 (Day 1)
═══════════════════════════════════════════════════════════════════════════

  [ ] Verify compression is enabled
      grep -r "gzip\|compress" api/src/middleware/

  [ ] Analyze API response sizes
      flyctl logs -a infamous-freight-api | grep "size\|bytes" | tail -20

  [ ] Review and apply database indexes
      bash DATABASE_OPTIMIZATION.md

  ESTIMATED SAVINGS: \$15-25/mo

STEP 3: IMPLEMENT PHASE 2 (Day 2-3)
═══════════════════════════════════════════════════════════════════════════

  [ ] Switch to shared-cpu instances
      flyctl machine list -a infamous-freight-api
      # For each machine, run:
      # flyctl machine update <id> --vm-size shared-cpu-1x

  [ ] Test performance after change
      bash runbook-automation.sh health-check
      # Run load test:
      # K6_TOKEN=\$JWT k6 run load-test.k6.js

  [ ] Enable auto-scaling
      flyctl scale auto -a infamous-freight-api
      flyctl scale show -a infamous-freight-api

  [ ] Verify startup time (should be < 30 seconds)
      time curl https://api.fly.dev/api/health

  ESTIMATED SAVINGS: \$20-40/mo

STEP 4: MONITOR IMPACT (Week 1)
═══════════════════════════════════════════════════════════════════════════

  # Daily monitoring
  - Check Datadog dashboard for performance changes
  - Review error rate and latency in Sentry
  - Monitor user complaints in support channel
  - Track actual cost changes in Fly.io dashboard

  # If performance degrades:
  - Scale back up immediately
  - Investigate root cause
  - Adjust thresholds

  # If all looks good:
  - Proceed to Phase 3

STEP 5: IMPLEMENT PHASE 3 (Week 2-3, if confident)
═══════════════════════════════════════════════════════════════════════════

  [ ] Analyze service consolidation impact
      - Create staging environment on shared instance
      - Run load test to verify capacity

  [ ] If confident, consolidate:
      flyctl machine delete <staging-machine-id>
      # Move staging to auto-start shared machine

  [ ] Right-size database if needed
      - Review actual vs. provisioned capacity
      - Consider smaller database tier
      - Test query performance before downsize

  ESTIMATED SAVINGS: \$30-60/mo

STEP 6: LONG-TERM COST MANAGEMENT
═══════════════════════════════════════════════════════════════════════════

  [ ] Set up cost alerts
      - Fly.io dashboard: Set monthly budget alert
      - Set threshold: \$50/mo (alert if exceeded)

  [ ] Monthly cost review
      - Every 1st of month: Review Fly.io bill
      - Compare to optimized baseline
      - Identify new optimization opportunities

  [ ] Quarterly scaling review
      - Assess if resources still right-sized
      - Evaluate new instances if better pricing
      - Review monitoring for wasted capacity

COST MONITORING TEMPLATE
═══════════════════════════════════════════════════════════════════════════

  Date: ____________

  Current Costs:
    Fly.io API:         \$______/mo
    Fly.io Database:    \$______/mo
    Vercel:             \$______/mo
    Services:           \$______/mo
    ────────────────────────────
    Total:              \$______/mo

  Performance Metrics:
    API Response Time:  ______ms (target: <500ms)
    Error Rate:         ______% (target: <0.1%)
    Database Latency:   ______ms (target: <100ms)
    Uptime:             ______% (target: >99.9%)

  Notes:
    ________________________________________________
    ________________________________________________

  Next Review: ____________

EOF
}

# ═══════════════════════════════════════════════════════════════════════════
# COST COMPARISON CALCULATOR
# ═══════════════════════════════════════════════════════════════════════════

cost_comparison() {
  echo -e "${BLUE}📊 Building cost comparison...${NC}"
  
  cat << EOF | tee -a "$REPORT_FILE"

╔═══════════════════════════════════════════════════════════════════════════╗
║              BEFORE vs. AFTER COST COMPARISON                             ║
╚═══════════════════════════════════════════════════════════════════════════╝

BASELINE (Current Setup)
═══════════════════════════════════════════════════════════════════════════

  API Hosting (Fly.io):
    - 2 standard instances @ \$5.70/mo = \$11.40
    - Data transfer = \$2-5
    Subtotal: \$13.40-16.40/mo

  Database (Fly.io):
    - Managed PostgreSQL = \$30-50
    Subtotal: \$30-50/mo

  Frontend (Vercel):
    - Pro plan = \$20/mo
    - CDN included = included
    Subtotal: \$20/mo

  Monitoring (Services):
    - Sentry (free) = \$0
    - Datadog (free) = \$0
    - PagerDuty (free) = \$0
    Subtotal: \$0/mo

  BASELINE TOTAL: \$63.40-86.40/mo

OPTIMIZED (After Implementation)
═══════════════════════════════════════════════════════════════════════════

  Phase 1 + 2 Implementation:

  API Hosting (Fly.io):
    - 2 shared-cpu instances @ \$3.50/mo = \$7/mo
    - Auto-scaling enabled = -30% usage
    - Data transfer (optimized) = \$1-2
    Subtotal: \$8-9/mo

  Database (Fly.io):
    - Optimized queries (fewer operations)
    - Right-sized tier = \$20-30
    Subtotal: \$20-30/mo

  Frontend (Vercel):
    - Pro plan (annual discount) = \$15/mo
    - CDN optimized = included
    Subtotal: \$15/mo

  Monitoring (Services):
    - Sentry (free tier) = \$0
    - Datadog (free tier) = \$0
    - PagerDuty (free tier) = \$0
    Subtotal: \$0/mo

  OPTIMIZED TOTAL: \$43-54/mo

  MONTHLY SAVINGS: \$10-40/mo (20-50% reduction)
  ANNUAL SAVINGS: \$120-480/year

EOF
}

# ═══════════════════════════════════════════════════════════════════════════
# RISK ASSESSMENT
# ═══════════════════════════════════════════════════════════════════════════

risk_assessment() {
  cat << EOF | tee -a "$REPORT_FILE"

╔═══════════════════════════════════════════════════════════════════════════╗
║                      RISK ASSESSMENT & MITIGATION                         ║
╚═══════════════════════════════════════════════════════════════════════════╝

RISK 1: Performance Degradation (Medium Risk)
═══════════════════════════════════════════════════════════════════════════

  Risk: Downsizing instances might cause slower responses
  
  Mitigation:
  ✓ Load test before and after each change
  ✓ Keep auto-scaling enabled for burst capacity
  ✓ Monitor response times daily
  ✓ Quick rollback available (2-5 minutes)
  
  Decision Point:
  - If P95 latency increases >50%: scale back up
  - If error rate increases >0.5%: scale back up
  - Otherwise: optimization successful

RISK 2: Database Connection Pool Issues (Low-Medium Risk)
═══════════════════════════════════════════════════════════════════════════

  Risk: Fewer resources might exhaust connection pool under load
  
  Mitigation:
  ✓ Implement connection pooling (PgBouncer)
  ✓ Set proper pool size limits
  ✓ Monitor connection count daily
  ✓ Scale if approaching 80% utilization
  
  Decision Point:
  - If connections > 80% of max: add instances

RISK 3: Data Loss / Backup Issues (Low Risk)
═══════════════════════════════════════════════════════════════════════════

  Risk: Self-hosted databases require manual backups
  
  Mitigation:
  ✓ Use Fly.io managed database (current plan)
  ✓ Automatic daily backups included
  ✓ Monthly backup verification
  ✓ Disaster recovery testing quarterly
  
  Recommendation: Stay with managed database for peace of mind

RISK 4: Vendor Lock-in (Low Risk)
═══════════════════════════════════════════════════════════════════════════

  Risk: Committing to 1-year plans reduces flexibility
  
  Mitigation:
  ✓ Start with pay-as-you-go for phase 1-2
  ✓ Only commit to 1-year after proven stability
  ✓ Negotiate exit clauses in contracts
  ✓ Keep multi-cloud option (can move to AWS if needed)
  
  Recommendation: Phase 1-2 first, then consider 1-year commitment

RISK 5: Hidden Costs (Low Risk)
═══════════════════════════════════════════════════════════════════════════

  Risk: Unexpected charges or usage spikes
  
  Mitigation:
  ✓ Enable cost alerts in Fly.io (\$50/mo threshold)
  ✓ Review bills daily during implementation
  ✓ Rate limit aggressive for cost control
  ✓ Implement usage-based alerting
  
  Decision Point:
  - If monthly bill > \$60: investigate immediately

RISK SUMMARY
═══════════════════════════════════════════════════════════════════════════

  Overall Risk Level: LOW-MEDIUM (manageable with monitoring)
  
  High Confidence Optimizations:
  ✓ Response compression (no risk)
  ✓ Cache headers (no risk)
  ✓ Database indexes (no risk)
  ✓ Shared-cpu instances (low risk, easy rollback)
  
  Medium Confidence Optimizations:
  ⚠ Database right-sizing (medium risk, test first)
  ⚠ Service consolidation (medium risk, load test)
  
  Recommendation: Implement phase 1-2 with high confidence,
  proceed to phase 3 only after proving stability

EOF
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN REPORT GENERATOR
# ═══════════════════════════════════════════════════════════════════════════

generate_report() {
  > "$REPORT_FILE"  # Clear file
  
  echo -e "${GREEN}📋 Generating comprehensive cost optimization report...${NC}"
  
  analyze_current_costs
  echo ""
  optimization_strategy
  echo ""
  implementation_roadmap
  echo ""
  implementation_guide
  echo ""
  cost_comparison
  echo ""
  risk_assessment
  
  cat << EOF | tee -a "$REPORT_FILE"

╔═══════════════════════════════════════════════════════════════════════════╗
║                           FINAL RECOMMENDATIONS                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

IMMEDIATE ACTIONS (Start Today):
═══════════════════════════════════════════════════════════════════════════

  1. ✅ Analyze current usage
     flyctl metrics -a infamous-freight-api > baseline.txt

  2. ✅ Apply database indexes
     bash DATABASE_OPTIMIZATION.md

  3. ✅ Verify compression enabled
     npm test (verify gzip)

  4. ✅ Schedule load test
     Set date/time for baseline performance test

  EXPECTED IMPACT: \$5-10/mo savings + baseline for comparison

THIS WEEK ACTIONS:
═══════════════════════════════════════════════════════════════════════════

  1. Run Phase 1 optimizations (1-2 hours)
  2. Run load test to verify performance
  3. Monitor for 24 hours (no issues = proceed)
  4. Implement Phase 2 (30 min - 2 hours)
  5. Run another load test
  6. Monitor for 1 week (if stable = success!)

  EXPECTED IMPACT: \$20-40/mo savings

NEXT MONTH ACTIONS:
═══════════════════════════════════════════════════════════════════════════

  1. Evaluate Phase 3 (service consolidation)
  2. Negotiate 1-year commitment if cost savings proven
  3. Implement quarterly cost reviews

  EXPECTED IMPACT: \$50-80+/mo total savings

SUCCESS METRICS:
═══════════════════════════════════════════════════════════════════════════

  ✓ Monthly bill reduced from \$100-130 to \$50-70
  ✓ Performance maintained (P95 latency < 500ms)
  ✓ Error rate < 0.1%
  ✓ Uptime > 99.9%
  ✓ No customer complaints about performance

REPORT LOCATION: $REPORT_FILE

Next: Review implementation roadmap and start Phase 1!

EOF

  echo -e "${GREEN}✅ Report generated: $REPORT_FILE${NC}"
  echo -e "${BLUE}📄 View full report:${NC}"
  echo "  cat $REPORT_FILE"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

generate_report "$@"
