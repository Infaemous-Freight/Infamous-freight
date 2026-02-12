# API Versioning & Backwards Compatibility Guide

## Overview

This guide implements API versioning to maintain backwards compatibility while introducing new features.

## Architecture

```
/api/v1/           → Stable API (no breaking changes)
/api/v2/           → New features (breaking changes allowed)
/api/v3/           → Future versions
```

## Implementation

### 1. API Version Router

**File: `apps/api/src/middleware/apiVersioning.js`**

```javascript
const express = require('express');

/**
 * API versioning middleware
 * Routes to different handlers based on Accept header or URL prefix
 */
function versioningMiddleware(req, res, next) {
  // Extract version from URL path: /api/v1/...
  const urlMatch = req.path.match(/^\/api\/v(\d+)\//);
  
  // Or from Accept header: application/vnd.infamousfreight.v1+json
  const headerMatch = req.get('Accept')?.match(/vnd\.infamousfreight\.v(\d+)/);

  const version = urlMatch?.[1] || headerMatch?.[1] || '1';
  req.apiVersion = parseInt(version, 10);
  req.isLegacyVersion = req.apiVersion < 2;

  console.info(`API Request: v${req.apiVersion} ${req.method} ${req.path}`);
  next();
}

/**
 * Deprecation warning middleware
 */
function deprecationWarning(version, message) {
  return (req, res, next) => {
    if (req.apiVersion <= version) {
      res.set('Deprecation', 'true');
      res.set('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString());
      res.set('Warning', `299 - "${message}"`);
    }
    next();
  };
}

module.exports = {
  versioningMiddleware,
  deprecationWarning,
};
```

### 2. Version-Specific Routes

**File: `apps/api/src/routes/v1/shipments.js`**

```javascript
const express = require('express');
const router = express.Router();

// v1 endpoints (stable)
router.get('/shipments', async (req, res) => {
  const shipments = await prisma.shipment.findMany({
    select: {
      id: true,
      status: true,
      origin: true,
      destination: true,
      createdAt: true,
      // V1: Basic fields only
    },
  });
  res.json(shipments);
});

module.exports = router;
```

**File: `apps/api/src/routes/v2/shipments.js`**

```javascript
const express = require('express');
const router = express.Router();

// v2 endpoints (with new features)
router.get('/shipments', async (req, res) => {
  const shipments = await prisma.shipment.findMany({
    include: {
      driver: true,
      carrier: true,
      // V2: Enhanced data with relationships
    },
  });
  res.json(shipments);
});

// New v2 endpoint
router.get('/shipments/analytics/real-time', async (req, res) => {
  // V2: New feature not in v1
  const analytics = await getRealtimeAnalytics();
  res.json(analytics);
});

module.exports = router;
```

### 3. Mount Versioned Routes

**File: `apps/api/src/server.js`**

```javascript
const express = require('express');
const { versioningMiddleware, deprecationWarning } = require('./middleware/apiVersioning');

const app = express();

// Apply versioning middleware
app.use('/api', versioningMiddleware);

// Mount v1 routes
const v1Shipments = require('./routes/v1/shipments');
const v1Users = require('./routes/v1/users');

app.use('/api/v1', deprecationWarning(1, 'API v1 deprecated. Use v2.'), v1Shipments);
app.use('/api/v1', deprecationWarning(1, 'API v1 deprecated. Use v2.'), v1Users);

// Mount v2 routes (no deprecation warning)
const v2Shipments = require('./routes/v2/shipments');
const v2Users = require('./routes/v2/users');

app.use('/api/v2', v2Shipments);
app.use('/api/v2', v2Users);

// Mount v3 routes (future)
// app.use('/api/v3', v3Routes);

module.exports = app;
```

## Backwards Compatibility Strategy

### 1. Graceful Degradation

```javascript
// Handler supports both v1 and v2
router.get('/shipments/:id', async (req, res) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: req.params.id },
  });

  if (req.apiVersion === 1) {
    // Return only v1 fields
    res.json({
      id: shipment.id,
      status: shipment.status,
      origin: shipment.origin,
      destination: shipment.destination,
    });
  } else {
    // Return full v2 response
    res.json(shipment);
  }
});
```

### 2. Schema Mapping

```javascript
/**
 * Convert response based on API version
 */
function mapResponse(data, version) {
  const baseResponse = {
    id: data.id,
    status: data.status,
    createdAt: data.createdAt,
  };

  if (version >= 2) {
    return {
      ...baseResponse,
      driver: data.driver,
      analytics: data.analytics,
    };
  }

  return baseResponse;
}
```

### 3. Request Validation Per Version

```javascript
const { body, validationResult } = require('express-validator');

const validateShipmentV1 = [
  body('origin').notEmpty().trim(),
  body('destination').notEmpty().trim(),
];

const validateShipmentV2 = [
  ...validateShipmentV1,
  body('driverId').isUUID().optional(),
  body('weight').isNumeric().optional(),
];

router.post('/shipments', (req, res, next) => {
  const rules = req.apiVersion === 1 ? validateShipmentV1 : validateShipmentV2;
  return rules;
}, validateHandler, handler);
```

## Deprecation Process

### 1. Announce Deprecation

```javascript
// Set deprecation headers
res.set('Deprecation', 'true');
res.set('Sunset', 'Sun, 15 Apr 2024 23:59:59 GMT');
res.set('Warning', '299 - "v1 API deprecated. Use v2 instead."');
```

### 2. Version Sunset Timeline

```
Day 0: Announce deprecation (30 days notice)
Day 30: Remove from documentation
Day 60: Return 410 Gone responses
Day 90: Completely remove endpoint
```

### 3. Migration Guide

Create documentation for clients:

```markdown
# Migration Guide: v1 to v2

## Breaking Changes

### 1. Response Format

**v1:**
```json
{
  "id": "123",
  "status": "active"
}
```

**v2:**

```json
{
  "id": "123",
  "status": "active",
  "driver": { "id": "456", "name": "John" }
}
```

### 2. New Fields

- `driver`: Driver object (v2 only)
- `analytics`: Shipment analytics (v2 only)

### 3. Removed Fields

None. All v1 fields exist in v2.

## Migration Steps

1. Update client to use Accept header: `Accept: application/vnd.infamousfreight.v2+json`
2. Or change URL from `/api/v1/` to `/api/v2/`
3. Handle new response fields in client code
4. Test thoroughly before deploying

```

## Testing

### Version-Specific Tests

```javascript
describe('API Versioning', () => {
  test('v1 returns basic shipment fields', async () => {
    const res = await request(app)
      .get('/api/v1/shipments/123')
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('status');
    expect(res.body).not.toHaveProperty('driver');
  });

  test('v2 returns enhanced shipment fields', async () => {
    const res = await request(app)
      .get('/api/v2/shipments/123')
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('driver');
  });

  test('v1 endpoint returns deprecation headers', async () => {
    const res = await request(app)
      .get('/api/v1/shipments')
      .expect(200);

    expect(res.get('Deprecation')).toBe('true');
    expect(res.get('Warning')).toBeTruthy();
  });
});
```

## Monitoring

### Track API Version Usage

```javascript
router.use(async (req, res, next) => {
  const version = req.apiVersion;
  await analytics.trackAPIVersion(version);
  next();
});

// Analytics endpoint
router.get('/admin/api/versions', async (req, res) => {
  const stats = await prisma.apiMetrics.groupBy({
    by: ['version'],
    _count: true,
  });
  res.json(stats);
});
```

## Best Practices

1. **Semantic Versioning**: Use MAJOR.MINOR.PATCH
2. **Clear Deprecation**: Always warn clients 30+ days before removal
3. **Minimal Breaking Changes**: Keep v1 and v2 as similar as possible
4. **Documentation**: Maintain separate docs for each version
5. **Testing**: Test each version independently
6. **Migration Support**: Provide migration guides for clients

## References

- [API Versioning Best Practices](https://cloud.google.com/architecture/versioning-a-rest-api)
- [Semantic Versioning](https://semver.org/)
- [RFC 7231 - Accept Header](https://tools.ietf.org/html/rfc7231#section-5.3.5)
