# 🧪 Test Writing Plan - 85% → 100% Green

**Current Status**: 🟡 YELLOW (85%)  
**Target Status**: 🟢 GREEN (100%)  
**Gap to Close**: +15% coverage  
**Estimated Time**: 20-25 hours  
**Priority**: HIGH (after security fixes)

---

## 📊 Current Test Coverage Analysis

### Existing Coverage (86.2% overall)

```
Coverage Summary (apps/api):
----------------------------
Branches:    86.2%  (237/275)
Functions:   80.49% (164/204)
Lines:       84.33% (471/559)
Statements:  84.48% (471/558)

Test Suites: 44 passed, 44 total
Tests:       197 passed, 197 total
```

### Gap Analysis

To reach 100% GREEN (90%+ coverage):

- **Branches**: 86.2% → 90%+ = +38 branches to test
- **Functions**: 80.49% → 90%+ = +40 functions to test
- **Lines**: 84.33% → 90%+ = +88 lines to test
- **Statements**: 84.48% → 90%+ = +87 statements to test

**Total Missing Tests**: ~60-80 additional test cases needed

---

## 🎯 8 Priority Test Suites to Write

Based on [TEST_COVERAGE_100_STRATEGY.md](TEST_COVERAGE_100_STRATEGY.md), here
are the priority test suites with **exact implementation plans**:

---

### 1. Enhanced Error Handler Tests (+10% coverage)

**File**: `apps/api/src/__tests__/middleware/errorHandler.enhanced.test.js`  
**Target Coverage**: +10% overall  
**Priority**: 🔴 CRITICAL  
**Time**: 3-4 hours

#### Test Cases to Implement

```javascript
// apps/api/src/__tests__/middleware/errorHandler.enhanced.test.js
const request = require("supertest");
const app = require("../../app");
const Sentry = require("@sentry/node");

describe("Error Handler - Enhanced Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Sentry integration on 500 errors
  test("should send 500 errors to Sentry with context", async () => {
    const sentrySpy = jest.spyOn(Sentry, "captureException");

    // Trigger a 500 error
    await request(app)
      .post("/api/trigger-500-error") // Create test route
      .expect(500);

    expect(sentrySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
      }),
      expect.objectContaining({
        tags: expect.objectContaining({
          path: expect.any(String),
          method: expect.any(String),
        }),
      }),
    );
  });

  // Test 2: User context attached to Sentry errors
  test("should attach user context to authenticated errors", async () => {
    const sentrySpy = jest.spyOn(Sentry, "captureException");
    const token = generateTestJWT({
      sub: "user-123",
      email: "test@example.com",
    });

    // Trigger error with auth
    await request(app)
      .post("/api/protected-error-route")
      .set("Authorization", `Bearer ${token}`)
      .expect(500);

    expect(sentrySpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        user: expect.objectContaining({
          id: "user-123",
          email: "test@example.com",
        }),
      }),
    );
  });

  // Test 3: Rate limit errors (429)
  test("should handle rate limit errors correctly", async () => {
    // Trigger rate limit
    const promises = Array(25)
      .fill()
      .map(() =>
        request(app)
          .post("/api/ai/command")
          .set("Authorization", `Bearer ${token}`),
      );

    const responses = await Promise.all(promises);
    const rateLimitedResponse = responses.find((r) => r.status === 429);

    expect(rateLimitedResponse).toBeDefined();
    expect(rateLimitedResponse.body.error).toMatch(/rate limit/i);
  });

  // Test 4: Validation errors (400)
  test("should return 400 for validation errors", async () => {
    const response = await request(app)
      .post("/api/shipments")
      .send({ destination: "Invalid" }) // Missing required fields
      .expect(400);

    expect(response.body.errors).toBeInstanceOf(Array);
    expect(response.body.errors[0]).toHaveProperty("msg");
  });

  // Test 5: Authentication errors (401)
  test("should return 401 for missing JWT", async () => {
    const response = await request(app).get("/api/shipments").expect(401);

    expect(response.body.error).toMatch(/token/i);
  });

  // Test 6: Authorization errors (403)
  test("should return 403 for insufficient scope", async () => {
    const tokenWithoutScope = generateTestJWT({ scopes: [] });

    const response = await request(app)
      .post("/api/ai/command")
      .set("Authorization", `Bearer ${tokenWithoutScope}`)
      .expect(403);

    expect(response.body.error).toMatch(/insufficient scope/i);
  });

  // Test 7: Not found errors (404)
  test("should return 404 for non-existent resources", async () => {
    const response = await request(app).get("/api/shipments/99999").expect(404);

    expect(response.body.error).toMatch(/not found/i);
  });

  // Test 8: Database errors (503)
  test("should return 503 for database connection errors", async () => {
    // Mock Prisma to throw connection error
    jest
      .spyOn(prisma.shipment, "findUnique")
      .mockRejectedValue(new Error("Database unavailable"));

    const response = await request(app).get("/api/shipments/1").expect(503);

    expect(response.body.error).toMatch(/service unavailable/i);
  });

  // Test 9: Unhandled promise rejections
  test("should handle unhandled promise rejections", async () => {
    const sentrySpy = jest.spyOn(Sentry, "captureException");

    // Trigger unhandled rejection
    process.emit(
      "unhandledRejection",
      new Error("Unhandled promise rejection"),
      Promise.reject(),
    );

    expect(sentrySpy).toHaveBeenCalled();
  });

  // Test 10: Error stack traces in development
  test("should include stack trace in development mode", async () => {
    process.env.NODE_ENV = "development";

    const response = await request(app).post("/api/trigger-error").expect(500);

    expect(response.body).toHaveProperty("stack");
    expect(response.body.stack).toContain("Error:");

    process.env.NODE_ENV = "test";
  });
});
```

**Coverage Impact**: +10% overall (tests error paths across all routes)

---

### 2. Logger Performance Tests (+8% coverage)

**File**: `apps/api/src/__tests__/middleware/logger.performance.test.js`  
**Priority**: 🟡 HIGH  
**Time**: 2-3 hours

```javascript
// apps/api/src/__tests__/middleware/logger.performance.test.js
const logger = require("../../middleware/logger");

describe("Logger - Performance Tests", () => {
  // Test 1: Performance levels
  test("should set performance level based on response time", () => {
    const mockReq = {
      method: "GET",
      path: "/api/health",
      startTime: Date.now() - 50,
    };
    const mockRes = { statusCode: 200 };
    const mockNext = jest.fn();

    // Fast response (<100ms)
    logger(mockReq, mockRes, mockNext);
    expect(mockReq.performanceLevel).toBe("excellent");

    // Moderate performance (100-500ms)
    mockReq.startTime = Date.now() - 300;
    logger(mockReq, mockRes, mockNext);
    expect(mockReq.performanceLevel).toBe("good");

    // Slow response (>500ms)
    mockReq.startTime = Date.now() - 600;
    logger(mockReq, mockRes, mockNext);
    expect(mockReq.performanceLevel).toBe("needs_optimization");
  });

  // Test 2: Correlation ID generation
  test("should generate unique correlation IDs", () => {
    const req1 = { method: "GET", path: "/api/test" };
    const req2 = { method: "POST", path: "/api/test" };

    logger(req1, {}, jest.fn());
    logger(req2, {}, jest.fn());

    expect(req1.correlationId).toBeDefined();
    expect(req2.correlationId).toBeDefined();
    expect(req1.correlationId).not.toBe(req2.correlationId);
  });

  // Test 3: Log levels based on status code
  test("should log errors for 5xx status codes", () => {
    const loggerSpy = jest.spyOn(logger.logger, "error");

    const mockReq = { method: "GET", path: "/api/test", startTime: Date.now() };
    const mockRes = { statusCode: 500 };

    logger(mockReq, mockRes, jest.fn());

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: expect.stringContaining("error"),
      }),
    );
  });

  // Test 4: Body sanitization (remove sensitive data)
  test("should sanitize sensitive data from logs", () => {
    const mockReq = {
      method: "POST",
      path: "/api/auth/login",
      body: {
        email: "test@example.com",
        password: "secret123",
        creditCard: "4111111111111111",
      },
    };

    const loggerSpy = jest.spyOn(logger.logger, "info");
    logger(mockReq, { statusCode: 200 }, jest.fn());

    const loggedData = loggerSpy.mock.calls[0][0];
    expect(loggedData.body).not.toContain("secret123");
    expect(loggedData.body).not.toContain("4111111111111111");
    expect(loggedData.body.password).toBe("[REDACTED]");
  });

  // Test 5-10: Add more performance tracking tests
});
```

---

### 3. Rate Limiter Configuration Tests (+7% coverage)

**File**: `apps/api/src/__tests__/middleware/rateLimiting.config.test.js`  
**Priority**: 🟡 HIGH  
**Time**: 2 hours

```javascript
// Test all 5 rate limiter tiers
describe("Rate Limiting Configuration", () => {
  test("general limiter: 100 requests per 15 minutes", async () => {
    // Make 100 requests
    // Verify 101st request returns 429
  });

  test("auth limiter: 5 requests per 15 minutes", async () => {
    // Test stricter auth limits
  });

  test("ai limiter: 20 requests per 1 minute", async () => {
    // Test AI endpoint limits
  });

  test("billing limiter: 30 requests per 15 minutes", async () => {
    // Test billing endpoint limits
  });

  test("voice limiter: 10 requests per 5 minutes", async () => {
    // Test voice upload limits
  });

  test("rate limiters use redis store in production", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    // Verify Redis store is used
  });

  test("rate limiters fall back to memory store", () => {
    delete process.env.REDIS_URL;
    // Verify memory store is used
  });
});
```

---

### 4. Feature Flags Tests (+12% coverage)

**File**: `apps/api/src/__tests__/services/featureFlags.test.js`  
**Priority**: 🔴 CRITICAL  
**Time**: 4-5 hours

```javascript
describe("Feature Flags Service", () => {
  // Test all 7 feature flags
  test("AI_ENABLED flag controls AI endpoints", async () => {
    process.env.FEATURE_AI_ENABLED = "false";
    const response = await request(app).post("/api/ai/command");
    expect(response.status).toBe(503);
    expect(response.body.error).toMatch(/feature not available/i);
  });

  test("VOICE_PROCESSING flag controls voice endpoints", async () => {
    process.env.FEATURE_VOICE_PROCESSING = "false";
    // Test voice endpoint returns 503
  });

  test("BILLING_ENABLED flag controls billing endpoints", async () => {
    process.env.FEATURE_BILLING_ENABLED = "false";
    // Test billing endpoint returns 503
  });

  test("ANALYTICS_TRACKING flag controls analytics", async () => {
    process.env.FEATURE_ANALYTICS_TRACKING = "false";
    // Verify analytics not sent
  });

  test("PERFORMANCE_MONITORING flag controls monitoring", async () => {
    process.env.FEATURE_PERFORMANCE_MONITORING = "false";
    // Verify performance data not tracked
  });

  test("ERROR_REPORTING flag controls Sentry", async () => {
    process.env.FEATURE_ERROR_REPORTING = "false";
    // Verify Sentry not called on error
  });

  test("AB_TESTING flag controls A/B test variants", async () => {
    process.env.FEATURE_AB_TESTING = "true";
    // Test A/B variants served correctly
  });

  // Test flag hierarchies
  test("flags can be enabled per user/tenant", () => {
    // Test user-specific flag overrides
  });

  test("flags can be percentage rollouts", () => {
    // Test 50% rollout serves flag to ~50% of users
  });
});
```

---

### 5. Health Check Tests (+5% coverage)

**File**: `apps/api/src/__tests__/routes/health.extended.test.js`  
**Priority**: 🟢 MEDIUM  
**Time**: 1-2 hours

```javascript
describe("Health Checks - Extended", () => {
  test("GET /api/health/liveness returns 200", async () => {
    const response = await request(app).get("/api/health/liveness");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  test("GET /api/health/readiness checks database", async () => {
    const response = await request(app).get("/api/health/readiness");
    expect(response.status).toBe(200);
    expect(response.body.database).toBe("connected");
  });

  test("GET /api/health/startup checks all dependencies", async () => {
    const response = await request(app).get("/api/health/startup");
    expect(response.body).toHaveProperty("database");
    expect(response.body).toHaveProperty("redis");
    expect(response.body).toHaveProperty("externalApis");
  });

  test("health check fails when database is down", async () => {
    jest.spyOn(prisma, "$queryRaw").mockRejectedValue(new Error("DB down"));

    const response = await request(app).get("/api/health/readiness");
    expect(response.status).toBe(503);
    expect(response.body.database).toBe("disconnected");
  });

  test("health check includes uptime and timestamp", async () => {
    const response = await request(app).get("/api/health");
    expect(response.body.uptime).toBeGreaterThan(0);
    expect(response.body.timestamp).toBeDefined();
  });
});
```

---

### 6. JWT Scope Tests (+6% coverage)

**File**: `apps/api/src/__tests__/middleware/jwtScopes.test.js`  
**Priority**: 🔴 CRITICAL  
**Time**: 2-3 hours

```javascript
describe("JWT Scope Enforcement", () => {
  test("requireScope() allows request with correct scope", async () => {
    const token = generateTestJWT({ scopes: ["ai:command"] });

    const response = await request(app)
      .post("/api/ai/command")
      .set("Authorization", `Bearer ${token}`)
      .send({ command: "test" })
      .expect(200);
  });

  test("requireScope() denies request without scope", async () => {
    const token = generateTestJWT({ scopes: [] });

    const response = await request(app)
      .post("/api/ai/command")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(response.body.error).toMatch(/insufficient scope/i);
  });

  test("audit log tracks scope checks", async () => {
    const auditSpy = jest.spyOn(logger, "info");
    const token = generateTestJWT({ scopes: ["voice:ingest"] });

    await request(app)
      .post("/api/voice/ingest")
      .set("Authorization", `Bearer ${token}`);

    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "scope_check",
        scope: "voice:ingest",
        allowed: true,
      }),
    );
  });

  test("scopes are case-sensitive", async () => {
    const token = generateTestJWT({ scopes: ["AI:COMMAND"] }); // Wrong case

    await request(app)
      .post("/api/ai/command")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  test("multiple scopes can be required", async () => {
    const token = generateTestJWT({
      scopes: ["billing:read", "billing:write"],
    });

    // Should succeed with both scopes
    await request(app)
      .post("/api/billing/subscription")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});
```

---

### 7. Billing Tests (+9% coverage)

**File**: `apps/api/src/__tests__/routes/billing.enhanced.test.js`  
**Priority**: 🔴 CRITICAL  
**Time**: 3-4 hours

```javascript
describe("Billing - Enhanced Tests", () => {
  test("idempotency key prevents duplicate charges", async () => {
    const idempotencyKey = "test-key-123";
    const token = generateTestJWT({ scopes: ["billing:write"] });

    // First request
    const response1 = await request(app)
      .post("/api/billing/charge")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotencyKey)
      .send({ amount: 100 })
      .expect(200);

    // Second request with same key
    const response2 = await request(app)
      .post("/api/billing/charge")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotencyKey)
      .send({ amount: 100 })
      .expect(200);

    // Should return same charge ID
    expect(response1.body.chargeId).toBe(response2.body.chargeId);
  });

  test("Stripe error handling", async () => {
    // Mock Stripe to throw error
    jest
      .spyOn(stripe.charges, "create")
      .mockRejectedValue(new Error("Card declined"));

    const response = await request(app).post("/api/billing/charge").expect(402);

    expect(response.body.error).toMatch(/payment/i);
  });

  test("webhook signature verification", async () => {
    const invalidSignature = "invalid-sig";

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("Stripe-Signature", invalidSignature)
      .send({ type: "charge.succeeded" })
      .expect(400);

    expect(response.body.error).toMatch(/signature/i);
  });

  // Test all billing endpoints
  test("GET /api/billing/subscription returns user subscription", async () => {
    // Test subscription retrieval
  });

  test("POST /api/billing/subscription creates subscription", async () => {
    // Test subscription creation
  });

  test("DELETE /api/billing/subscription cancels subscription", async () => {
    // Test subscription cancellation
  });
});
```

---

### 8. E2E Flow Tests (+8% coverage)

**File**: `apps/api/src/__tests__/e2e/fullFlows.test.js`  
**Priority**: 🟢 MEDIUM  
**Time**: 4-5 hours

```javascript
describe("End-to-End Flows", () => {
  test("complete shipment creation flow", async () => {
    // 1. Authenticate
    const authResponse = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    const token = authResponse.body.token;

    // 2. Create shipment
    const shipmentResponse = await request(app)
      .post("/api/shipments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        origin: "New York",
        destination: "Los Angeles",
        weight: 1000,
      })
      .expect(201);

    const shipmentId = shipmentResponse.body.data.id;

    // 3. Update shipment status
    await request(app)
      .patch(`/api/shipments/${shipmentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "in_transit" })
      .expect(200);

    // 4. Retrieve shipment
    const getResponse = await request(app)
      .get(`/api/shipments/${shipmentId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(getResponse.body.data.status).toBe("in_transit");

    // 5. Delete shipment
    await request(app)
      .delete(`/api/shipments/${shipmentId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);
  });

  test("AI-assisted route optimization flow", async () => {
    // Full AI command flow with feature flags
  });

  test("voice command processing flow", async () => {
    // Full voice upload and processing flow
  });
});
```

---

## 📅 Implementation Timeline

### Week 1 (Days 1-5): Critical Tests

**Day 1-2**: Error Handler Tests (10% coverage)

- 3-4 hours implementation
- Run coverage to verify +10%
- Commit: `test: Add enhanced error handler tests (+10% coverage)`

**Day 3**: JWT Scope Tests (6% coverage)

- 2-3 hours implementation
- Verify scope enforcement works correctly
- Commit: `test: Add JWT scope enforcement tests (+6% coverage)`

**Day 4**: Feature Flags Tests (12% coverage)

- 4-5 hours implementation
- Test all 7 feature flags
- Commit: `test: Add comprehensive feature flag tests (+12% coverage)`

**Day 5**: Billing Tests (9% coverage)

- 3-4 hours implementation
- Test Stripe integration thoroughly
- Commit: `test: Add enhanced billing tests (+9% coverage)`

**Coverage after Week 1**: ~84% → 121% (target achieved! 🎉)

### Week 2 (Days 6-10): Additional Coverage

**Day 6**: Logger Performance Tests (8% coverage)

- 2-3 hours implementation
- Commit: `test: Add logger performance tests (+8% coverage)`

**Day 7**: Rate Limiter Tests (7% coverage)

- 2 hours implementation
- Commit: `test: Add rate limiter configuration tests (+7% coverage)`

**Day 8**: Health Check Tests (5% coverage)

- 1-2 hours implementation
- Commit: `test: Add extended health check tests (+5% coverage)`

**Day 9**: E2E Flow Tests (8% coverage)

- 4-5 hours implementation
- Commit: `test: Add end-to-end flow tests (+8% coverage)`

**Day 10**: Review and Polish

- Fix any failing tests
- Verify all thresholds met
- Update documentation

**Final Coverage**: ~150% of target (aim for 95%+ actual)

---

## 🚀 Running Tests

### Run All Tests

```bash
cd apps/api
pnpm test
```

### Run Specific Test Suite

```bash
pnpm test errorHandler.enhanced.test.js
```

### Run with Coverage

```bash
pnpm test -- --coverage
```

### Run with Coverage Report

```bash
pnpm test -- --coverage --coverageReporters=html
open coverage/index.html
```

### Watch Mode (for active development)

```bash
pnpm test -- --watch
```

---

## ✅ Success Criteria

### Coverage Thresholds Met

```bash
=============================== Coverage summary ===============================
Branches:     ≥90%  (target: 90%)  ✅
Functions:    ≥90%  (target: 90%)  ✅
Lines:        ≥90%  (target: 90%)  ✅
Statements:   ≥90%  (target: 90%)  ✅
================================================================================
```

### All Tests Pass

```bash
Test Suites: 52 passed, 52 total  ✅
Tests:       257 passed, 257 total  ✅
```

### CI/CD Integration

```bash
# GitHub Actions
✅ All tests pass in CI
✅ Coverage report uploaded
✅ No regressions introduced
```

---

## 🎯 Testing Best Practices

### 1. Test Structure (AAA Pattern)

```javascript
test("should do something", () => {
  // Arrange
  const input = "test data";

  // Act
  const result = functionUnderTest(input);

  // Assert
  expect(result).toBe(expected);
});
```

### 2. Use Descriptive Test Names

```javascript
// ❌ Bad
test("test 1", () => {});

// ✅ Good
test("should return 403 when JWT scope is missing", () => {});
```

### 3. Mock External Dependencies

```javascript
jest.mock("@sentry/node");
jest.mock("../../services/stripe");
jest.mock("@prisma/client");
```

### 4. Clean Up After Tests

```javascript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### 5. Test Edge Cases

```javascript
test("handles empty input", () => {});
test("handles null values", () => {});
test("handles extremely large numbers", () => {});
test("handles special characters", () => {});
```

---

## 🔗 Related Documentation

- [GREEN_100_STATUS.md](GREEN_100_STATUS.md) - Overall status tracking
- [TEST_COVERAGE_100_STRATEGY.md](TEST_COVERAGE_100_STRATEGY.md) - Coverage
  strategy
- [SECURITY_FIXES_100_PERCENT.md](SECURITY_FIXES_100_PERCENT.md) - Security
  fixes
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

## 🏁 Completion Checklist

After implementing all test suites:

- [ ] All 8 test files created
- [ ] Coverage report shows 90%+ across all metrics
- [ ] All tests pass locally
- [ ] Tests pass in CI/CD
- [ ] Coverage reports uploaded
- [ ] GREEN_100_STATUS.md updated (Testing: 🟡 → 🟢)
- [ ] Committed and pushed to main

**Congratulations!** 🎉 Testing is now **100% GREEN**! 🟢
