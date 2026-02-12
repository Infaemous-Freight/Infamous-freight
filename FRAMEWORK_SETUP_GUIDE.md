# Framework Setup & Onboarding Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd /workspaces/Infamous-freight-enterprises
pnpm install
```

### 2. Build Shared Package

```bash
pnpm --filter @infamous-freight/shared build
```

### 3. Set Environment

```bash
cp .env.example .env.local
# Edit with your values (JWT_SECRET, DATABASE_URL, OPENAI_API_KEY, etc.)
```

### 4. Start Development

```bash
pnpm dev
# Runs: API (3001) + Web (3000) + Workers
```

### 5. Test Framework

```bash
# List available drivers
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/dispatch/drivers

# Create assignment (triggers dispatch agent)
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/dispatch/assignments \
  -d '{"shipmentId":"ship-1","driverId":"driver-1"}'
```

---

## File Structure

### New Framework Files

```
Infamous-freight-enterprises/
├── packages/shared/src/
│   └── rbac.ts                    ← Role-based access control types
├── apps/api/src/
│   ├── middleware/
│   │   ├── rbac.js                ← RBAC middleware guards
│   │   └── authRBAC.js            ← Enhanced JWT + RBAC auth
│   ├── routes/
│   │   └── dispatch.js            ← Driver + assignment endpoints
│   └── queue/
│       └── agents.js              ← BullMQ workers (dispatch, invoice, ETA, analytics)
├── apps/web/vercel.json                ← Vercel deployment config
├── fly.toml                        ← Fly.io API deployment config
├── apps/api/Dockerfile                 ← Updated with Node 20, OpenSSL
├── .github/workflows/deploy.yml   ← CI/CD pipeline
└── FRAMEWORK_INTEGRATION_GUIDE.md  ← This guide
```

---

## Component-by-Component Setup

### Component 1: RBAC System

**Location**: `packages/shared/src/rbac.ts` + `apps/api/src/middleware/rbac.js` + `apps/api/src/middleware/authRBAC.js`

**Register middleware in `apps/api/src/app.js`:**

```javascript
const { authenticateWithRBAC } = require("./middleware/authRBAC");
const { requirePermission, requireRole } = require("./middleware/rbac");

// Add to middleware stack (after body parser, before routes)
app.use(authenticateWithRBAC);

// Example: Protect dispatch routes with permission check
app.use("/api/dispatch", requirePermission("dispatch:manage"));
```

**Grant permissions in JWT creation:**

```javascript
const { createToken } = require("./middleware/authRBAC");
const { UserRole } = require("@infamous-freight/shared");

// Create dispatch user token
const dispatchToken = createToken(
  userId,
  email,
  UserRole.DISPATCH, // Automatically gets: shipment:read, dispatch:*
);
```

**Test permission enforcement:**

```bash
# With valid permission (dispatch role)
curl -H "Authorization: Bearer $DISPATCH_TOKEN" \
  http://localhost:3001/api/dispatch/drivers
# ✅ 200 OK

# With invalid permission (viewer role)
curl -H "Authorization: Bearer $VIEWER_TOKEN" \
  http://localhost:3001/api/dispatch/drivers
# ❌ 403 Forbidden
```

---

### Component 2: Dispatch Module

**Location**: `apps/api/src/routes/dispatch.js`

**Register route in `apps/api/src/app.js`:**

```javascript
const dispatchRoutes = require("./routes/dispatch");
app.use("/api", dispatchRoutes);
```

**Available endpoints:**

```javascript
// List drivers
GET /api/dispatch/drivers
Response: { drivers: [...], count: 42 }

// Get driver details
GET /api/dispatch/drivers/:id
Response: { driver: {...}, assignments: [...], metrics: {...} }

// Create driver
POST /api/dispatch/drivers
Body: { name, phone, email, licenseNumber, vehicleId }
Response: { driverId: "drv-123" }

// Update driver
PATCH /api/dispatch/drivers/:id
Body: { name, phone, status }
Response: { driver: {...} }

// List assignments with filters
GET /api/dispatch/assignments?status=pending&driverId=drv-1
Response: { assignments: [...], count: 12 }

// Create assignment (triggers agent)
POST /api/dispatch/assignments
Body: { shipmentId, driverId }
Response: { assignmentId: "asg-456" }

// Update assignment (location tracking)
PATCH /api/dispatch/assignments/:id
Body: { status, latitude, longitude, eta }
Response: { assignment: {...} }

// Cancel assignment with reason
POST /api/dispatch/assignments/:id/cancel
Body: { reason }
Response: { success: true }

// Trigger optimization agent
POST /api/dispatch/optimize
Body: { shipmentIds: [...], algorithm: "NEAREST" }
Response: { jobId: "job-789", suggestions: [...] }
```

**Test dispatch workflow:**

```bash
# 1. Create driver
DRIVER=$(curl -s -X POST http://localhost:3001/api/dispatch/drivers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","phone":"+1234567890","licenseNumber":"ABC123"}' \
  | jq -r '.driverId')

# 2. Create assignment
ASSIGNMENT=$(curl -s -X POST http://localhost:3001/api/dispatch/assignments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shipmentId\":\"ship-1\",\"driverId\":\"$DRIVER\"}" \
  | jq -r '.assignmentId')

# 3. Update assignment with location
curl -X PATCH http://localhost:3001/api/dispatch/assignments/$ASSIGNMENT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_transit","latitude":40.7128,"longitude":-74.0060}'
```

---

### Component 3: Agent Queueing

**Location**: `apps/api/src/queue/agents.js`

**Register workers in `apps/api/src/worker/index.js`:**

```javascript
const {
  dispatchWorker,
  invoiceAuditWorker,
  etaPredictionWorker,
  analyticsWorker,
} = require("../queue/agents");

// Workers are automatically started when module is imported
console.log("✅ All agent workers started");
```

**Monitor agent jobs:**

```bash
# View queue dashboard
open http://localhost:3001/admin/queues

# Manually trigger dispatch agent
curl -X POST http://localhost:3001/api/dispatch/optimize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipmentIds":["ship-1","ship-2"],
    "algorithm":"LOAD_BALANCE"
  }'

# Check database for agent runs
sqlite3 api.db "SELECT * FROM agent_runs LIMIT 10;"
```

**Agent types and capabilities:**

| Agent              | Purpose                              | Input                       | Output                |
| ------------------ | ------------------------------------ | --------------------------- | --------------------- |
| **dispatch**       | Optimize shipment-driver assignments | shipmentIds, algorithm      | assignmentSuggestions |
| **invoice-audit**  | Detect billing discrepancies         | invoiceId, shipmentIds      | discrepancies         |
| **eta-prediction** | Predict delivery times               | shipmentId, currentLocation | eta                   |
| **analytics**      | Compute performance metrics          | dateRange                   | metrics               |

---

### Component 4: Deployment

**Location**: `fly.toml` + `apps/web/vercel.json` + `.github/workflows/deploy.yml` + `apps/api/Dockerfile`

**Prerequisites:**

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Create Fly app (choose your app name)
flyctl apps create infamous-freight-api

# Set up GitHub secrets (repo Settings → Secrets)
# - VERCEL_TOKEN
# - VERCEL_ORG_ID
# - VERCEL_PROJECT_ID_WEB
# - FLY_API_TOKEN
# - DATABASE_URL
# - JWT_SECRET
# - OPENAI_API_KEY
```

**Deploy to staging:**

```bash
git checkout -b staging
git push origin staging
# GitHub Actions deploys to staging environment
```

**Deploy to production:**

```bash
git push origin main
# GitHub Actions automatically deploys to both Vercel + Fly.io
```

**Verify deployment:**

```bash
# Check API health
curl https://infamous-freight-api.fly.dev/api/health

# Check Web app
open https://infamous-freight-enterprises.vercel.app

# Check dispatch endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://infamous-freight-api.fly.dev/api/dispatch/drivers
```

---

## Integration Checklist

### Before First Deployment

- [ ] RBAC types exported from shared package
- [ ] Middleware registered in Express app
- [ ] Dispatch routes registered
- [ ] Agent workers started in worker process
- [ ] Environment variables configured
- [ ] Database migrations run: `pnpm api prisma:migrate:deploy`
- [ ] Tests pass: `pnpm test`

### GitHub Secrets Required

```bash
# Vercel
VERCEL_TOKEN=<token>
VERCEL_ORG_ID=<org-id>
VERCEL_PROJECT_ID_WEB=<project-id>

# Fly.io
FLY_API_TOKEN=<token>
FLY_APP_NAME=infamous-freight-api

# Application
DATABASE_URL=postgresql://...
JWT_SECRET=<random-secret-min-32-chars>
OPENAI_API_KEY=<key>

# Testing
TEST_JWT_TOKEN=<test-token>
```

### Post-Deployment Verification

- [ ] API health check passes
- [ ] Dispatch endpoints respond correctly
- [ ] Agent jobs process successfully
- [ ] Database migrations applied
- [ ] Monitoring/Sentry configured
- [ ] Error tracking working
- [ ] Rate limiting active

---

## Development Workflow

### Adding New Dispatch Endpoint

**1. Define route in `apps/api/src/routes/dispatch.js`:**

```javascript
router.get(
  "/shipments/:id/history",
  authenticateWithRBAC,
  requirePermission("shipment:read"),
  auditAction("shipment.history.view"),
  async (req, res, next) => {
    try {
      const history = await prisma.assignment.findMany({
        where: { shipmentId: req.params.id },
        orderBy: { updatedAt: "desc" },
      });
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  },
);
```

**2. Test with curl:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/dispatch/shipments/ship-1/history
```

**3. Add integration test:**

```javascript
// apps/api/src/routes/__tests__/dispatch.test.js
describe("GET /api/dispatch/shipments/:id/history", () => {
  it("returns assignment history", async () => {
    const res = await request(app)
      .get("/api/dispatch/shipments/ship-1/history")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeArray();
  });
});
```

### Adding New Agent Worker

**1. Define worker in `apps/api/src/queue/agents.js`:**

```javascript
const myAgentQueue = new Queue("my-agent", { connection: redis });
const myAgentWorker = new Worker(
  "my-agent",
  async (job) => {
    const { data } = job;

    // Agent logic here
    const result = await performAnalysis(data);

    // Persist to database
    const run = await prisma.agentRun.create({
      data: {
        agentType: "my-agent",
        input: data,
        output: result,
        status: "completed",
      },
    });

    return run;
  },
  { connection: redis, concurrency: 2 },
);
```

**2. Trigger from endpoint:**

```javascript
// In dispatch.js or other route
await myAgentQueue.add('analyze', { shipmentIds: [...] });
```

**3. Monitor in Bullboard:**

```
http://localhost:3001/admin/queues/my-agent
```

---

## Troubleshooting

### "Missing permission" errors

**Check JWT token:**

```bash
node -e "console.log(JSON.stringify(require('jsonwebtoken').decode('YOUR_TOKEN'), null, 2))"
# Verify 'permissions' array includes required permission
```

**Verify role has permission:**

```javascript
// In apps/api/src/middleware/rbac.js
const { ROLE_PERMISSIONS, UserRole } = require("@infamous-freight/shared");
console.log(ROLE_PERMISSIONS[UserRole.DISPATCH]);
// Should include 'dispatch:manage' or similar
```

### Dispatch agent not processing

**Check queue:**

```bash
# Access Bullboard
open http://localhost:3001/admin/queues/dispatch

# Or query database
sqlite3 api.db "SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT 5;"
```

**Restart workers:**

```bash
pnpm api:dev
# Terminal should show worker startup logs
```

### Database migration fails

**Check migration status:**

```bash
cd apps/api
pnpm prisma:migrate:status
```

**Reset database (development only):**

```bash
pnpm prisma:migrate:reset
# Drops database, reruns all migrations, seeds
```

---

## Performance Tips

### Rate Limiting by Role

Already configured in `apps/api/src/middleware/security.js`:

- **Viewer**: 5 requests/15min (strict)
- **Driver**: 20 requests/1min (moderate)
- **Dispatch**: 50 requests/1min (lenient)
- **Admin**: 100 requests/15min (open)

Adjust by editing `limiters` object in security middleware.

### Database Query Optimization

Always use `include` for relationships:

```javascript
// ❌ Bad: N+1 queries
const drivers = await prisma.driver.findMany();
for (driver of drivers) {
  driver.assignments = await prisma.assignment.findMany({
    where: { driverId: driver.id },
  });
}

// ✅ Good: Single query
const drivers = await prisma.driver.findMany({
  include: { assignments: true },
});
```

### Async Job Processing

Defer heavy operations to agents:

```javascript
// ❌ Bad: Blocks request
app.post("/api/dispatch/optimize", async (req, res) => {
  const suggestions = await expensiveOptimization(req.body.shipmentIds);
  res.json(suggestions); // Takes 30 seconds!
});

// ✅ Good: Returns immediately
app.post("/api/dispatch/optimize", async (req, res) => {
  const job = await dispatchQueue.add("optimize", req.body);
  res.json({ jobId: job.id }); // Returns immediately
  // Agent processes in background
});
```

---

## Security Best Practices

### 1. Always Protect Routes

```javascript
// ✅ Good: Protected
router.get(
  "/api/sensitive",
  authenticateWithRBAC,
  requirePermission("admin:read"),
  handler,
);

// ❌ Bad: Unprotected
router.get("/api/sensitive", handler);
```

### 2. Use Role Hierarchy

```javascript
// ✅ Good: Enforces role hierarchy
app.delete(
  "/api/admin-action",
  authenticateWithRBAC,
  requireMinimumRole(UserRole.ADMIN),
  handler,
);

// Instead of checking permissions individually
```

### 3. Audit All Actions

```javascript
// ✅ Good: All actions logged
router.patch(
  "/api/dispatch/assignments/:id",
  authenticateWithRBAC,
  requirePermission("dispatch:manage"),
  auditAction("assignment.update"), // Logs who, what, when
  handler,
);
```

### 4. Validate Input

```javascript
// ✅ Good: Validates before processing
router.post(
  "/api/dispatch/drivers",
  authenticateWithRBAC,
  [validateString("name"), validatePhone("phone"), handleValidationErrors],
  handler,
);
```

---

## Next Steps

1. **Complete Onboarding**
   - [ ] Read FRAMEWORK_INTEGRATION_GUIDE.md
   - [ ] Run `pnpm dev` and test endpoints
   - [ ] Create test JWT tokens
   - [ ] Verify RBAC enforcement

2. **Deploy Staging**
   - [ ] Push to `staging` branch
   - [ ] Verify GitHub Actions passes
   - [ ] Test on staging environment

3. **Deploy Production**
   - [ ] Push to `main` branch
   - [ ] Monitor Sentry for errors
   - [ ] Verify monitoring dashboards

4. **Optimize & Scale**
   - [ ] Monitor agent performance
   - [ ] Adjust worker concurrency as needed
   - [ ] Enable caching for frequent queries
   - [ ] Set up alerts for SLA violations

---

## Support Resources

- **Framework Guide**: [FRAMEWORK_INTEGRATION_GUIDE.md](FRAMEWORK_INTEGRATION_GUIDE.md)
- **Copilot Instructions**: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **API Docs**: [Postman collection](./apps/api/docs/postman.json) (generated)
- **Architecture**: [architecture.md](./ARCHITECTURE.md)

---

**Status**: ✅ Production-ready  
**Last Updated**: January 23, 2026  
**Version**: 1.0.0
