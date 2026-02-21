# Error Handling Guide - Infamous Freight Enterprises

Comprehensive guide for handling errors consistently across the entire platform.

## Table of Contents

- [Error Handling Philosophy](#error-handling-philosophy)
- [Error Classes](#error-classes)
- [Express.js Error Middleware](#expressjs-error-middleware)
- [API Error Responses](#api-error-responses)
- [Using ApiResponse](#using-apiresponse)
- [Throwing vs Delegating](#throwing-vs-delegating)
- [Sentry Integration](#sentry-integration)
- [Testing Error Scenarios](#testing-error-scenarios)
- [Common Error Patterns](#common-error-patterns)

## Error Handling Philosophy

**Core Principle**: **All errors must be caught and delegated to the global
error handler via `next(err)`, never thrown directly to the client.**

```
Request Flow with Errors:

Route Handler
    ↓
Try-Catch Block
    ↓
Error Caught?
    ├─ YES → Enrich error → Call next(err)
    └─ NO → Continue to next middleware
         ↓
Global Error Handler (errorHandler middleware)
    ↓
Format Error Response
    ├─ Log to Winston
    ├─ Send to Sentry
    └─ Return to client
```

## Error Classes

### ApiError (Custom Application Error)

Located in `packages/shared/src/errors/ApiError.ts`:

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        status: this.statusCode,
        details: this.details,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
```

### Throwing ApiError

```javascript
// ✅ GOOD: Use ApiError for application errors
throw new ApiError(
  400, // HTTP Status
  "INVALID_SHIPMENT_STATUS", // Error code
  "Shipment cannot be delivered twice", // User message
  { currentStatus: "DELIVERED", attemptedStatus: "PENDING" }, // Debug details
);

// Will produce response:
// {
//   "success": false,
//   "error": {
//     "code": "INVALID_SHIPMENT_STATUS",
//     "message": "Shipment cannot be delivered twice",
//     "status": 400,
//     "details": { "currentStatus": "DELIVERED", ... },
//     "timestamp": "2026-02-14T12:34:56.789Z"
//   }
// }
```

### Standard Error Codes

| Code                      | HTTP Status | Meaning                                  |
| ------------------------- | ----------- | ---------------------------------------- |
| `INVALID_REQUEST_BODY`    | 400         | Bad JSON or missing required fields      |
| `INVALID_QUERY_PARAMS`    | 400         | Invalid filter, sort, pagination params  |
| `INVALID_SHIPMENT_STATUS` | 400         | Invalid state transition                 |
| `UNAUTHENTICATED`         | 401         | Missing or invalid JWT token             |
| `UNAUTHORIZED`            | 403         | Authenticated but lacks permission/scope |
| `NOT_FOUND`               | 404         | Resource doesn't exist                   |
| `RATE_LIMITED`            | 429         | Too many requests                        |
| `UNPROCESSABLE_ENTITY`    | 422         | Validation failed (detailed)             |
| `INTERNAL_ERROR`          | 500         | Unexpected server error                  |

## Express.js Error Middleware

### Error Handler Middleware

Located in `apps/api/src/middleware/errorHandler.js`:

```javascript
const { logger } = require("./logger");
const Sentry = require("@sentry/node");
const { ApiResponse } = require("@infamous-freight/shared");

const errorHandler = (err, req, res, next) => {
  // Generate correlation ID if missing
  const correlationId =
    req.correlationId ||
    `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Log error with context
  logger.error("Request failed", {
    errorCode: err.code || "INTERNAL_ERROR",
    errorMessage: err.message,
    statusCode: err.statusCode || 500,
    correlationId,
    path: req.path,
    method: req.method,
    userId: req.user?.sub,
    organizationId: req.auth?.organizationId,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Send to Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        correlationId,
        path: req.path,
        method: req.method,
      },
      contexts: {
        request: {
          url: req.url,
          method: req.method,
          headers: sanitizeHeaders(req.headers),
        },
        user: req.user
          ? {
              id: req.user.sub,
              email: req.user.email,
              organization: req.auth?.organizationId,
            }
          : undefined,
      },
    });
  }

  // Determine response status
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || "INTERNAL_ERROR";
  const errorMessage = err.message || "An unexpected error occurred";

  // Return error response
  res.status(statusCode).json(
    new ApiResponse({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? err.details : undefined,
        correlationId, // Always include for debugging
      },
    }),
  );
};

module.exports = errorHandler;

// Sanitize headers to remove sensitive info
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  ["authorization", "cookie", "x-api-key"].forEach((key) => {
    if (sanitized[key]) {
      sanitized[key] = "***";
    }
  });
  return sanitized;
}
```

### Installing Error Handler

```javascript
// In apps/api/src/server.js

const express = require("express");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ... all route handlers ...

// ERROR HANDLING MIDDLEWARE MUST BE LAST
app.use(errorHandler);

app.listen(3001);
```

## API Error Responses

### Success Response (ApiResponse)

```javascript
// When endpoint succeeds
res.status(200).json(
  new ApiResponse({
    success: true,
    data: { shipmentId: "SHP-123", status: "IN_TRANSIT" },
  }),
);

// Response body:
// {
//   "success": true,
//   "data": { "shipmentId": "SHP-123", "status": "IN_TRANSIT" },
//   "timestamp": "2026-02-14T12:34:56.789Z"
// }
```

### Error Response (ApiError)

```javascript
// Handled by error middleware
throw new ApiError(422, "VALIDATION_FAILED", "Validation errors in request", {
  fields: {
    shipmentDate: "Must be in future",
    destination: "Cannot be same as origin",
  },
});

// Response body (automatically generated):
// {
//   "success": false,
//   "error": {
//     "code": "VALIDATION_FAILED",
//     "message": "Validation errors in request",
//     "status": 422,
//     "details": {
//       "fields": {
//         "shipmentDate": "Must be in future",
//         "destination": "Cannot be same as origin"
//       }
//     },
//     "correlationId": "err-1707916800000-abc123",
//     "timestamp": "2026-02-14T12:34:56.789Z"
//   }
// }
```

## Using ApiResponse

### Import ApiResponse

```javascript
const { ApiResponse, ApiError } = require("@infamous-freight/shared");
```

### Sending Success

```javascript
// ✅ GOOD: Use ApiResponse
router.get("/shipments/:id", authenticate, async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
    });

    if (!shipment) {
      throw new ApiError(404, "NOT_FOUND", "Shipment not found");
    }

    res.json(
      new ApiResponse({
        success: true,
        data: shipment,
      }),
    );
  } catch (err) {
    next(err);
  }
});
```

### Client-Side Handling

```typescript
// apps/web/lib/api-client.ts

async function fetchShipment(id: string): Promise<Shipment | null> {
  const response = await fetch(`/api/shipments/${id}`);
  const result: ApiResponse<Shipment> = await response.json();

  if (!result.success) {
    // Handle error
    console.error(`Error (${result.error.code}): ${result.error.message}`);
    if (result.error.details) {
      console.error("Details:", result.error.details);
    }
    return null;
  }

  return result.data;
}
```

## Throwing vs Delegating

### ✅ CORRECT: Delegate to Error Handler

```javascript
router.post("/action", authenticate, async (req, res, next) => {
  try {
    if (!req.body.shipmentId) {
      // Create error with proper details
      const err = new ApiError(
        400,
        "MISSING_SHIPMENT_ID",
        "shipmentId is required in request body",
      );
      return next(err); // Delegate to error handler
    }

    const result = await service.doAction(req.body.shipmentId);
    res.json(new ApiResponse({ success: true, data: result }));
  } catch (err) {
    // All errors (expected & unexpected) go to error handler
    next(err);
  }
});
```

### ❌ WRONG: Sending Error Directly

```javascript
// ❌ BAD: Send error directly (bypasses error handler, logging, Sentry)
app.get("/action", (req, res) => {
  res.status(400).json({ error: "Bad request" });
});

// ❌ BAD: Throw without catching
app.get("/action", (req, res) => {
  throw new Error("Unhandled error"); // Will crash server!
});

// ❌ BAD: Send to res without delegating
app.get("/action", (req, res, next) => {
  const err = new Error("Something wrong");
  res.status(500).json({ error: err.message }); // Error missing from logs/Sentry
});
```

### ❌ WRONG: Catching and Re-Throwing

```javascript
// ❌ BAD: Catch and re-throw (unnecessary boilerplate)
try {
  await doSomething();
} catch (err) {
  throw err; // Just let it bubble up to try-catch above
}

// ✅ GOOD: Let catch block handle it
try {
  await doSomething();
} catch (err) {
  next(err); // Or just let it propagate
}
```

## Sentry Integration

### Manual Sentry Capture

```javascript
const Sentry = require("@sentry/node");

// Capture exception with context
Sentry.captureException(err, {
  level: "error", // critical | error | warning | info
  tags: {
    shipmentId: shipment.id,
    operationType: "export",
  },
  contexts: {
    shipment: {
      id: shipment.id,
      status: shipment.status,
      organizationId: req.auth.organizationId,
    },
  },
});

// Capture message (non-exception)
Sentry.captureMessage("Unusual activity detected", {
  level: "warning",
  tags: { alert: "rate_limit" },
});

// Add breadcrumb (diagnostic trail)
Sentry.addBreadcrumb({
  message: "Database connection established",
  level: "debug",
  data: { connectionTime: 45 },
});
```

### Setting User Context

```javascript
// In authentication middleware
Sentry.setUser({
  id: req.user.sub,
  email: req.user.email,
  username: req.user.name,
  ip_address: req.ip,
});

// Clear user on logout
Sentry.setUser(null);
```

## Testing Error Scenarios

### Jest Test for Error Handling

```javascript
const request = require("supertest");
const app = require("../src/server");

describe("Error Handling", () => {
  it("should return 400 for missing shipmentId", async () => {
    const response = await request(app)
      .post("/api/shipments")
      .send({}) // Missing shipmentId
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("MISSING_SHIPMENT_ID");
    expect(response.body.error.correlationId).toBeDefined();
  });

  it("should return 404 for non-existent shipment", async () => {
    const response = await request(app)
      .get("/api/shipments/INVALID-ID")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("should return 401 for missing JWT", async () => {
    const response = await request(app).get("/api/shipments");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("should include correlationId in error response", async () => {
    const response = await request(app).post("/api/shipments").send({});

    expect(response.body.error.correlationId).toMatch(/^err-\d+-[a-z0-9]+$/);
  });
});
```

## Common Error Patterns

### Pattern 1: Validation Error

```javascript
const { validationResult } = require("express-validator");

router.post(
  "/shipments",
  [
    body("origin").notEmpty().withMessage("Origin required"),
    body("destination").notEmpty().withMessage("Destination required"),
    body("weight").isNumeric().withMessage("Weight must be numeric"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(422, "VALIDATION_ERROR", "Input validation failed", {
          fields: Object.fromEntries(
            errors.array().map((e) => [e.path, e.msg]),
          ),
        });
      }

      const result = await service.create(req.body);
      res.json(new ApiResponse({ success: true, data: result }));
    } catch (err) {
      next(err);
    }
  },
);
```

### Pattern 2: Not Found with Fallback

```javascript
router.get("/shipments/:id", authenticate, async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
    });

    if (!shipment) {
      throw new ApiError(
        404,
        "SHIPMENT_NOT_FOUND",
        `Shipment with ID ${req.params.id} not found`,
      );
    }

    res.json(new ApiResponse({ success: true, data: shipment }));
  } catch (err) {
    next(err);
  }
});
```

### Pattern 3: Authorization Error

```javascript
function requireScope(...allowedScopes) {
  return (req, res, next) => {
    if (!req.user?.scopes) {
      throw new ApiError(403, "MISSING_SCOPES", "Missing authorization scopes");
    }

    const hasScope = allowedScopes.some((scope) =>
      req.user.scopes.includes(scope),
    );

    if (!hasScope) {
      throw new ApiError(
        403,
        "INSUFFICIENT_PERMISSIONS",
        `This action requires one of: ${allowedScopes.join(", ")}`,
        { requiredScopes: allowedScopes, userScopes: req.user.scopes },
      );
    }

    next();
  };
}
```

### Pattern 4: Race Condition Handling

```javascript
// Optimistic locking pattern
router.patch("/shipments/:id", authenticate, async (req, res, next) => {
  try {
    // Include version in WHERE clause
    const updated = await prisma.shipment.update({
      where: {
        id: req.params.id,
        version: req.body.version, // Optimistic lock
      },
      data: {
        status: req.body.status,
        version: { increment: 1 },
      },
    });

    res.json(new ApiResponse({ success: true, data: updated }));
  } catch (err) {
    if (err.code === "P2025") {
      // Prisma: Record not found
      throw new ApiError(
        409,
        "CONCURRENT_MODIFICATION",
        "Shipment was modified by another request",
      );
    }
    next(err);
  }
});
```

### Pattern 5: External Service Failure

```javascript
async function chargeWithRetry(paymentInfo, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await stripe.charges.create({
        amount: paymentInfo.amount,
        currency: "usd",
        source: paymentInfo.token,
      });
    } catch (err) {
      lastError = err;
      logger.warn(`Stripe charge failed (attempt ${i + 1}/${maxRetries})`, {
        error: err.message,
        paymentId: paymentInfo.id,
      });

      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
      }
    }
  }

  throw new ApiError(
    500,
    "PAYMENT_PROCESSING_FAILED",
    "Failed to process payment after multiple retries",
    { originalError: lastError.message },
  );
}
```

---

**Quick Reference**:

- Always use `next(err)` for error delegation
- Use `ApiError` for application errors with proper codes
- Error handler middleware catches & formats all errors
- Errors sent to Sentry automatically
- Include correlation IDs for debugging
- Test both success and error paths
