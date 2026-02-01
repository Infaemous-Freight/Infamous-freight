# 🎮 Perfect Performance System - Command Reference & Deployment Guide

**Quick Command Reference for All Phases**  
**Use this for daily development and deployment**

---

## 🚀 Phase 1: Setup & Onboarding

### **Initial Setup (First Time)**

```bash
# 1. Clone repository
git clone <repo-url>
cd Infamous-freight-enterprises

# 2. Run automated setup
bash setup-perfect-system.sh

# 3. Verify installation
pnpm check:types
pnpm lint
pnpm test -- --coverage

# 4. Capture baseline metrics
cd web && ANALYZE=true pnpm build
# Record bundle sizes from bundle-report.html
```

### **Team Onboarding**

```bash
# 1. Developer setup
# Read: PERFECT_PERFORMANCE_SYSTEM_100_PERCENT_QUICK_START.md (10 min)
# Read: ROUTE_BUILDING_MASTER_SYSTEM_100_PERCENT.md (30 min)
# Watch: Team walkthrough video (if exists)

# 2. Infrastructure verification
pnpm install
cd api && pnpm prisma:generate
cd web && npm ls @next/bundle-analyzer

# 3. First PR template verification
# Create test PR and verify checklist appears
```

---

## 📝 Phase 2: Building Perfect Routes

### **Create New Perfect Route**

```bash
# 1. Copy template pattern
# Decide route type:
#   - GET /api/resource (LIST) → Copy Pattern 3
#   - POST /api/resource (CREATE) → Copy Pattern 1
#   - GET /api/resource/:id (READ) → Copy Pattern 2
#   - PUT /api/resource/:id (UPDATE) → Copy Pattern 4
#   - DELETE /api/resource/:id (DELETE) → Copy Pattern 5

# Location: api/src/routes/resource.js
# Reference: ROUTE_BUILDING_MASTER_SYSTEM_100_PERCENT.md

# 2. Implementation
npm run dev  # Start development server
# Edit route, add business logic
# Keep middleware stack intact (8-layer order)

# 3. Add tests
# Location: api/tests/routes/resource.test.js
# Include all 7 test categories from template

# 4. Verify checklist items
pnpm test -- --coverage resource.test
# Target: >75% coverage

# 5. Full validation
pnpm lint
pnpm check:types
pnpm test -- --coverage
cd web && ANALYZE=true pnpm build

# 6. Create PR
git checkout -b feat/new-route
git add -A
git commit -m "feat: add perfect route for resource"
git push origin feat/new-route

# 7. Verification in PR
# ✅ All CI checks pass
# ✅ 100-point checklist filled out
# ✅ Code review approved
# ✅ Ready to merge
```

### **Testing During Development**

```bash
# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test -- routes/shipments.test.js

# Generate coverage report
pnpm test -- --coverage

# View coverage in browser
open coverage/index.html

# Run all validations (as in CI)
pnpm check:types && pnpm lint && pnpm test -- --coverage
```

### **Build Process**

```bash
# Development build
pnpm dev

# Production build
pnpm build

# Bundle analysis (see size report)
cd web && ANALYZE=true pnpm build

# Check bundle size is under 150KB
npm run build --filter @infamous-freight/web
# Check output: Next.js build stats
```

---

## 🔍 Phase 3: Refactoring & Performance

### **Refactor Legacy Route**

```bash
# 1. Identify route to refactor
# Check: EXECUTION_PHASE_3_REFACTOR_PERFORMANCE.md (critical routes list)

# 2. Backup existing tests
git checkout -b refactor/old-route-upgrade
cp api/src/routes/old-route.js api/src/routes/old-route.js.backup

# 3. Identify pattern needed
# Based on route type:
#   GET /search → LIST pattern
#   POST /charge → CREATE + special handling pattern
#   PUT /update → UPDATE pattern

# 4. Migrate using pattern
# Copy pattern from ROUTE_BUILDING_MASTER_SYSTEM_100_PERCENT.md
# Adapt for existing business logic
# Keep backwards compatibility

# 5. Add comprehensive tests
# Include all 7 test categories
# Test backwards compatibility
# Target: >75% coverage

# 6. Performance testing
time curl -X GET http://localhost:4000/api/old-route
# Compare: before vs after times

# 7. Deploy with feature flag (optional)
# Use: process.env.USE_PERFECT_ROUTE
# Gradual rollout: 10% → 50% → 100%

# 8. Monitor
# Check Sentry for errors
# Watch error rate
# Verify response times improved
```

### **Performance Optimization**

```bash
# Bundle Analysis
cd web
ANALYZE=true pnpm build
# Review bundle-report.html in browser
# Identify opportunities:
#   - Remove unused dependencies
#   - Add code splitting
#   - Lazy load heavy components

# API Performance
# Start in profiling mode
node --trace-warnings api/server.js 2>&1 | grep -i require

# Identify slow imports
node --trace-warnings . 2>&1 | head -50

# Measure startup time
time npm start
# Target: <1.5 seconds

# Database Query Optimization
cd api
npm run prisma:generate
npm run dev
# Monitor: SELECT count(*) in logs
# Verify: No N+1 queries
# Check: All queries use select/include

# Cache Validation
curl -X GET http://localhost:4000/api/resource
# Check headers: X-Cache-Hit, Cache-Control
# Verify: Second request is cached

# Monitoring
# Check Sentry dashboard for new errors
# Watch monitoring metrics
# Review error spike alerts
```

---

## ⚙️ Phase 4: Maintenance & Continuous Improvement

### **Weekly Maintenance**

```bash
# Monday Morning (30 min)
# 1. Review metrics
cat BASELINE_METRICS.md
# Compare to current week
# Look for regressions >10%

# 2. Check bundle size
cd web && ANALYZE=true pnpm build
# If increased: investigate and optimize

# 3. Review error rate
# Check Sentry dashboard
# Look for new error types
# Alert if error rate >0.5%

# 4. Team metrics
# Count routes completed
# Calculate average dev time
# Track bug rate

# Update weekly dashboard
vi metrics/weekly-$(date +%V).json
```

### **Monthly Deep Dive**

```bash
# First Friday (2 hours)

# 1. Performance Review
pnpm test -- --coverage
# Target: >75% on all routes
# If below: plan coverage additions

# 2. Bundle Analysis
cd web && ANALYZE=true pnpm build
# Record sizes: js, css, total
# Compare to last month

# 3. Error Analysis
# Review Sentry dashboard
# Top 5 errors
# Investigate root causes
# Create issues for fixes

# 4. Database Performance
cd api
npm run prisma:studio
# Review slow queries
# Check for N+1 patterns
# Monitor query times

# 5. Team Performance
# Calculate metrics:
#   - Routes per developer per week
#   - Average code review time
#   - Bug rate per route
#   - Rework rate

# Generate monthly report
cat > MONTHLY_REPORT_$(date +%Y-%m).md << 'EOF'
# Monthly Report - [Month]

## Performance
- Bundle size: __ KB (target <300KB)
- API startup: __ s (target <1.5s)
- p95 latency: __ ms (target <200ms)

## Quality
- Test coverage: __% (target >75%)
- Type errors: __ (target 0)
- Lint warnings: __ (target 0)

## Team
- Routes built: __
- Avg dev time: __ min
- Bug rate: __%

## Issues to Address
1. ...
2. ...
3. ...

## Action Items
- [ ] ...
- [ ] ...
EOF
```

### **Quarterly Review**

```bash
# Every 3 months (Full day)

# 1. Architecture Assessment
# Read through all patterns
# Are they still optimal?
# Any new patterns needed?

# 2. Dependency Audit
npm outdated
npm audit
# Update security vulnerabilities
# Plan dependency upgrades

# 3. Team Scaling Assessment
# How many developers?
# Are patterns scaling?
# Need new process?
# Training requirements?

# 4. Technology Evaluation
# Node.js version: should upgrade?
# Next.js version: should upgrade?
# Prisma version: should upgrade?

# 5. Retrospective
# What worked well?
# What could improve?
# Team feedback?
```

### **Annual Health Check**

```bash
# January (Full week)

# 1. Complete Audit
# Code quality: run full test suite
pnpm test -- --coverage
# Performance: profile all endpoints
# Security: penetration testing
# User feedback: collect feedback

# 2. Architecture Review
# 1-year trajectory assessment
# Are current patterns working?
# Scalability for next year?
# Technology refresh needed?

# 3. Team Retrospective
# Developer satisfaction survey
# Skills inventory
# Training needs
# Career development plans

# 4. Roadmap Planning
# Year 2 goals
# Architecture improvements
# Technology updates
# Team growth strategy

# 5. Executive Summary
cat > ANNUAL_REPORT_2026.md << 'EOF'
# Annual Report 2026

## Metrics
- Velocity: X% improvement
- Quality: X% improvement
- Performance: X% improvement

## Team
- Size: X → Y developers
- Satisfaction: X/10
- Turnover: X%

## Achievements
- Built X routes
- Improved performance X%
- Reduced bugs X%

## Goals for 2027
- ...
- ...
- ...
EOF
```

---

## 🐛 Troubleshooting Commands

### **If Tests Fail**

```bash
# 1. Run single test
pnpm test -- resource.test.js

# 2. Run with debug output
DEBUG=* pnpm test -- resource.test.js

# 3. Check mocks
grep -r "jest.mock" api/tests/

# 4. Check Prisma mock
cat api/tests/mocks/prisma.js

# 5. Reset test environment
pnpm test -- --clearCache

# 6. Full test run with logs
pnpm test -- --verbose --no-coverage
```

### **If Performance Degrades**

```bash
# 1. Check bundle size
cd web && ANALYZE=true pnpm build
# Compare report to baseline

# 2. Check API startup time
time npm start
# Target: <1.5 seconds

# 3. Check response times
# In dev: check console logs
# In prod: check Sentry/Datadog

# 4. Check database queries
# Run: pnpm prisma:studio
# Review: query performance
# Look for: N+1 patterns

# 5. Check cache effectiveness
# Monitor: X-Cache-Hit headers
# Look for: high hit rate (>60%)

# 6. Profile API
node --prof server.js
node --prof-process isolate-*.log > profile.txt
# Analyze: where time is spent
```

### **If CI/CD Fails**

```bash
# 1. Check logs
# GitHub Actions: Review workflow output

# 2. Run locally what CI runs
pnpm check:types
pnpm lint
pnpm test -- --coverage
cd web && ANALYZE=true pnpm build

# 3. Check each step
# Type checking
pnpm check:types
# If failed: fix types

# Linting
pnpm lint
# If failed: run pnpm format && pnpm lint

# Tests
pnpm test -- --coverage
# If failed: check test output, see test section above

# Bundle
cd web && ANALYZE=true pnpm build
# If failed: check bundle report, see bundle analysis
```

### **If Route Doesn't Work**

```bash
# 1. Start dev server
pnpm dev

# 2. Test endpoint
curl -X POST http://localhost:4000/api/resource \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field":"value"}'

# 3. Check logs
# Look in console for errors
# Check Sentry dashboard

# 4. Debug route
# Add console.log statements
# Check request body
# Check middleware execution

# 5. Check authentication
# Verify token is valid
# Check scopes: curl header Authorization
# Check JWT payload: jwt.io

# 6. Check validation
# Test empty fields
# Test invalid types
# Check error messages

# 7. Check database
pnpm prisma:studio
# Verify: Data created/updated
# Check: No duplicate records
```

---

## 📊 Useful Commands Summary

### **Development**

```bash
pnpm dev                          # Start all services
pnpm api:dev                      # Start only API
pnpm web:dev                      # Start only web
pnpm test                         # Run all tests
pnpm test -- --watch             # Watch mode
pnpm lint                         # Check linting
pnpm format                       # Auto-format code
pnpm check:types                  # TypeScript check
```

### **Builds & Analysis**

```bash
cd web && ANALYZE=true pnpm build  # Bundle analysis
pnpm build                        # Production build
npm ls @next/bundle-analyzer     # Check analyzer installed
npm outdated                      # Check outdated packages
npm audit                         # Security audit
```

### **Database**

```bash
cd api && pnpm prisma:generate    # Generate Prisma client
cd api && pnpm prisma:studio      # Prisma Studio UI
cd api && pnpm prisma:migrate:dev # Create migration
```

### **Git & CI**

```bash
git status                        # Current changes
git add -A                        # Stage all
git commit -m "feat: description" # Commit
git push origin branch-name       # Push to PR
git log --oneline                 # Recent commits
```

---

## 📚 Quick Document Index

| Need        | Document                                              | Time   |
| ----------- | ----------------------------------------------------- | ------ |
| Quick start | PERFECT_PERFORMANCE_SYSTEM_100_PERCENT_QUICK_START.md | 10 min |
| Build route | ROUTE_BUILDING_MASTER_SYSTEM_100_PERCENT.md           | 30 min |
| Optimize    | BUNDLE_ANALYSIS_100_PERCENT_COMPLETE.md               | 20 min |
| Performance | CODE_SPLITTING_100_PERCENT_COMPLETE.md                | 20 min |
| All phases  | EXECUTION*PHASE_1/2/3/4*\*.md                         | varies |
| Commands    | THIS FILE                                             | -      |

---

## 🎯 Success Checklist - When to Move to Next Phase

### **Before Phase 2 (After Phase 1):**

```
□ Team read all guides
□ Example routes deployed
□ Tests passing (>75%)
□ Bundle analysis working
□ PR template active
□ CI/CD pipeline working
□ Team confident
```

### **Before Phase 3 (After Phase 2):**

```
□ 5-7 new routes deployed
□ All tests passing
□ No regressions in metrics
□ Team velocity 60% faster
□ Code review time <15 min
□ Bug rate <0.1%
```

### **Before Phase 4 (After Phase 3):**

```
□ Legacy routes refactored
□ Performance targets met
□ Bundle <300KB
□ Latency <200ms
□ Error rate <0.2%
□ Coverage >75%
□ Team satisfied
```

---

**Bookmark this page for daily reference!**

Created: January 22, 2026  
Last Updated: January 22, 2026
