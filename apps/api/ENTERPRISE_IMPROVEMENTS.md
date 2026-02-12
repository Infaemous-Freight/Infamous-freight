# Enterprise-Grade Code Quality Improvements

This document describes the new standardized utilities added to improve code quality, maintainability, and enterprise readiness.

## New Modules

### 1. Constants (`apps/api/src/config/constants.js`)

Centralized constants to eliminate magic values throughout the codebase.

**Categories:**

- **RATE_LIMITS**: Rate limiting configuration for different endpoints
- **PAGINATION**: Default pagination values
- **GEO_BOUNDS**: Geographic coordinate validation bounds
- **FEEDBACK**: Feedback system constants
- **BONUSES**: Referral and bonus system constants
- **ANALYTICS**: Analytics configuration
- **METRICS**: Metrics and caching configuration
- **SHIPMENT_PRIORITIES**: Valid shipment priority values
- **SHIPMENT_STATUSES**: Valid shipment status values
- **HTTP_STATUS**: HTTP status codes
- **ERROR_MESSAGES**: Standardized error messages
- **VALIDATION**: Validation rules and patterns
- **FILE_UPLOAD**: File upload limits and constraints

**Usage Example:**

```javascript
const { HTTP_STATUS, PAGINATION, ERROR_MESSAGES } = require('./config/constants');

// Instead of hardcoded values
res.status(200).json({ limit: 50, offset: 0 });

// Use constants
res.status(HTTP_STATUS.OK).json({ 
  limit: PAGINATION.DEFAULT_LIMIT, 
  offset: PAGINATION.DEFAULT_OFFSET 
});
```

### 2. Error Utilities (`apps/api/src/lib/errors.js`)

Standardized error classes and response utilities.

**Error Classes:**

- `ApiError`: Base error class with structured response
- `ValidationError`: For input validation failures (400)
- `AuthenticationError`: For authentication failures (401)
- `AuthorizationError`: For authorization failures (403)
- `NotFoundError`: For resource not found (404)
- `RateLimitError`: For rate limit exceeded (429)
- `ConflictError`: For resource conflicts (409)

**Utilities:**

- `createSuccessResponse(data, message, statusCode)`: Standard success response
- `createErrorResponse(error, statusCode)`: Standard error response
- `asyncHandler(fn)`: Wraps async route handlers to catch errors

**Usage Example:**

```javascript
const { NotFoundError, asyncHandler, createSuccessResponse } = require('./lib/errors');

router.get('/shipments/:id', asyncHandler(async (req, res) => {
  const shipment = await prisma.shipment.findUnique({ 
    where: { id: req.params.id } 
  });
  
  if (!shipment) {
    throw new NotFoundError('Shipment not found', 'shipment');
  }
  
  res.status(200).json(createSuccessResponse(shipment));
}));
```

### 3. Zod Validation (`apps/api/src/lib/validation.js`)

Type-safe input validation using Zod schemas.

**Available Schemas:**

- `uuidSchema`: UUID validation
- `emailSchema`: Email validation (RFC 5321 compliant)
- `phoneSchema`: Phone number validation
- `coordinatesSchema`: Lat/long validation
- `paginationSchema`: Pagination parameters
- `createShipmentSchema`: Shipment creation validation
- `updateShipmentSchema`: Shipment update validation
- `createUserSchema`: User creation validation
- `updateUserSchema`: User update validation
- `createPaymentSchema`: Payment creation validation
- `refundSchema`: Refund request validation
- `updateLocationSchema`: Location update validation
- `voiceCommandSchema`: Voice command validation
- `feedbackSchema`: Feedback submission validation
- `featureFlagSchema`: Feature flag configuration validation

**Validation Middleware:**

```javascript
const { validateRequest, createShipmentSchema } = require('./lib/validation');

// Validate request body
router.post('/shipments', 
  validateRequest(createShipmentSchema, 'body'),
  asyncHandler(async (req, res) => {
    // req.body is now validated and typed
    const shipment = await prisma.shipment.create({ data: req.body });
    res.status(201).json(createSuccessResponse(shipment));
  })
);

// Validate query parameters
router.get('/shipments',
  validateRequest(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { limit, offset } = req.query; // Validated and coerced
    // ...
  })
);
```

### 4. Enhanced Error Handler (`apps/api/src/middleware/errorHandler.js`)

Updated to support new error classes and provide consistent error responses.

**Features:**

- Handles `ApiError` instances with proper structure
- Integrates with Sentry for error tracking
- Provides detailed logs via Pino
- Masks sensitive errors in production
- Includes correlation IDs for tracing

## Migration Guide

### Step 1: Replace Magic Values

**Before:**

```javascript
router.get('/items', async (req, res) => {
  const limit = req.query.limit || 50;
  const offset = req.query.offset || 0;
  // ...
});
```

**After:**

```javascript
const { PAGINATION } = require('./config/constants');

router.get('/items', async (req, res) => {
  const limit = req.query.limit || PAGINATION.DEFAULT_LIMIT;
  const offset = req.query.offset || PAGINATION.DEFAULT_OFFSET;
  // ...
});
```

### Step 2: Add Input Validation

**Before:**

```javascript
router.post('/shipments', async (req, res) => {
  if (!req.body.trackingNumber) {
    return res.status(400).json({ error: 'Tracking number required' });
  }
  // ...
});
```

**After:**

```javascript
const { validateRequest, createShipmentSchema } = require('./lib/validation');
const { asyncHandler } = require('./lib/errors');

router.post('/shipments', 
  validateRequest(createShipmentSchema, 'body'),
  asyncHandler(async (req, res) => {
    // req.body is validated
    const shipment = await prisma.shipment.create({ data: req.body });
    res.status(201).json(createSuccessResponse(shipment));
  })
);
```

### Step 3: Use Standardized Error Handling

**Before:**

```javascript
router.get('/shipments/:id', async (req, res) => {
  try {
    const shipment = await prisma.shipment.findUnique({ 
      where: { id: req.params.id } 
    });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});
```

**After:**

```javascript
const { NotFoundError, asyncHandler, createSuccessResponse } = require('./lib/errors');

router.get('/shipments/:id', asyncHandler(async (req, res) => {
  const shipment = await prisma.shipment.findUnique({ 
    where: { id: req.params.id } 
  });
  
  if (!shipment) {
    throw new NotFoundError('Shipment not found');
  }
  
  res.json(createSuccessResponse(shipment));
}));
```

## Benefits

1. **Type Safety**: Zod provides runtime type checking and TypeScript inference
2. **Consistency**: Standardized error responses across all endpoints
3. **Maintainability**: Constants in one place, easy to update
4. **Security**: Input validation prevents injection attacks
5. **Debuggability**: Structured errors with correlation IDs
6. **Documentation**: Self-documenting through validation schemas
7. **Testing**: Easier to test with predictable responses

## Next Steps

1. Migrate existing routes to use new utilities
2. Add validation to all endpoints
3. Replace remaining magic values with constants
4. Add unit tests for validation schemas
5. Update API documentation with validation rules
