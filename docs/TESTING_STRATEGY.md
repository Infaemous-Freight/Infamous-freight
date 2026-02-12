# Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for Infamous Freight Enterprises, ensuring high code quality, security, and reliability across all services.

## Testing Pyramid

```
          /\
         /  \  E2E Tests (5%)
        /____\
       /      \  Integration Tests (20%)
      /________\
     /          \  Unit Tests (75%)
    /__________  \
```

### Distribution

- **Unit Tests (75%)**: Fast, isolated tests for individual functions and modules
- **Integration Tests (20%)**: Test interactions between components and services
- **E2E Tests (5%)**: Complete user workflows through the UI

## Coverage Requirements

| Metric     | Minimum | Target | Current  |
| ---------- | ------- | ------ | -------- |
| Statements | 84%     | 90%    | 86.2% ✅ |
| Branches   | 75%     | 85%    | 78.8% ✅ |
| Functions  | 80%     | 90%    | 82.9% ✅ |
| Lines      | 84%     | 90%    | 86.9% ✅ |

**Note**: All minimum thresholds are enforced in CI/CD. PRs that decrease coverage will be rejected.

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions in isolation  
**Location**: `apps/api/__tests__/*.test.js`  
**Coverage**: 75% of total tests

**What to test:**

- Pure functions
- Business logic
- Data transformations
- Validation functions
- Utility functions

**Example:**

```javascript
describe("validateShipment", () => {
  test("should validate correct shipment", () => {
    const shipment = { trackingNumber: "TEST-001", origin: "NY" };
    expect(validateShipment(shipment)).toBe(true);
  });

  test("should reject invalid tracking number", () => {
    const shipment = { trackingNumber: "", origin: "NY" };
    expect(validateShipment(shipment)).toBe(false);
  });
});
```

### 2. Integration Tests

**Purpose**: Test component interactions  
**Location**: `apps/api/__tests__/integration/`  
**Coverage**: 20% of total tests

**What to test:**

- Complete API workflows
- Database transactions
- Authentication flows
- External API integrations

**Example:**

```javascript
describe("Shipment Lifecycle", () => {
  test("create → update → deliver workflow", async () => {
    // Create
    const createRes = await request(app)
      .post("/api/shipments")
      .send(shipmentData);

    const id = createRes.body.shipment.id;

    // Update
    await request(app)
      .patch(`/api/shipments/${id}`)
      .send({ status: "IN_TRANSIT" });

    // Verify
    const getRes = await request(app).get(`/api/shipments/${id}`);

    expect(getRes.body.shipment.status).toBe("IN_TRANSIT");
  });
});
```

### 3. Security Tests

**Purpose**: Verify protection against common vulnerabilities  
**Location**: `apps/api/__tests__/security/`

**What to test:**

- XSS prevention
- SQL injection prevention
- Authentication/authorization
- Rate limiting
- Input validation
- CSRF protection

**Example:**

```javascript
describe("Security - XSS Prevention", () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    "<img src=x onerror=alert(1)>",
  ];

  xssPayloads.forEach((payload) => {
    test(`should sanitize: ${payload}`, async () => {
      const res = await request(app)
        .post("/api/shipments")
        .send({ origin: payload });

      expect(res.status).toBe(400);
    });
  });
});
```

### 4. Performance Tests

**Purpose**: Ensure acceptable response times and resource usage  
**Location**: `apps/api/__tests__/performance/`

**What to test:**

- Response time SLAs
- Throughput under load
- Memory usage
- Database query performance
- Concurrent request handling

**Example:**

```javascript
describe("Performance - Response Times", () => {
  test("should respond within 200ms", async () => {
    const start = Date.now();
    await request(app).get("/api/shipments");
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200);
  });
});
```

### 5. E2E Tests

**Purpose**: Test complete user workflows  
**Location**: `e2e/tests/`  
**Tool**: Playwright

**What to test:**

- Critical user paths
- Cross-browser compatibility
- UI functionality
- Form submissions
- Navigation flows

**Example:**

```javascript
test("complete order workflow", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL("/dashboard");
});
```

## Test Execution Strategy

### Local Development

```bash
# Fast feedback loop
pnpm test --watch                    # Watch mode
pnpm test -- path/to/test.js        # Single file
pnpm test -t "test name"            # Specific test

# Pre-commit
pnpm test                            # All unit tests
pnpm lint                            # Code quality
```

### Pre-Push

```bash
# Automatic via git hook
pnpm test                            # All tests must pass
pnpm test:coverage                   # Coverage check
```

### CI/CD Pipeline

```yaml
1. Install dependencies
2. Run linter (fail fast)
3. Run type checking
4. Run unit tests
5. Run integration tests
6. Check coverage thresholds
7. Run security scans
8. Run E2E tests (on staging)
```

## Mocking Strategy

### External APIs

✅ **Always mock:**

- Stripe
- PayPal
- OpenAI
- Anthropic
- Email services
- SMS services

```javascript
jest.mock("stripe", () => ({
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({ id: "cs_test" }),
    },
  },
}));
```

### Database

✅ **Mock for unit tests:**

```javascript
jest.mock("../db/prisma", () => ({
  shipment: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}));
```

❌ **Use real database for integration tests:**

```javascript
// Use test database
beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## Test Data Management

### Fixtures

Store reusable test data:

```javascript
// __tests__/helpers/fixtures.js
export const validShipment = {
  trackingNumber: "TEST-001",
  origin: "New York, NY",
  destination: "LA, CA",
  weight: 25.5,
};
```

### Factory Functions

Generate test data programmatically:

```javascript
function createShipment(overrides = {}) {
  return {
    id: `test-${Date.now()}`,
    trackingNumber: `TEST-${Date.now()}`,
    ...defaultShipment,
    ...overrides,
  };
}
```

### Database Seeding

```javascript
beforeEach(async () => {
  await prisma.shipment.deleteMany();
  await prisma.shipment.createMany({
    data: testShipments,
  });
});
```

## Quality Gates

### Pre-Merge Requirements

✅ All tests passing  
✅ Coverage ≥ minimum thresholds  
✅ No linting errors  
✅ Type checking passes  
✅ Security scan clean  
✅ Code review approved

### Deployment Requirements

✅ All CI checks pass  
✅ E2E tests pass on staging  
✅ Load tests pass  
✅ Manual QA sign-off (for major changes)

## Performance Targets

| Endpoint                 | Target | Max   |
| ------------------------ | ------ | ----- |
| GET /api/health          | 50ms   | 100ms |
| GET /api/shipments       | 150ms  | 200ms |
| GET /api/shipments/:id   | 75ms   | 100ms |
| POST /api/shipments      | 200ms  | 300ms |
| PATCH /api/shipments/:id | 100ms  | 150ms |

## Security Testing Checklist

### Input Validation

- [x] XSS prevention
- [x] SQL injection prevention
- [x] Command injection prevention
- [x] Path traversal prevention
- [x] Buffer overflow prevention

### Authentication/Authorization

- [x] JWT validation
- [x] Token expiration
- [x] Scope-based access control
- [x] Rate limiting
- [x] CORS configuration

### Data Protection

- [x] Sensitive data masking
- [x] Encryption at rest
- [x] Encryption in transit
- [x] Secure session management

## Maintenance Strategy

### Regular Tasks

- **Weekly**: Review test failures
- **Monthly**: Update dependencies, review test coverage
- **Quarterly**: Audit security tests, update test data
- **Annually**: Review testing strategy

### Test Health Metrics

Track and monitor:

- Test execution time
- Flaky test rate (target: <1%)
- Coverage trends
- Test maintenance burden

## Troubleshooting

### Flaky Tests

1. Add retry logic for timing-dependent tests
2. Increase timeouts if needed
3. Mock time-dependent operations
4. Ensure proper cleanup

### Slow Tests

1. Profile with `--detectLeaks`
2. Optimize database queries
3. Reduce test data size
4. Parallelize where possible

### Low Coverage

1. Review uncovered code
2. Determine if intentional (signal handlers, etc.)
3. Add tests for business-critical paths
4. Document coverage gaps

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Playwright Documentation](https://playwright.dev/)
- [TESTING.md](./TESTING.md) - Detailed testing guide
- [TEST_COVERAGE_COMPLETE.md](./TEST_COVERAGE_COMPLETE.md) - Coverage report

---

**Last Updated**: December 16, 2025  
**Owner**: Development Team  
**Review Cycle**: Quarterly
