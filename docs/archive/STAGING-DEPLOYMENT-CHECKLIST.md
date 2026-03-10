# Staging Deployment Checklist
## Phase 5 → Production Readiness Validation

**Status**: Starting Staging Deployment  
**Date**: February 22, 2026  
**Target**: Validate Phase 5 improvements before production  
**Duration**: ~2-3 hours (testing + metrics collection)

---

## 📋 Pre-Deployment Checklist (Verify Green ✅)

### Code Quality (5 mins)
- [ ] **Build Verification**
  ```bash
  pnpm build
  ```
  Expected: All packages compile successfully
  
- [ ] **TypeScript Check** (API & Web)
  ```bash
  # API
  cd apps/api && pnpm build
  
  # Web
  cd apps/web && pnpm typecheck
  ```
  Expected: No TypeScript errors

- [ ] **Linting**
  ```bash
  pnpm lint
  ```
  Expected: 0 errors in API/Web (warnings acceptable)

- [ ] **Git Status**
  ```bash
  git status
  ```
  Expected: Clean working tree, all commits pushed

### Dependencies (2 mins)
- [ ] **pnpm Version**: `8.15.9`
  ```bash
  pnpm --version
  ```

- [ ] **Node Version**: Check `.nvmrc` or `18.x+`
  ```bash
  node --version
  ```

### Environment (3 mins)
- [ ] **Database**: PostgreSQL running/accessible
- [ ] **Redis**: Optional (infrastructure ready, can skip)
- [ ] **Ports Available**: 3000 (Web), 4000 (API standalone) or 3001 (Docker)
  ```bash
  lsof -i :3000
  lsof -i :3001
  ```

---

## 🚀 Staging Deployment Steps

### Phase A: Service Startup (10 minutes)

#### Option 1: Docker Compose (Recommended for staging)
```bash
# From workspace root
docker-compose up -d
# Wait for services to be healthy (~30 seconds)
docker-compose ps
```
Expected output:
```
postgres    UP (healthy)
api         UP (running)
web         UP (running)
redis       UP (running, optional)
```

#### Option 2: Local Development Mode
```bash
# Terminal 1: API
cd apps/api
pnpm dev

# Terminal 2: Web (in new terminal)
cd apps/web
pnpm dev

# Terminal 3: Monitor logs
tail -f apps/api/logs/combined.log
```

#### Verify Services Are Running
```bash
# Check API health
curl http://localhost:4000/api/health
# Expected: { "status": "ok", "database": "connected", ... }

# Check Web (should return 200)
curl -I http://localhost:3000
# Expected: HTTP/1.1 200
```

---

## ✅ Smoke Tests (15 minutes)

### Test 1: Endpoint Availability (5 mins)

**Shipment Endpoints** ✓
```bash
# Get all shipments (list endpoint - uses query optimizer)
curl -s http://localhost:4000/api/shipments \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Get single shipment
curl -s http://localhost:4000/api/shipments/1 \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Create shipment
curl -X POST http://localhost:4000/api/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "origin": "NYC",
    "destination": "LA",
    "driverId": 1,
    "status": "PENDING"
  }' | jq .
```

**Driver Endpoints** ✓
```bash
# Get drivers (list endpoint)
curl -s http://localhost:4000/api/drivers \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.data | length'
# Expected: > 0
```

**Health Check** ✓
```bash
curl -s http://localhost:4000/api/health | jq .
```

---

### Test 2: Shipment Validator (State Machine) (5 mins)

**Test Valid Transition**
```bash
# Create shipment (starts as PENDING)
SHIPMENT_ID=$(curl -s -X POST http://localhost:4000/api/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"origin":"NYC","destination":"LA"}' | jq -r '.data.id')

# Transition PENDING → ASSIGNED (valid)
curl -X PATCH http://localhost:4000/api/shipments/$SHIPMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"status":"ASSIGNED"}' | jq '.data.status'
# Expected: "ASSIGNED"
```

**Test Invalid Transition (should fail)**
```bash
# Try PENDING → DELIVERED (skips ASSIGNED, invalid)
curl -X PATCH http://localhost:4000/api/shipments/$SHIPMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"status":"DELIVERED"}' | jq '.error'
# Expected: Error message about invalid transition
```

✅ **Success Marker**: Validator prevents invalid states

---

### Test 3: Error Boundary (5 mins)

**Frontend Error Handling**
```bash
# Navigate to web app
open http://localhost:3000

# In browser console, trigger error:
window.__TEST_ERROR__ = true

# Manually trigger error (replace with actual error trigger):
# Visit special test page if available
# Or check React DevTools for error boundary status
```

✅ **Success Marker**: See error fallback UI instead of white screen

---

### Test 4: Correlation IDs & Logging (5 mins)

**Check Request Logs**
```bash
# Watch for correlation IDs in logs
tail -f apps/api/logs/combined.log | grep -i "correlationId"
# Expected: Each request has unique UUID
```

**Make test request and check for correlation ID**
```bash
# Get request
curl -s http://localhost:4000/api/shipments \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Request-ID: test-123"

# Check logs for correlation ID
grep "correlationId" apps/api/logs/combined.log | tail -5
# Expected: 
# {
#   "timestamp": "2026-02-22T...",
#   "correlationId": "uuid-xxx",
#   "path": "/api/shipments",
#   "method": "GET",
#   "duration": "XXms"
# }
```

✅ **Success Marker**: Correlation IDs tracked for all requests

---

## 📊 Performance Testing (30 minutes)

### Test 1: Query Optimizer Effectiveness (10 mins)

**Baseline: Check query count**

Create a test table with 100 records and measure:
```bash
# This would use query optimizer for eager loading
curl -s 'http://localhost:4000/api/shipments?limit=100' \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.data | length'

# Check database logs for query count
# Expected: 1 query (not 101)
```

**Latency Measurement**
```bash
# Measure response time
time curl -s 'http://localhost:4000/api/shipments?limit=50' \
  -H "Authorization: Bearer $JWT_TOKEN" > /dev/null

# Expected: < 500ms (was 800ms before optimization)
```

---

### Test 2: Request Logger (5 mins)

**Verify Comprehensive Logging**
```bash
# Each request should be logged with metadata
grep "path.*method.*duration" apps/api/logs/combined.log | tail -5

# Expected output format:
# {
#   "timestamp": "...",
#   "path": "/api/shipments",
#   "method": "GET",
#   "status": 200,
#   "duration": 245,
#   "userId": "uuid",
#   "correlationId": "uuid",
#   "ip": "127.0.0.1"
# }
```

---

### Test 3: Error Tracking (5 mins)

**Trigger Error & Check Sentry**

```bash
# If Sentry is configured, trigger intentional error
curl -X PATCH http://localhost:4000/api/shipments/invalid-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"status":"INVALID"}'

# Check Sentry: https://sentry.io/select_organization/infamous-freight/
# Expected: Error appears in Sentry dashboard with full context
```

---

### Test 4: Load Test (10 mins)

**Simple load test to measure performance improvement**

```bash
# Use Apache Bench or similar
# Expected: < 500ms p95 latency

ab -n 100 -c 10 -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:4000/api/shipments
```

Expected output highlights:
```
Requests per second:    20+ (was ~12 before optimization)
Time per request:       ~50ms mean (was ~80ms)
Failed requests:        0
```

---

## 🎯 Validation Results

### Create Results Report

**Copy this template and fill in actual measurements:**

```markdown
## Staging Deployment Results
**Date**: [TODAY]
**Duration**: [START TIME] - [END TIME]

### Quality Gates
- [ ] Build: ✅ PASSING
- [ ] TypeScript: ✅ PASSING
- [ ] Linting: ✅ PASSING
- [ ] Services Running: ✅ API + Web

### Endpoint Tests
- [ ] GET /api/shipments: ✅ 200 OK
- [ ] GET /api/shipments/:id: ✅ 200 OK
- [ ] POST /api/shipments: ✅ 201 Created
- [ ] PATCH /api/shipments/:id: ✅ 200 OK
- [ ] GET /api/drivers: ✅ 200 OK
- [ ] GET /api/health: ✅ 200 OK (database connected)

### Feature Tests
- [ ] Shipment Validator: ✅ Valid transition works
- [ ] Shipment Validator: ✅ Invalid transition blocked
- [ ] Error Boundary: ✅ Shows fallback UI
- [ ] Correlation IDs: ✅ Generated on all requests
- [ ] Request Logging: ✅ Captured with metadata

### Performance (Actual Measurements)
- [ ] List latency (100 records): [X]ms (target: <500ms)
- [ ] Database queries per request: [X] (target: 1)
- [ ] Response time variance: [X]% (target: <10%)
- [ ] Error boundary catches: [X] (target: successful)

### Sentry Integration
- [ ] Error events received: ✅ YES / ⚠️ Check config
- [ ] Error context captured: ✅ YES / ⚠️ Check Sentry
- [ ] Correlation IDs tracked: ✅ YES / ⚠️ Check events

### Issues Found
- [ ] No blocking issues
- [ ] [ ] Minor issue: [DESCRIBE]
- [ ] [ ] Information: [DESCRIBE]

### Recommendation
- [ ] ✅ APPROVE for production deployment
- [ ] ⚠️ FIX these issues first
- [ ] ❌ HOLD - major issues found

**Signed By**: [NAME]
**Date**: [DATE]
```

---

## 🔍 Troubleshooting

### Services Won't Start
```bash
# Check port conflicts
lsof -i :3000
lsof -i :3001

# Kill if needed
kill -9 <PID>

# Check logs
docker-compose logs -f api
docker-compose logs -f web
```

### Database Connection Failed
```bash
# Verify PostgreSQL is running
psql -U postgres -h localhost -c "SELECT 1"

# Check connection string in .env
echo $DATABASE_URL
```

### JWT Token Invalid
```bash
# Generate test JWT
# Set JWT_SECRET env variable
export JWT_SECRET="test-secret"

# All queries should use valid Bearer token
# See QUICK_REFERENCE.md for JWT generation
```

### Correlation IDs Not Appearing
```bash
# Check middleware setup
grep -r "correlationId" apps/api/src/middleware/

# Verify logging is enabled
grep "LOG_LEVEL" .env
# Set to: debug or info
```

---

## 📝 Sign-Off & Next Steps

### If All Tests Pass ✅
1. **Document Results** - Fill in results report above
2. **Schedule Production** - Set date for production deployment
3. **Notify Team** - Send deployment announcement
4. **Monitor Staging** - Keep 24-hour watch for issues

### If Issues Found ⚠️
1. **Investigate** - Use troubleshooting guide
2. **Fix** - Create fix branch, apply changes
3. **Re-test** - Run smoke tests again
4. **Document** - Note issue & solution

### Production Deployment Ready ✅
- [ ] All smoke tests passing
- [ ] Performance meets targets
- [ ] Error tracking working
- [ ] Team trained
- [ ] Monitoring configured
- [ ] Rollback procedures ready

**Next**: See [PHASE-5-DEPLOYMENT-GUIDE.md](PHASE-5-DEPLOYMENT-GUIDE.md#step-4-production-deployment-30-mins) for production procedures

---

**Staging Deployment Checklist Ready**  
**Let's validate and ship! 🚀**
