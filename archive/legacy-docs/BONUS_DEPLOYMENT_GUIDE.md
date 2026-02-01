# Bonus & Rewards System - 100% Complete Deployment Guide

**Version**: 2026.01 | **Status**: Production-Ready | **Date**: January 14, 2026

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Database Migration](#database-migration)
4. [API Routes Setup](#api-routes-setup)
5. [Configuration & Environment](#configuration--environment)
6. [Deployment Steps](#deployment-steps)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## 📊 SYSTEM OVERVIEW

### Architecture Components

```
├── Data Layer
│   ├── bonusesSystem.js (3,200+ lines)
│   └── rewardsTiers.js (800+ lines)
├── Service Layer
│   ├── bonusEngine.js (900+ lines)
│   └── loyaltyProgram.js (700+ lines)
├── API Layer
│   └── bonuses.js (500+ lines)
├── Database
│   └── bonus-schema.prisma (complete models)
└── Tests
    └── bonusSystem.test.js (comprehensive suite)
```

### Key Features

- ✅ 4-tier loyalty system (Bronze → Platinum)
- ✅ 6 bonus categories (Referral, Loyalty, Performance, Milestone, Promotional, Enterprise)
- ✅ Real-time points calculation
- ✅ Automatic tier progression/downgrade
- ✅ Performance-based driver bonuses
- ✅ Fraud detection mechanisms
- ✅ Comprehensive reporting

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Code Quality

- [x] All files created and tested
- [x] Code follows project patterns
- [x] Error handling implemented
- [x] Input validation included
- [x] Comments and documentation complete
- [x] No console.logs in production code

### Dependencies

- [x] No new npm packages required
- [x] Uses existing middleware
- [x] Compatible with Express.js stack
- [x] Prisma ORM ready

### Documentation

- [x] API documentation complete
- [x] Database schema documented
- [x] Integration tests included
- [x] Deployment guide provided

### Testing

- [x] Unit tests written
- [x] Integration tests included
- [x] Error cases covered
- [x] Edge cases tested

---

## 🗄️ DATABASE MIGRATION

### Step 1: Review Schema

```bash
# Check the bonus schema
cat prisma/bonus-schema.prisma
```

### Step 2: Create Migration

```bash
cd api
pnpm prisma migrate dev --name add-bonus-system
```

This will:

- Create migration file
- Apply to development database
- Generate Prisma Client

### Step 3: Verify Schema

```bash
pnpm prisma db push
```

### Step 4: Seed Initial Data (Optional)

```javascript
// api/prisma/seed.js - Add:

const prisma = require("@prisma/client");

async function seedBonusData() {
  // Create promotional bonuses
  await prisma.promotionalBonus.createMany({
    data: [
      {
        promotionCode: "NEWUSER2026",
        name: "New User Welcome",
        bonusAmount: 50.0,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        active: true,
      },
      // ... more promos
    ],
  });

  console.log("Bonus seed data created");
}
```

---

## 🔌 API ROUTES SETUP

### Step 1: Mount Routes in Express App

```javascript
// api/src/app.js or main.js

const bonusesRouter = require("./routes/bonuses");

app.use("/api/bonuses", bonusesRouter);
```

### Step 2: Verify Route Registration

```bash
# Test health endpoint
curl http://localhost:4000/api/bonuses/health

# Expected response:
# {
#   "success": true,
#   "status": "operational",
#   "version": "2026.01"
# }
```

### Step 3: Import Services

```javascript
// routes/bonuses.js already includes:
const BonusEngine = require("../services/bonusEngine");
const LoyaltyProgram = require("../services/loyaltyProgram");
```

---

## ⚙️ CONFIGURATION & ENVIRONMENT

### Add to `.env` or `.env.example`

```env
# Bonus System Configuration
BONUS_SYSTEM_ENABLED=true
BONUS_MAX_MONTHLY=10000.00
BONUS_MAX_ANNUAL=100000.00
BONUS_MIN_REDEMPTION=5.00
BONUS_POINTS_CONVERSION=0.05

# Feature Flags
FEATURE_REFERRAL_BONUSES=true
FEATURE_LOYALTY_TIERS=true
FEATURE_PERFORMANCE_BONUSES=true
FEATURE_MILESTONE_BONUSES=true
FEATURE_PROMOTIONAL_BONUSES=true
FEATURE_ANTI_FRAUD=true

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/infamous_freight

# JWT Scopes (ensure these are included in your JWT)
JWT_SCOPES=bonus:referral,bonus:loyalty,bonus:points,bonus:redeem,bonus:milestones,bonus:performance,bonus:report
```

### Verify JWT Scopes

```javascript
// In your JWT creation logic, include bonus scopes:

const payload = {
  sub: userId,
  email: userEmail,
  role: userRole,
  scopes: [
    "bonus:referral",
    "bonus:loyalty",
    "bonus:points",
    "bonus:redeem",
    "bonus:milestones",
    "bonus:performance",
    "bonus:report",
  ],
};
```

---

## 🚀 DEPLOYMENT STEPS

### Stage 1: Development Testing

```bash
# 1. Navigate to API directory
cd api

# 2. Install/update dependencies (none new required)
pnpm install

# 3. Run database migrations
pnpm prisma migrate deploy

# 4. Start development server
pnpm dev

# 5. Run tests
pnpm test -- bonusSystem.test.js

# 6. Manual API testing
# Test referral endpoint
curl -X POST http://localhost:4000/api/bonuses/referral/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"referrerEmail":"test@example.com"}'
```

### Stage 2: Staging Deployment

```bash
# 1. Deploy to staging environment
git push origin main

# 2. Run staging build
pnpm build

# 3. Apply database migrations to staging
PRISMA_DATABASE_URL=staging_db_url pnpm prisma migrate deploy

# 4. Run integration tests
pnpm test:integration

# 5. Performance testing
pnpm test:performance

# 6. Load testing (optional)
# Use tool like Artillery or k6
```

### Stage 3: Production Deployment

```bash
# 1. Create GitHub release
git tag -a v2026.01-bonus -m "Bonus & Rewards System v2026.01"
git push origin v2026.01-bonus

# 2. Deploy to production
# (Use your CI/CD pipeline - GitHub Actions, GitLab CI, etc.)

# 3. Verify health checks
curl https://api.infamousfreight.com/api/bonuses/health

# 4. Monitor application logs
# Check for errors in real-time monitoring system

# 5. Send deployment notification to team
```

---

## ✔️ POST-DEPLOYMENT VERIFICATION

### Immediate Checks (First 30 minutes)

```bash
# 1. Health check
curl https://api.infamousfreight.com/api/bonuses/health

# 2. Database connectivity
# Verify in logs that database queries are working

# 3. Error rates
# Monitor error logs - should be 0 for now

# 4. Response times
# Should be < 200ms for most endpoints

# 5. JWT scopes
# Verify users can authenticate with new scopes
```

### Functional Tests

```bash
# Test each bonus category:

# 1. Referral Bonus
curl -X POST https://api.infamousfreight.com/api/bonuses/referral/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"referrerEmail":"user@example.com"}'

# 2. Loyalty Tier
curl https://api.infamousfreight.com/api/bonuses/loyalty/tier/cust_123 \
  -H "Authorization: Bearer $TOKEN"

# 3. Points Balance
curl https://api.infamousfreight.com/api/bonuses/points/balance/cust_123 \
  -H "Authorization: Bearer $TOKEN"

# 4. Milestones
curl https://api.infamousfreight.com/api/bonuses/milestones/cust_123 \
  -H "Authorization: Bearer $TOKEN"

# 5. Health
curl https://api.infamousfreight.com/api/bonuses/health
```

### Data Verification

```bash
# Check database records created successfully:

SELECT COUNT(*) FROM loyalty_tiers;
SELECT COUNT(*) FROM loyalty_points;
SELECT COUNT(*) FROM customer_bonuses;
SELECT COUNT(*) FROM referral_programs;
SELECT COUNT(*) FROM driver_performance;
```

### Performance Benchmarks

| Endpoint                 | Target | Acceptable |
| ------------------------ | ------ | ---------- |
| `/loyalty/tier/:id`      | <100ms | <200ms     |
| `/points/balance/:id`    | <100ms | <200ms     |
| `/milestones/:id`        | <150ms | <300ms     |
| `/performance/calculate` | <200ms | <400ms     |
| `/report/:id`            | <300ms | <500ms     |

---

## 📊 MONITORING & TROUBLESHOOTING

### Key Metrics to Monitor

```
1. Error Rate
   - Target: < 0.1%
   - Alert threshold: > 1%

2. Response Time
   - Target: < 200ms (p95)
   - Alert threshold: > 500ms

3. Database Queries
   - Monitor for slow queries (>1s)
   - Check connection pool utilization

4. Authentication Failures
   - Monitor scope validation errors
   - Track JWT token issues

5. Business Metrics
   - Referrals created per day
   - Points redeemed per day
   - Tier upgrades per day
```

### Common Issues & Solutions

#### Issue: Bonus Routes Not Found (404)

```
Solution:
1. Verify routes are mounted in app.js
2. Check route file exists: api/src/routes/bonuses.js
3. Restart API server
4. Check console for import errors
```

#### Issue: Database Connection Errors

```
Solution:
1. Verify DATABASE_URL env variable
2. Check database server is running
3. Run: pnpm prisma db push
4. Check database user permissions
```

#### Issue: JWT Scope Errors (403)

```
Solution:
1. Verify scopes in JWT token
2. Check requireScope middleware config
3. Update JWT token to include bonus scopes
4. Test with valid scope: bonus:loyalty
```

#### Issue: Null/Undefined Values in Calculations

```
Solution:
1. Check input parameters are valid
2. Verify tier exists (bronze/silver/gold/platinum)
3. Ensure loyaltyTier is included in request
4. Check for null/undefined in error logs
```

### Debugging Commands

```javascript
// Enable verbose logging in bonusEngine.js:
async calculateReferralBonus(referralDetails) {
  console.log('[DEBUG] Referral Calculation Input:', referralDetails);
  // ... rest of method
  console.log('[DEBUG] Referral Result:', result);
  return result;
}

// Run with DEBUG env:
DEBUG=bonus:* pnpm dev
```

### Rollback Procedure

```bash
# If critical issues found:

# 1. Stop deployment
git revert HEAD

# 2. Remove bonus routes from app.js
# Comment out: app.use('/api/bonuses', bonusesRouter);

# 3. Restart API
pnpm dev

# 4. Verify normal operation
curl http://localhost:4000/api/health

# 5. Investigate issues
# Check logs in logs/error.log
```

---

## 📈 SCALING CONSIDERATIONS

### Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_loyalty_tier_customer ON loyalty_tiers(customer_id);
CREATE INDEX idx_loyalty_points_tier ON loyalty_points(loyalty_tier_id);
CREATE INDEX idx_customer_bonus_status ON customer_bonuses(status);
CREATE INDEX idx_referral_program_status ON referral_programs(status);
CREATE INDEX idx_bonus_audit_timestamp ON bonus_audit_log(timestamp);
```

### Caching Strategy

```javascript
// Cache tier benefits (rarely changes)
const tierBenefitsCache = new Map();

// Cache bonus calculations for 1 hour
const bonusCalcCache = new Map();
const CACHE_TTL = 3600000; // 1 hour
```

### Rate Limiting Adjustments

```javascript
// For high-volume periods, adjust limits:
limiters.general: 200 requests/15 min (increased from 100)
limiters.performance: 50 requests/1 min (increased from 20)
```

---

## 📞 SUPPORT & ESCALATION

### Critical Issues (P1)

- System down/500 errors
- Data corruption
- Security breaches
- Contact: engineering-oncall@infamousfreight.com

### High Priority (P2)

- Feature broken (e.g., points not accumulating)
- Performance degradation
- Database issues
- Contact: backend-team@infamousfreight.com

### Medium Priority (P3)

- Minor bugs
- Documentation updates
- Performance optimization
- Contact: backend-team@infamousfreight.com via issue tracker

---

## ✅ DEPLOYMENT COMPLETION CHECKLIST

- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Database migration tested
- [ ] Routes mounted and tested
- [ ] Environment variables configured
- [ ] JWT scopes added
- [ ] Health check working
- [ ] All bonus endpoints tested
- [ ] Performance acceptable
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment
- [ ] Documentation updated
- [ ] Rollback procedure ready

---

## 📚 RELATED DOCUMENTATION

- [API Documentation](BONUS_API_DOCUMENTATION.md)
- [Bonus System Overview](BONUSES_2026_COMPLETE.md)
- [Database Schema](prisma/bonus-schema.prisma)
- [Integration Tests](api/src/__tests__/bonusSystem.test.js)
- [Routes Implementation](api/src/routes/bonuses.js)

---

**Version**: 2026.01 | **Status**: ✅ Complete | **Last Updated**: January 14, 2026

For questions or issues, contact: bonuses@infamousfreight.com
