# Testing Guide

## Overview

This guide explains how to write, run, and maintain tests for the Infamous Freight Enterprises platform.

## Test Structure

```
apps/api/
├── __tests__/              # Route-level tests
│   ├── routes.billing.test.js
│   ├── routes.shipments.test.js
│   ├── routes.users.test.js
│   ├── routes.validation.test.js
│   ├── security.test.js
│   ├── securityHeaders.test.js
│   ├── errorHandler.test.js
│   ├── validation.test.js
│   ├── logger.test.js
│   ├── sentry.test.js
│   └── server.test.js
├── src/services/__tests__/ # Service-level tests
│   └── aiSyntheticClient.test.js
└── src/routes/__tests__/   # Route-specific tests
    └── health.test.js
```

## Running Tests

### Quick Commands

```bash
# Run all tests
cd apps/api && pnpm test

# Run with coverage
cd apps/api && pnpm test:coverage

# Run specific test file
cd apps/api && pnpm test routes.billing.test.js

# Run tests in watch mode (for development)
cd apps/api && pnpm test --watch

# Run tests with verbose output
cd apps/api && pnpm test --verbose
```

### Coverage Reports

After running `pnpm test:coverage`, view the HTML report:

```bash
# Open in browser (macOS)
open apps/api/coverage/index.html

# Open in browser (Linux)
xdg-open apps/api/coverage/index.html

# Open in browser (Windows)
start apps/api/coverage/index.html
```

## Writing Tests

### Test File Naming

- **Route tests**: `routes.<name>.test.js`
- **Middleware tests**: `<middleware-name>.test.js`
- **Service tests**: `<service-name>.test.js`

### Basic Test Structure

```javascript
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mock external dependencies BEFORE importing modules
jest.mock("../src/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      // ... other methods
    },
  },
}));

describe("Feature Name", () => {
  let app;

  beforeEach(() => {
    // Setup test app
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    // ... setup routes
  });

  afterEach(() => {
    // Cleanup
  });

  describe("Specific functionality", () => {
    test("should do something expected", async () => {
      // Arrange
      const testData = {
        /* ... */
      };

      // Act
      const response = await request(app).post("/api/endpoint").send(testData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(/* expected */);
    });
  });
});
```

### Authentication in Tests

```javascript
const JWT_SECRET = "test-secret";
process.env.JWT_SECRET = JWT_SECRET;

const makeToken = (scopes = ["users:read"]) => {
  return jwt.sign({ sub: "test-user", scopes }, JWT_SECRET);
};

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

// Use in tests
const response = await request(app)
  .get("/api/users/123")
  .set(authHeader(makeToken(["users:read"])));
```

### Mocking Prisma

Global mock (in `jest.setup.js`):

```javascript
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    shipment: {
      findMany: jest.fn(),
      // ... other methods
    },
    $transaction: jest.fn((callback) => callback()),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      constructor(message, { code }) {
        super(message);
        this.code = code;
      }
    },
  },
}));
```

Per-test mock customization:

```javascript
const { prisma } = require("../src/db/prisma");

test("should create user", async () => {
  prisma.user.create.mockResolvedValueOnce({
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
  });

  const response = await request(app)
    .post("/api/users")
    .set(authHeader(makeToken(["users:write"])))
    .send({ email: "test@example.com", name: "Test User" });

  expect(response.status).toBe(201);
  expect(prisma.user.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      email: "test@example.com",
    }),
  });
});
```

### Testing Error Scenarios

```javascript
test("should handle database errors gracefully", async () => {
  prisma.user.findUnique.mockRejectedValueOnce(
    new Error("Database connection failed"),
  );

  const response = await request(app)
    .get("/api/users/123")
    .set(authHeader(makeToken(["users:read"])));

  expect(response.status).toBe(500);
  expect(response.body.error).toBeDefined();
});

test("should return 404 when user not found", async () => {
  prisma.user.findUnique.mockResolvedValueOnce(null);

  const response = await request(app)
    .get("/api/users/nonexistent")
    .set(authHeader(makeToken(["users:read"])));

  expect(response.status).toBe(404);
});
```

### Testing Validation

```javascript
test("should reject invalid email", async () => {
  const response = await request(app)
    .post("/api/users")
    .set(authHeader(makeToken(["users:write"])))
    .send({ email: "not-an-email", name: "Test" });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe("Validation Error");
  expect(response.body.errors).toContainEqual(
    expect.objectContaining({
      field: "email",
    }),
  );
});
```

## Common Patterns

### Testing Rate Limiting

```javascript
test("should enforce rate limits", async () => {
  const makeRequest = () =>
    request(app)
      .post("/api/ai/command")
      .set(authHeader(makeToken(["ai:command"])))
      .send({ command: "test", payload: {} });

  // Make requests up to limit
  for (let i = 0; i < 20; i++) {
    const response = await makeRequest();
    expect(response.status).toBe(200);
  }

  // Next request should be rate limited
  const response = await makeRequest();
  expect(response.status).toBe(429);
});
```

### Testing File Uploads

```javascript
const fs = require("fs");
const path = require("path");

test("should accept audio file upload", async () => {
  const audioBuffer = Buffer.from("fake audio data");

  const response = await request(app)
    .post("/api/voice/ingest")
    .set(authHeader(makeToken(["voice:ingest"])))
    .attach("audio", audioBuffer, "test.mp3");

  expect(response.status).toBe(200);
});
```

## Test Environment Setup

### Alpine Linux + Prisma

If running tests in Alpine Linux environment, ensure Prisma is configured:

```prisma
// prisma/schema.prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

See [ALPINE_PRISMA_SETUP.md](./ALPINE_PRISMA_SETUP.md) for details.

### Environment Variables

Tests automatically set:

- `NODE_ENV=test`
- `JWT_SECRET=test-secret`

Override in tests if needed:

```javascript
beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_123";
  process.env.OPENAI_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.OPENAI_API_KEY;
});
```

## Coverage Requirements

Enforced thresholds (see `jest.config.js`):

```javascript
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 84,
    statements: 84,
  },
}
```

**CI/CD will fail if coverage drops below these thresholds.**

## Best Practices

### ✅ DO

- **Test business logic thoroughly**
- **Use descriptive test names**: "should return 404 when user not found"
- **Follow AAA pattern**: Arrange, Act, Assert
- **Mock external dependencies**: Stripe, PayPal, OpenAI, etc.
- **Test error paths**: Not just happy paths
- **Clear mocks between tests**: `jest.clearAllMocks()`
- **Use factory functions**: For common test data

### ❌ DON'T

- **Test implementation details**: Test behavior, not internals
- **Leave console.log in tests**: Use proper assertions
- **Skip error scenarios**: Test failures too
- **Mock what you own**: Mock external APIs, not your own code
- **Write brittle tests**: Avoid hard-coded IDs, timestamps
- **Test private methods**: Only test public API
- **Ignore flaky tests**: Fix or remove them

## Debugging Tests

### Common Issues

**1. "Cannot find module"**

```bash
# Ensure dependencies installed
pnpm install

# Check module paths
ls -la node_modules/@prisma/client
```

**2. "Timeout errors"**

```javascript
// Increase timeout for slow tests
test("slow operation", async () => {
  // ...
}, 10000); // 10 seconds
```

**3. "Mock not working"**

```javascript
// Ensure mock is BEFORE require
jest.mock("../module");
const module = require("../module");
```

**4. "Tests pass locally but fail in CI"**

- Check environment variables
- Verify Node.js version matches
- Review CI logs for setup issues

### Debugging Commands

```bash
# Run single test with debug output
node --inspect-brk node_modules/.bin/jest routes.billing.test.js

# Run with increased verbosity
pnpm test --verbose --no-coverage

# Check test file syntax
node -c __tests__/routes.billing.test.js
```

## Integration with CI/CD

Tests run automatically on:

- Every push to `main` or `develop`
- Every pull request
- Manual workflow dispatch

See `.github/workflows/ci.yml` for configuration.

## Related Documentation

- [COVERAGE_GAPS.md](./COVERAGE_GAPS.md) - What we don't test and why
- [ALPINE_PRISMA_SETUP.md](./ALPINE_PRISMA_SETUP.md) - Environment setup
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines

## Getting Help

- **Flaky tests**: Document in GitHub issue
- **Coverage questions**: See [COVERAGE_GAPS.md](./COVERAGE_GAPS.md)
- **CI failures**: Check Actions logs
- **New test patterns**: Ask in PR review
