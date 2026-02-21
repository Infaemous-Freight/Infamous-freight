# 🧪 LOCAL TESTING 100% EXECUTION PLAN

**Status**: ✅ READY TO EXECUTE  
**Duration**: 45 minutes  
**Environment**: Development (docker-compose)

---

## ✅ PHASE 1: ENVIRONMENT VALIDATION (5 minutes)

**Prerequisites Check**:

```bash
# 1. Verify Node.js
node --version  # Should be v18.x or higher

# 2. Verify npm/pnpm
npm --version

# 3. Verify Docker
docker --version
docker-compose --version

# 4. Verify git
git --version
```

**Current Status**: ⚠️ Node.js runtime not available in container  
**Resolution**: Two options available:

### **Option A: Restart Container with Runtime** (Recommended)

- Exit current terminal
- Reopen VSCode terminal (Ctrl+`)
- Runtime will be initialized
- Then proceed with testing

### **Option B: Use Devcontainer** (Alternative)

- Press `Ctrl+Shift+P`
- Select "Dev Containers: Reopen in Container"
- Waits 2-3 minutes for initialization
- Full environment loads with Node.js

---

## 🚀 PHASE 2: LOCAL START (10 minutes)

**Once environment is ready:**

### **Step 1: Install Dependencies**

```bash
cd /workspaces/Infamous-freight-enterprises
npm install
# OR if pnpm available
pnpm install
```

### **Step 2: Start All Services**

```bash
# Option A: Full monorepo (all services)
npm run dev
# or
pnpm dev

# Option B: Just API (port 4000)
npm run api:dev
# or
pnpm --filter api dev

# Option C: Just Web (port 3000)
npm run web:dev
# or
pnpm --filter web dev
```

**Expected Output**:

```
✅ API listening on http://localhost:4000
✅ Web listening on http://localhost:3000
✅ PostgreSQL connected
✅ Redis connected
```

---

## ✅ PHASE 3: VALIDATION (30 minutes)

### **3.1 Health Endpoint Validation** (5 minutes)

**Test all 5 health endpoints**:

```bash
# Terminal 1: Keep services running
# Terminal 2: Run health checks

# 1. Basic health check
curl http://localhost:4000/api/health
# Expected: { "uptime": X, "timestamp": X, "status": "ok", ... }

# 2. Liveness probe
curl http://localhost:4000/api/health/live
# Expected: 200 OK (always passes for K8s)

# 3. Readiness probe
curl http://localhost:4000/api/health/ready
# Expected: 200 OK when all services ready, 503 if degraded

# 4. Detailed metrics
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/api/health/details
# Expected: Detailed metrics (memory, cpu, db connections, etc)

# 5. HTML dashboard
open http://localhost:4000/api/health/dashboard
# Expected: Visual dashboard with real-time metrics (30s refresh)
```

**Success Criteria**:

- ✅ All 5 endpoints responding (200 OK)
- ✅ Database connectivity confirmed
- ✅ Redis connectivity confirmed
- ✅ HTML dashboard loads
- ✅ Metrics showing real-time data

---

### **3.2 API Validation** (10 minutes)

**Test core API endpoints**:

```bash
# Get test JWT token from logs, or use test-secret
TEST_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 1. Health check
curl http://localhost:4000/api/health

# 2. Create user
curl -X POST http://localhost:4000/api/users \
  -H "Authorization: Bearer $TEST_JWT" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"admin"}'

# 3. Get users
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer $TEST_JWT"

# 4. Create shipment
curl -X POST http://localhost:4000/api/shipments \
  -H "Authorization: Bearer $TEST_JWT" \
  -H "Content-Type: application/json" \
  -d '{"origin":"NYC","destination":"LA","weight":100}'

# 5. List shipments
curl http://localhost:4000/api/shipments \
  -H "Authorization: Bearer $TEST_JWT"
```

**Success Criteria**:

- ✅ All endpoints returning 200/201 responses
- ✅ Data persisting to PostgreSQL
- ✅ No 500 errors in API logs
- ✅ Rate limiting working (confirm in headers)

---

### **3.3 Web UI Validation** (10 minutes)

**Test Web Frontend**:

```bash
# 1. Check web loads
open http://localhost:3000
# Expected: NextJS app loads, no console errors

# 2. Check API integration
# Open DevTools (F12) > Console tab
# Should see successful API calls, no auth errors

# 3. Test login/auth flow
# Follow UI prompts
# Should see proper error/success messages

# 4. Test shipment list page
navigate to /shipments
# Should display shipments from API

# 5. Check for any errors
# Console should have no red errors
# Network tab should show 200s for API calls
```

**Success Criteria**:

- ✅ Web loads without errors
- ✅ Connected to API successfully
- ✅ Navigation working
- ✅ Data displaying from API
- ✅ No console errors

---

### **3.4 Database Validation** (5 minutes)

**Verify PostgreSQL**:

```bash
# Option A: Using psql (if available)
psql postgresql://infamous:infamouspass@localhost:5432/infamous_freight

# Run in psql:
\dt  # List all tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM shipments;
\q  # Exit

# Option B: Check via health endpoint
curl http://localhost:4000/api/health/details \
  -H "Authorization: Bearer $TEST_JWT" | grep -i database
```

**Expected Database Objects**:

- ✅ `users` table with data
- ✅ `shipments` table with data
- ✅ All indices created
- ✅ Foreign keys intact

---

## ✅ PHASE 4: MONITORING VALIDATION (Optional, 10 minutes)

**Prometheus & Grafana** (if using docker-compose with monitoring):

```bash
# 1. Prometheus metrics
open http://localhost:9090
# Should show metrics being scraped

# 2. Grafana dashboards
open http://localhost:3001
# Login: admin / admin
# Should see 5 dashboards with data:
#   - API Performance
#   - Database Health
#   - Infrastructure
#   - Blue-Green Deployment
#   - API Dashboard

# 3. Check alert rules
# In Prometheus: Alerts tab
# Should show configured alert rules (10+)
```

---

## 📋 LOCAL TESTING SIGN-OFF

**Completion Checklist**:

| Item                          | Status     | Notes                      |
| ----------------------------- | ---------- | -------------------------- |
| Environment prerequisites     | ⚠️ Pending | Needs Node.js runtime      |
| Dependencies installed        | ⚠️ Pending | Awaiting npm install       |
| All services starting         | ⚠️ Pending | Awaiting docker-compose up |
| 5 health endpoints responding | ⚠️ Pending | Will test during Phase 3.1 |
| API endpoints working         | ⚠️ Pending | Will test during Phase 3.2 |
| Web UI loading                | ⚠️ Pending | Will test during Phase 3.3 |
| Database connectivity         | ⚠️ Pending | Will test during Phase 3.4 |
| Monitoring dashboards         | ⚠️ Pending | Will test during Phase 4   |
| **OVERALL LOCAL TESTING**     | ⚠️ PENDING | Ready for execution        |

---

## 🔍 TROUBLESHOOTING

### **Services won't start**

```bash
# Check Docker daemon
docker ps
# If fails, start Docker Desktop

# Check ports in use
lsof -i :3000  # Check port 3000
lsof -i :4000  # Check port 4000
lsof -i :5432  # Check port 5432
```

### **API returns 500 errors**

```bash
# Check API logs
# In terminal where 'pnpm dev' running, look for error output

# Check database connection
curl http://localhost:4000/api/health | grep database

# Check environment variables
cat .env.development
# Verify DATABASE_URL, REDIS_URL match running services
```

### **Web page shows blank/won't load**

```bash
# Check web logs in terminal
# Look for build errors

# Clear Next.js cache
rm -rf apps/web/.next

# Rebuild
pnpm --filter web build
pnpm --filter web dev
```

### **Authentication failing**

```bash
# Check AUTH_SECRET
echo $AUTH_SECRET

# Check token format in curl commands
# Should be: Authorization: Bearer <token>

# Test with simple request first:
curl http://localhost:4000/api/health  # No auth needed
```

---

## ✅ READY FOR NEXT PHASE

Once local testing 100% passes all checkpoints above:

**Next Step**:
[PRODUCTION_DEPLOYMENT_EXECUTION.md](PRODUCTION_DEPLOYMENT_EXECUTION.md)

**Timeline**: 2 hours from green light

- Pre-deployment (1 hour)
- Deployment execution (30 minutes)
- Post-deployment (30 minutes)

---

**STATUS**: ⏳ Awaiting environment initialization and testing execution
