# Developer Workflow Guide - All Recommendations

**Last Updated:** January 22, 2026

## Quick Start

### 1. First-Time Setup

```bash
# Install dependencies
pnpm install

# Build shared package (CRITICAL!)
pnpm --filter @infamous-freight/shared build

# Setup database
cd api && pnpm prisma:migrate:dev && cd ..

# Run type checking
pnpm check:types

# Start development
pnpm dev
```

### 2. Daily Development Workflow

```bash
# Before starting work
pnpm check:types          # Find type errors early
pnpm lint                 # Check code style
pnpm test                 # Run tests

# Make changes to shared package?
pnpm --filter @infamous-freight/shared build && pnpm dev:restart

# Before committing
pnpm lint && pnpm format  # Format code
pnpm check:types          # Verify types
pnpm test                 # Run tests
git commit -m "feat: description"
```

## Route Development Checklist

When creating a new API route:

```javascript
const express = require("express");
const {
  limiters,
  authenticate,
  requireScope,
  requireOrganization,
  auditLog,
} = require("../middleware/security");
const {
  validateString,
  handleValidationErrors,
} = require("../middleware/validation");

const router = express.Router();

router.post(
  "/resource",

  // 1. RATE LIMITING - Choose appropriate limiter
  limiters.general, // general, auth, ai, billing, voice, export, passwordReset, webhook

  // 2. AUTHENTICATION - Verify user identity
  authenticate,

  // 3. AUTHORIZATION - Verify permissions
  requireOrganization, // If multi-tenant
  requireScope("resource:write"), // Scope required

  // 4. AUDIT LOGGING - Track request
  auditLog,

  // 5. VALIDATION - Validate inputs
  [
    validateString("field1", { maxLength: 100 }),
    validateString("field2"),
    handleValidationErrors, // REQUIRED
  ],

  // 6. HANDLER - Process request
  async (req, res, next) => {
    try {
      const result = await service.doSomething(req.body);

      // Successful response
      res.status(201).json(
        new ApiResponse({
          success: true,
          data: result,
        }),
      );
    } catch (err) {
      // Delegate error handling to global errorHandler
      next(err);
    }
  },
);

module.exports = router;
```

## Validation Patterns

### String Validation

```javascript
validateString("fieldName", {
  maxLength: 500, // Optional
  trim: true, // Automatic
});
```

### Email Validation

```javascript
validateEmail("email"); // Validates and normalizes
```

### Enum Validation

```javascript
import { SHIPMENT_STATUSES } from "@infamous-freight/shared";

validateEnum("status", SHIPMENT_STATUSES);
```

### Pagination

```javascript
validatePaginationQuery({
  page: "page",
  pageSize: "pageSize",
  maxPageSize: 100,
});
```

## Database Query Patterns

### Always use include/select

```javascript
// ❌ DON'T - Returns all fields (wasteful)
const user = await prisma.user.findUnique({
  where: { id: userId },
});

// ✅ DO - Select specific fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    role: true,
    shipments: true,
  },
});

// ✅ DO - Include related data
const shipments = await prisma.shipment.findMany({
  include: {
    driver: true, // Include full driver
    destination: true,
  },
});
```

### Prevent N+1 queries

```javascript
// ❌ DON'T - N+1 problem!
const shipments = await prisma.shipment.findMany();
for (const shipment of shipments) {
  shipment.driver = await prisma.driver.findUnique({
    where: { id: shipment.driverId },
  }); // Separate query for each shipment!
}

// ✅ DO - Fetch all at once
const shipments = await prisma.shipment.findMany({
  include: { driver: true }, // Single query with join
});
```

## Rate Limiting Guide

**Use appropriate limiter for operation type:**

```javascript
// General operations (default)
limiters.general; // 100 requests / 15 minutes

// Authentication attempts (strict)
limiters.auth; // 5 attempts / 15 minutes

// AI inference (moderate)
limiters.ai; // 20 requests / 1 minute

// Billing operations (moderate)
limiters.billing; // 30 requests / 15 minutes

// Voice processing (moderate)
limiters.voice; // 10 requests / 1 minute

// Expensive exports (very strict)
limiters.export; // 5 requests / 1 hour

// Password resets (very strict)
limiters.passwordReset; // 3 attempts / 24 hours

// Webhook validation (permissive)
limiters.webhook; // 100 requests / 1 minute
```

## Error Handling

All errors flow through centralized `errorHandler`:

```javascript
// ✅ CORRECT - Delegate to error handler
router.post("/action", async (req, res, next) => {
  try {
    const result = await doSomething();
    res.json(new ApiResponse({ success: true, data: result }));
  } catch (err) {
    next(err); // Error handler catches and logs
  }
});

// ❌ WRONG - Manual error handling
router.post("/action", async (req, res) => {
  try {
    const result = await doSomething();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message }); // Inconsistent
  }
});
```

### Error Handler Features

- Logs to console with structured JSON
- Sends to Sentry for monitoring
- Generates unique error ID for tracing
- Masks sensitive data in responses
- Returns appropriate HTTP status codes

## Testing Routes

### Unit Testing Pattern

```javascript
describe("POST /api/resource", () => {
  it("should create resource with valid input", async () => {
    const response = await request(app)
      .post("/api/resource")
      .set("Authorization", `Bearer ${token}`)
      .send({
        field1: "value1",
        field2: "value2",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
  });

  it("should reject invalid input", async () => {
    const response = await request(app)
      .post("/api/resource")
      .set("Authorization", `Bearer ${token}`)
      .send({
        field1: "", // Invalid - empty string
      })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
  });

  it("should require authentication", async () => {
    const response = await request(app)
      .post("/api/resource")
      .send({ field1: "value" })
      .expect(401);

    expect(response.body.error).toBe("Missing bearer token");
  });
});
```

## Debugging Commands

```bash
# View API logs
tail -f api/logs/combined.log

# Filter for errors
tail -f api/logs/error.log

# View database with Prisma Studio
cd api && pnpm prisma:studio

# Check types
pnpm check:types

# Run linter
pnpm lint

# Format code
pnpm format

# Type check single file
npx tsc --noEmit api/src/routes/shipments.js

# Test specific route
pnpm --filter api test -- shipments.test.js

# Monitor health
watch -n 5 'curl -s http://localhost:4000/api/health | jq .'
```

## Common Issues & Solutions

### "pnpm: command not found"

```bash
npm install -g pnpm@8.15.9
```

### Type errors after shared changes

```bash
# Rebuild shared package
pnpm --filter @infamous-freight/shared build

# Restart development
pnpm dev
```

### Database migrations out of sync

```bash
# Reset database (dev only!)
cd api && pnpm prisma:migrate:reset

# Then retry
pnpm dev
```

### Rate limit errors in tests

```javascript
// Mock rate limiter in tests
jest.mock("../middleware/security", () => ({
  limiters: {
    general: (req, res, next) => next(),
    auth: (req, res, next) => next(),
  },
}));
```

### Validation errors not showing

```javascript
// Ensure handleValidationErrors is present
[
  validateString("field"),
  handleValidationErrors, // ← Required!
];
```

## Code Review Guidelines

When reviewing PRs, check:

1. **Security**
   - [ ] All routes authenticated
   - [ ] Scopes enforced appropriately
   - [ ] Rate limiters applied
   - [ ] Input validation on all user inputs

2. **Performance**
   - [ ] No N+1 queries
   - [ ] Prisma using include/select
   - [ ] Appropriate caching used
   - [ ] Large payloads avoided

3. **Code Quality**
   - [ ] Types imported from shared
   - [ ] Error handling delegates to next(err)
   - [ ] Middleware order correct
   - [ ] Tests cover happy path + errors
   - [ ] Coverage maintained above 75%

4. **Consistency**
   - [ ] Follows middleware pattern
   - [ ] Uses shared validators
   - [ ] ApiResponse format used
   - [ ] Error messages clear

## Performance Monitoring

### Key Metrics

```bash
# View response times
tail -f api/logs/combined.log | jq '.duration'

# Find slow requests (> 1000ms)
cat api/logs/combined.log | jq 'select(.duration > 1000)'

# Error rate
cat api/logs/combined.log | jq 'select(.status >= 400)' | wc -l

# Most called endpoints
cat api/logs/combined.log | jq '.path' | sort | uniq -c | sort -rn
```

### Production Monitoring

- **Sentry**: Real-time error tracking
- **Datadog RUM**: Frontend performance
- **Health Endpoint**: Service availability
- **Audit Logs**: User action tracking

## Deployment Checklist

Before deploying:

- [ ] All tests passing: `pnpm test`
- [ ] Type checking: `pnpm check:types`
- [ ] Linting: `pnpm lint`
- [ ] Coverage maintained: `pnpm test -- --coverage`
- [ ] Migrations reviewed: `cd api && pnpm prisma:migrate:status`
- [ ] Sentry configured: Check `SENTRY_DSN`
- [ ] Health check working: `curl /api/health`
- [ ] Bundle size checked: `ANALYZE=true pnpm build`

## References

- [Recommendation Implementation Guide](./IMPLEMENTATION_ALL_RECOMMENDATIONS_100_PERCENT.md)
- [Copilot Instructions](./github/copilot-instructions.md)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Express.js Docs](https://expressjs.com/)
- [Next.js Docs](https://nextjs.org/docs)

---

**Last Updated:** January 22, 2026
