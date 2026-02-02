# API Middleware Integration Guide

**Infamous Freight Enterprises - Complete Middleware Stack Documentation**

## Overview

All API routes implement a comprehensive middleware stack for security, validation, rate limiting, and observability. This guide documents the complete integration patterns used throughout the API.

## Middleware Stack Architecture

### Execution Order

Routes follow this middleware execution order:

```javascript
router.METHOD(
  '/path',
  limiters.TYPE,        // 1. Rate limiting (optional, varies by route)
  authenticate,         // 2. JWT authentication (optional, for protected routes)
  requireScope(...),    // 3. Scope enforcement (optional, requires auth)
  [...validators],      // 4. Request validation (optional)
  handleValidationErrors, // 5. Validation error handler (required if validators used)
  auditLog,            // 6. Audit logging (recommended for all routes)
  async (req, res, next) => { // 7. Route handler
    try {
      // Business logic
      res.json({ ok: true, ... });
    } catch (err) {
      next(err);        // 8. Error delegation to global handler
    }
  }
);
```

### Global Error Handler

The global error handler is registered **last** in server.js:

```javascript
// All routes...
app.use('/api', healthRoutes);
app.use('/api', shipmentsRoutes);
// ... more routes

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (MUST BE LAST)
app.use(errorHandler);
```

## Rate Limiters

### Available Limiters

From `api/src/middleware/security.js`:

| Limiter | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| `limiters.general` | 15 min | 100 | General API operations |
| `limiters.auth` | 15 min | 5 | Login/authentication endpoints |
| `limiters.ai` | 1 min | 20 | AI commands, voice processing |
| `limiters.billing` | 15 min | 30 | Billing/payment operations |

### Rate Limiter Configuration

```javascript
const limiters = {
  general: rateLimit({
    windowMs: 15 * 60 * 1000,    // 15 minutes
    max: 100,                     // 100 requests per window
    standardHeaders: true,        // Return rate limit info in headers
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.sub || req.ip, // Per-user or per-IP
  }),
  // ... other limiters
};
```

### Rate Limiter Headers

Responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## Authentication & Scopes

### JWT Authentication

All protected routes require JWT bearer token:

```javascript
const { authenticate, requireScope } = require('../middleware/security');

router.get('/protected',
  authenticate,           // Extracts JWT, sets req.user
  requireScope('scope:name'), // Checks req.user.scopes
  async (req, res) => {
    console.log(req.user); // { sub, email, role, scopes: [...] }
  }
);
```

### JWT Payload Structure

```json
{
  "sub": "user-id-123",
  "email": "user@example.com",
  "role": "admin",
  "scopes": [
    "shipments:read",
    "shipments:write",
    "ai:command",
    "metrics:read"
  ],
  "iat": 1609459200,
  "exp": 1609545600
}
```

### Required Scopes by Route

| Route | Method | Scopes Required |
|-------|--------|-----------------|
| `/api/health/*` | GET | *None (public)* |
| `/api/shipments` | GET | `shipments:read` |
| `/api/shipments` | POST | `shipments:write` |
| `/api/shipments/:id` | PATCH | `shipments:write` |
| `/api/shipments/:id` | DELETE | `shipments:write` |
| `/api/shipments/export/:format` | GET | `shipments:read` |
| `/api/metrics/revenue/live` | GET | `metrics:read` |
| `/api/metrics/revenue/export` | GET | `metrics:export` |
| `/api/metrics/revenue/clear-cache` | POST | `admin` |
| `/api/ai/command` | POST | `ai:command` |
| `/api/ai/history` | GET | `ai:history` |
| `/api/billing/create-subscription` | POST | `billing:write` |
| `/api/billing/subscriptions` | GET | `billing:read` |
| `/api/billing/cancel-subscription/:id` | POST | `billing:write` |
| `/api/voice/ingest` | POST | `voice:ingest` |
| `/api/voice/command` | POST | `voice:command` |
| `/api/users/me` | GET | `users:read` |
| `/api/users/me` | PATCH | `users:write` |
| `/api/users` | GET | `admin` |

### Scope Enforcement Examples

**Single Scope:**

```javascript
router.get('/metrics',
  authenticate,
  requireScope('metrics:read'), // Must have 'metrics:read' scope
  async (req, res) => { ... }
);
```

**Multiple Scopes (ALL required):**

```javascript
router.post('/admin/action',
  authenticate,
  requireScope(['admin', 'actions:write']), // Must have BOTH scopes
  async (req, res) => { ... }
);
```

## Request Validation

### Available Validators

From `api/src/middleware/validation.js`:

```javascript
const {
  validateString,
  validateEmail,
  validatePhone,
  validateUUID,
  handleValidationErrors,
} = require('../middleware/validation');
```

### Validation Examples

**String Validation:**

```javascript
router.post('/shipments',
  [
    validateString('reference'),                    // Required string, max 1000 chars
    validateString('origin'),
    validateString('destination'),
    validateString('notes', { maxLength: 2000 }),   // Custom max length
    handleValidationErrors,
  ],
  async (req, res) => { ... }
);
```

**Email & Phone Validation:**

```javascript
router.post('/billing/create-subscription',
  [
    validateEmail('email'),           // Valid email format + normalization
    validatePhone('phone'),           // Valid phone number (any country)
    validateString('tier'),
    handleValidationErrors,
  ],
  async (req, res) => { ... }
);
```

**UUID Parameter Validation:**

```javascript
router.get('/shipments/:id',
  validateUUID('id'),                // Validate :id param is valid UUID
  handleValidationErrors,
  async (req, res) => { ... }
);
```

**Optional Fields:**

```javascript
router.patch('/users/me',
  [
    validateString('name', { maxLength: 100 }).optional(),  // Optional field
    validateEmail('email').optional(),
    handleValidationErrors,
  ],
  async (req, res) => { ... }
);
```

### Validation Error Response

When validation fails, returns 400 with field-level errors:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "msg": "Invalid email"
    },
    {
      "field": "reference",
      "msg": "reference must not be empty"
    }
  ]
}
```

## Audit Logging

### Usage

All routes should include `auditLog` for observability:

```javascript
const { auditLog } = require('../middleware/security');

router.get('/data',
  auditLog,  // Logs all requests with metadata
  async (req, res) => { ... }
);
```

### Log Output

Structured logs include:

```javascript
{
  method: 'POST',
  path: '/api/shipments',
  status: 201,
  duration: 145,        // Milliseconds
  user: 'user-id-123',  // From req.user.sub if authenticated
  ip: '192.168.1.1',
  auth: '***'          // Masked authorization header
}
```

### Log Levels

- `info`: All requests (successful)
- `error`: Failed requests (via errorHandler)
- `warn`: Rate limit hits, validation failures

## Complete Route Examples

### Example 1: Public Health Check

```javascript
// No auth, just audit logging
router.get('/health',
  auditLog,
  async (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  }
);
```

### Example 2: Protected Read Operation

```javascript
// Auth + scope + rate limiting + audit
router.get('/shipments',
  limiters.general,
  authenticate,
  requireScope('shipments:read'),
  auditLog,
  async (req, res, next) => {
    try {
      const shipments = await prisma.shipment.findMany();
      res.json({ ok: true, shipments });
    } catch (err) {
      next(err);  // Delegate to global error handler
    }
  }
);
```

### Example 3: Protected Write with Validation

```javascript
// Auth + scope + validation + rate limiting + audit
router.post('/shipments',
  limiters.general,
  authenticate,
  requireScope('shipments:write'),
  [
    validateString('reference'),
    validateString('origin'),
    validateString('destination'),
    handleValidationErrors,
  ],
  auditLog,
  async (req, res, next) => {
    try {
      const { reference, origin, destination } = req.body;
      const shipment = await prisma.shipment.create({
        data: { reference, origin, destination, status: 'created' }
      });
      res.status(201).json({ ok: true, shipment });
    } catch (err) {
      next(err);
    }
  }
);
```

### Example 4: AI Command with Heavy Rate Limiting

```javascript
// AI-specific rate limiter (20/min) + auth + scope + validation + audit
router.post('/ai/command',
  limiters.ai,           // More aggressive rate limit
  authenticate,
  requireScope('ai:command'),
  [
    validateString('command', { maxLength: 500 }),
    handleValidationErrors,
  ],
  auditLog,
  async (req, res, next) => {
    try {
      const { command } = req.body;
      const result = await aiService.processCommand(command);
      res.json({ ok: true, result });
    } catch (err) {
      next(err);
    }
  }
);
```

### Example 5: Admin-Only Operation

```javascript
// Admin scope + auth + rate limiting + audit
router.post('/metrics/revenue/clear-cache',
  limiters.general,
  authenticate,
  requireScope('admin'),  // Only users with 'admin' scope
  auditLog,
  async (req, res, next) => {
    try {
      metricsCache.clear();
      res.json({ ok: true, message: 'Cache cleared' });
    } catch (err) {
      next(err);
    }
  }
);
```

### Example 6: File Upload with Multer

```javascript
const multer = require('multer');
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.post('/voice/ingest',
  limiters.ai,
  authenticate,
  requireScope('voice:ingest'),
  upload.single('audio'),  // Multer before auditLog
  auditLog,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ ok: false, error: 'No file uploaded' });
      }
      const result = await processAudio(req.file);
      res.json({ ok: true, result });
    } catch (err) {
      next(err);
    }
  }
);
```

## Error Handling

### Global Error Handler

From `api/src/middleware/errorHandler.js`:

```javascript
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  
  // Structured logging
  console.error('Request failed', {
    method: req.method,
    path: req.path,
    status,
    error: err.message,
    stack: err.stack,
    user: req.user?.sub,
  });

  // Optional Sentry capture
  if (Sentry && process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: { path: req.path, method: req.method },
      user: req.user ? { id: req.user.sub } : undefined,
    });
  }

  // Return error to client
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
}
```

### Error Delegation

Always delegate errors with `next(err)`:

```javascript
router.get('/data', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);  // ✅ CORRECT: Delegate to global handler
  }
});

// ❌ WRONG: Don't handle errors manually
router.get('/data', async (req, res) => {
  try {
    const data = await fetchData();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message }); // Manual handling bypasses logging
  }
});
```

### Custom Error Status

Set `err.status` or `err.statusCode` for specific HTTP codes:

```javascript
router.get('/shipments/:id', async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id }
    });
    
    if (!shipment) {
      const err = new Error('Shipment not found');
      err.status = 404;
      throw err;
    }
    
    res.json({ ok: true, shipment });
  } catch (err) {
    next(err);  // Will return 404 if shipment not found
  }
});
```

## Testing Middleware

### Authentication Testing

**Without Token:**

```bash
curl http://localhost:4000/api/shipments
# Response: 401 { "error": "Missing bearer token" }
```

**With Invalid Token:**

```bash
curl -H "Authorization: Bearer invalid-token" http://localhost:4000/api/shipments
# Response: 401 { "error": "Invalid or expired token" }
```

**With Valid Token:**

```bash
TOKEN="eyJhbGc..."
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/shipments
# Response: 200 { "ok": true, "shipments": [...] }
```

### Scope Testing

**Missing Scope:**

```bash
# Token with scopes: ["users:read"]
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/shipments
# Response: 403 { "error": "Insufficient scope", "required": ["shipments:read"] }
```

### Rate Limiting Testing

**Exceeding Rate Limit:**

```bash
# Send 101 requests in 15 minutes
for i in {1..101}; do
  curl http://localhost:4000/api/shipments
done
# Request 101: 429 Too Many Requests
# Headers: X-RateLimit-Limit: 100, X-RateLimit-Remaining: 0
```

### Validation Testing

**Invalid Data:**

```bash
curl -X POST http://localhost:4000/api/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reference": ""}'
# Response: 400 {
#   "error": "Validation failed",
#   "details": [
#     { "field": "reference", "msg": "reference must not be empty" },
#     { "field": "origin", "msg": "origin must not be empty" }
#   ]
# }
```

## Environment Configuration

### Required Environment Variables

```bash
# JWT Authentication
JWT_SECRET=your-secret-key-here

# Rate Limiting (optional)
# Uses keyGenerator: req.user?.sub || req.ip

# Sentry Error Tracking (optional)
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production

# Voice Upload Limits
VOICE_MAX_FILE_SIZE_MB=10
```

## Best Practices

### ✅ DO

1. **Always delegate errors to global handler:**

   ```javascript
   try {
     // logic
   } catch (err) {
     next(err);  // ✅ Delegate
   }
   ```

2. **Use appropriate rate limiters:**
   - `limiters.ai` for AI/ML operations
   - `limiters.billing` for payment operations
   - `limiters.auth` for authentication endpoints
   - `limiters.general` for everything else

3. **Validate all user input:**

   ```javascript
   [
     validateString('field'),
     handleValidationErrors,  // ✅ Always include
   ]
   ```

4. **Add audit logging to all routes:**

   ```javascript
   router.METHOD('/path', auditLog, handler);  // ✅ Observability
   ```

5. **Enforce scopes on protected routes:**

   ```javascript
   router.get('/data',
     authenticate,
     requireScope('data:read'),  // ✅ Explicit scope
     handler
   );
   ```

### ❌ DON'T

1. **Don't handle errors manually:**

   ```javascript
   catch (err) {
     res.status(500).json({ error: err.message });  // ❌ Bypasses logging
   }
   ```

2. **Don't skip handleValidationErrors:**

   ```javascript
   [
     validateString('field'),
     // ❌ Missing handleValidationErrors - validation will pass through
   ]
   ```

3. **Don't use weak scopes:**

   ```javascript
   requireScope('admin')  // ❌ Too broad
   requireScope('shipments:write')  // ✅ Specific
   ```

4. **Don't skip rate limiting on expensive operations:**

   ```javascript
   router.post('/ai/command', handler);  // ❌ No rate limiting
   router.post('/ai/command', limiters.ai, handler);  // ✅ Appropriate limiter
   ```

## Summary

Complete middleware stack for all routes:

```javascript
const { limiters, authenticate, requireScope, auditLog } = require('../middleware/security');
const { validateString, handleValidationErrors } = require('../middleware/validation');

router.METHOD('/path',
  limiters.TYPE,              // Rate limiting (general/auth/ai/billing)
  authenticate,               // JWT auth (if protected)
  requireScope('scope:name'), // Scope enforcement (if protected)
  [
    validateString('field'),  // Validation (if needed)
    handleValidationErrors,
  ],
  auditLog,                   // Audit logging (always)
  async (req, res, next) => {
    try {
      // Business logic
      res.json({ ok: true, data });
    } catch (err) {
      next(err);              // Error delegation (always)
    }
  }
);
```

**Key Points:**

- ✅ Rate limiting per route type
- ✅ JWT authentication with scope enforcement
- ✅ Request validation with field-level errors
- ✅ Audit logging for all requests
- ✅ Global error handler with Sentry integration
- ✅ Consistent error response format

For questions or issues, see [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) or contact the development team.
