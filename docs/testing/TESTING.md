# Testing Guide

## Overview

This document describes the testing strategy, conventions, and best practices for the Infamous Freight Enterprises project.

## Test Coverage Requirements

| Metric     | Minimum | Target |
| ---------- | ------- | ------ |
| Statements | 84%     | 90%+   |
| Branches   | 75%     | 85%+   |
| Functions  | 80%     | 90%+   |
| Lines      | 84%     | 90%+   |

**Current Coverage**: 86.2% (All thresholds exceeded ✅)

## Running Tests

### All Tests

```bash
# From project root
pnpm test

# API only
cd apps/api && pnpm test

# Web only
cd apps/web && pnpm test

# With coverage
pnpm test:coverage
```

### Specific Test Suites

```bash
# Run single test file
pnpm test __tests__/routes.shipments.test.js

# Run tests matching pattern
pnpm test -t "should create shipment"

# Watch mode
pnpm test --watch

# Update snapshots
pnpm test -u
```

### Integration Tests

```bash
# All integration tests
pnpm test:integration

# Specific integration test
pnpm test __tests__/integration/shipment-lifecycle.test.js
```

### Performance Tests

```bash
# Benchmark tests
pnpm test:performance

# Load tests
./scripts/load-test.sh
```

### Security Tests

```bash
# Fuzzing tests
pnpm test __tests__/security/

# Contract tests
pnpm test:contracts
```

## Test Structure

### Directory Organization

```
apps/api/
├── __tests__/              # Unit tests
│   ├── routes.*.test.js    # Route tests
│   ├── *.test.js           # Middleware tests
│   ├── helpers/            # Shared test utilities
│   ├── integration/        # Integration tests
│   ├── security/           # Security & fuzzing tests
│   └── performance/        # Performance benchmarks
├── src/
│   ├── routes/
│   │   └── __tests__/      # Co-located route tests
│   └── services/
│       └── __tests__/      # Co-located service tests
└── jest.config.js
```

## Test Types

### 1. Unit Tests

Test individual functions/modules in isolation.

**When to use:**

- Testing pure functions
- Testing middleware
- Testing utility functions
- Testing business logic

**Example:**

```javascript
describe("validateShipment", () => {
  test("should reject invalid tracking number", () => {
    const result = validateShipment({ trackingNumber: "" });
    expect(result.valid).toBe(false);
  });
});
```

### 2. Integration Tests

Test multiple components working together.

**When to use:**

- Testing complete API workflows
- Testing database interactions
- Testing external service integrations
- Testing authentication flows

**Example:**

```javascript
describe("Shipment Lifecycle", () => {
  test("create → update → track → deliver", async () => {
    // Create shipment
    const createRes = await request(app)
      .post("/api/shipments")
      .send(shipmentData);

    const shipmentId = createRes.body.data.id;

    // Update status
    await request(app)
      .patch(`/api/shipments/${shipmentId}`)
      .send({ status: "IN_TRANSIT" });

    // Track shipment
    const trackRes = await request(app).get(`/api/shipments/${shipmentId}`);

    expect(trackRes.body.data.status).toBe("IN_TRANSIT");
  });
});
```

### 3. Security Tests

Test input validation, injection attacks, and security vulnerabilities.

**When to use:**

- Testing user input validation
- Testing authentication/authorization
- Testing rate limiting
- Testing XSS/SQL injection prevention

**Example:**

```javascript
describe("Security - Input Fuzzing", () => {
  const maliciousInputs = [
    '<script>alert("xss")</script>',
    '"; DROP TABLE users; --',
    "../../../etc/passwd",
  ];

  maliciousInputs.forEach((input) => {
    test(`should sanitize: ${input}`, async () => {
      const res = await request(app)
        .post("/api/shipments")
        .send({ trackingNumber: input });

      expect(res.status).toBe(400);
    });
  });
});
```

### 4. Performance Tests

Test response times and resource usage.

**When to use:**

- Verifying response time SLAs
- Testing database query performance
- Testing pagination performance
- Load testing

**Example:**

```javascript
describe("Performance - Shipment List", () => {
  test("should respond within 200ms", async () => {
    const start = Date.now();
    await request(app).get("/api/shipments");
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200);
  });
});
```

### 5. Contract Tests

Verify external API integrations match expected schemas.

**When to use:**

- Testing third-party API integrations
- Verifying API response schemas
- Testing webhook payloads

**Example:**

```javascript
describe('Stripe API Contract', () => {
  test('checkout session matches expected schema', async () => {
    const session = await stripe.checkout.sessions.create({...});

    expect(session).toMatchObject({
      id: expect.stringMatching(/^cs_/),
      url: expect.stringMatching(/^https:\/\//),
      status: expect.stringMatching(/^(open|complete|expired)$/),
    });
  });
});
```

## Mocking Strategy

### When to Mock

- ✅ External APIs (Stripe, OpenAI, PayPal)
- ✅ Database connections in unit tests
- ✅ File system operations
- ✅ Time-dependent operations (Date.now(), setTimeout)

### When NOT to Mock

- ❌ Business logic
- ❌ Utility functions
- ❌ Simple transformations
- ❌ In integration tests (use test database)

### Mock Examples

**External API:**

```javascript
jest.mock("stripe", () => ({
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({ id: "cs_test" }),
    },
  },
}));
```

**Database:**

```javascript
jest.mock("../db/prisma", () => ({
  shipment: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: "1" }),
  },
}));
```

**Time:**

```javascript
jest.useFakeTimers();
jest.setSystemTime(new Date("2025-01-01"));
```

## Test Data Management

### Test Fixtures

Store reusable test data in fixtures:

```javascript
// __tests__/fixtures/shipments.js
export const validShipment = {
  trackingNumber: "TEST-001",
  origin: "New York, NY",
  destination: "Los Angeles, CA",
  status: "PENDING",
};

export const invalidShipment = {
  trackingNumber: "", // Invalid
  origin: "New York, NY",
};
```

### Database Seeding

```javascript
beforeEach(async () => {
  // Clean database
  await prisma.shipment.deleteMany();
  await prisma.user.deleteMany();

  // Seed test data
  await prisma.user.create({ data: testUser });
});
```

## Best Practices

### ✅ DO

1. **Write tests first** (TDD when possible)
2. **Test one thing per test** - Keep tests focused
3. **Use descriptive test names** - `should reject invalid email format`
4. **Test edge cases** - Empty strings, null, undefined, max values
5. **Clean up after tests** - Clear mocks, reset database
6. **Use arrange-act-assert pattern**:

   ```javascript
   // Arrange
   const user = { email: "test@example.com" };

   // Act
   const result = validateUser(user);

   // Assert
   expect(result.valid).toBe(true);
   ```

7. **Test error paths** - Not just happy paths
8. **Keep tests independent** - Tests should not depend on each other
9. **Use shared utilities** - DRY principle applies to tests too

### ❌ DON'T

1. **Don't test implementation details** - Test behavior, not internals
2. **Don't use production data** - Always use test fixtures
3. **Don't skip cleanup** - Avoid test pollution
4. **Don't test external services directly** - Mock them
5. **Don't write flaky tests** - Fix intermittent failures immediately
6. **Don't ignore failing tests** - Fix or remove them
7. **Don't over-mock** - Only mock what you need

## Authentication in Tests

### Creating Test Tokens

```javascript
const jwt = require("jsonwebtoken");

const makeToken = (scopes = ["read"]) => {
  return jwt.sign(
    { sub: "test-user", scopes },
    process.env.JWT_SECRET || "test-secret",
  );
};

const authHeader = (token) => `Bearer ${token}`;
```

### Using in Tests

```javascript
test("should require authentication", async () => {
  const token = makeToken(["shipments:read"]);

  const res = await request(app)
    .get("/api/shipments")
    .set("Authorization", authHeader(token));

  expect(res.status).toBe(200);
});
```

## Debugging Tests

### Failed Tests

```bash
# Run only failing tests
pnpm test --onlyFailures

# Show full error details
pnpm test --verbose

# Run in Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["${fileBasename}", "--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Coverage Analysis

### Viewing Coverage Reports

```bash
# Generate HTML report
pnpm test:coverage

# Open in browser
open apps/api/coverage/index.html  # macOS
xdg-open apps/api/coverage/index.html  # Linux
start apps/api/coverage/index.html  # Windows
```

### Understanding Coverage Gaps

- **Green**: Covered by tests
- **Yellow**: Partially covered (some branches not tested)
- **Red**: Not covered

Focus on:

1. High-value paths (authentication, payments)
2. Error handling
3. Edge cases
4. Security-critical code

## Continuous Integration

Tests run automatically on:

- Every push to `main` or `develop`
- All pull requests
- Before deployment

### CI Workflow

```yaml
- Install dependencies
- Run linter
- Run type checking
- Run unit tests
- Run integration tests
- Check coverage thresholds
- Run security scans
```

## Common Patterns

### Testing Async Operations

```javascript
test("should handle async operation", async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Promises

```javascript
test("should reject invalid input", async () => {
  await expect(validateUser(null)).rejects.toThrow("Invalid user");
});
```

### Testing Callbacks

```javascript
test("should call callback with result", (done) => {
  fetchData((err, data) => {
    expect(err).toBeNull();
    expect(data).toBeDefined();
    done();
  });
});
```

### Testing Events

```javascript
test("should emit event on completion", (done) => {
  const emitter = new EventEmitter();

  emitter.on("complete", (data) => {
    expect(data.status).toBe("success");
    done();
  });

  processTask(emitter);
});
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test Coverage Guide](./TEST_COVERAGE_COMPLETE.md)
- [API Documentation](http://localhost:4000/api/docs)

## Questions?

If you have questions about testing:

1. Check this guide first
2. Review existing test files for examples
3. Ask in team chat
4. Create an issue for documentation improvements

---

**Last Updated**: December 16, 2025  
**Test Framework**: Jest 30.2.0  
**Current Coverage**: 86.2%
