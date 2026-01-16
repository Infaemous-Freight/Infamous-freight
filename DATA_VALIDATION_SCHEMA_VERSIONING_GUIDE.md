# Data Validation & Schema Versioning Guide

## 1. Comprehensive Input Validation with Zod

### Installation

```bash
pnpm add zod
```

### Schema Definitions

**File: `api/src/schemas/shipment.schema.js`**

```javascript
const { z } = require('zod');

// Base shipment schema
const shipmentBaseSchema = z.object({
  origin: z
    .string()
    .min(3, 'Origin must be at least 3 characters')
    .max(200, 'Origin must not exceed 200 characters'),
  destination: z
    .string()
    .min(3, 'Destination must be at least 3 characters')
    .max(200, 'Destination must not exceed 200 characters'),
  weight: z
    .number()
    .positive('Weight must be positive')
    .max(50000, 'Weight exceeds maximum'),
  contents: z
    .string()
    .optional()
    .default(''),
  priorityLevel: z
    .enum(['normal', 'urgent', 'express'])
    .default('normal'),
});

// Schema for creating shipment
const createShipmentSchema = shipmentBaseSchema.extend({
  driverId: z.string().uuid('Invalid driver ID').optional(),
});

// Schema for updating shipment
const updateShipmentSchema = shipmentBaseSchema.partial().extend({
  status: z
    .enum([
      'pending',
      'confirmed',
      'in_transit',
      'delivered',
      'cancelled',
    ])
    .optional(),
});

// Schema for list query
const shipmentListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1))
    .pipe(z.number().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 50))
    .pipe(z.number().positive().max(100)),
  status: z
    .enum([
      'pending',
      'confirmed',
      'in_transit',
      'delivered',
      'cancelled',
    ])
    .optional(),
  driverId: z.string().uuid().optional(),
  sortBy: z
    .enum(['createdAt', 'weight', 'destination'])
    .default('createdAt'),
  order: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

module.exports = {
  createShipmentSchema,
  updateShipmentSchema,
  shipmentListQuerySchema,
};
```

### Validation Middleware

**File: `api/src/middleware/zodValidation.js`**

```javascript
const { ZodError } = require('zod');

// Validate request body
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
}

// Validate query parameters
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Validate route parameters
function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.validatedParams = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid path parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

module.exports = { validateBody, validateQuery, validateParams };
```

### Using Validation in Routes

**File: `api/src/routes/shipments.js`**

```javascript
const { validateBody, validateQuery, validateParams } = require(
  '../middleware/zodValidation'
);
const {
  createShipmentSchema,
  updateShipmentSchema,
  shipmentListQuerySchema,
} = require('../schemas/shipment.schema');

// List shipments
router.get(
  '/shipments',
  limiters.general,
  authenticate,
  validateQuery(shipmentListQuerySchema),
  async (req, res, next) => {
    try {
      const { page, limit, status, driverId, sortBy, order } =
        req.validatedQuery;

      const shipments = await prisma.shipment.findMany({
        where: {
          ...(status && { status }),
          ...(driverId && { driverId }),
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: order },
      });

      const total = await prisma.shipment.count({
        where: {
          ...(status && { status }),
          ...(driverId && { driverId }),
        },
      });

      res.json({
        data: shipments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// Create shipment
router.post(
  '/shipments',
  limiters.general,
  authenticate,
  requireScope('shipment:create'),
  validateBody(createShipmentSchema),
  async (req, res, next) => {
    try {
      const shipment = await prisma.shipment.create({
        data: {
          ...req.validatedBody,
          userId: req.user.sub,
        },
      });

      res.status(201).json(shipment);
    } catch (err) {
      next(err);
    }
  }
);

// Update shipment
router.put(
  '/shipments/:id',
  limiters.general,
  authenticate,
  requireScope('shipment:write'),
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateShipmentSchema),
  async (req, res, next) => {
    try {
      const shipment = await prisma.shipment.update({
        where: { id: req.validatedParams.id },
        data: req.validatedBody,
      });

      res.json(shipment);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
```

## 2. Schema Versioning

### Versioned Schemas

**File: `api/src/schemas/versions/index.js`**

```javascript
// Version 1 - Basic fields
const v1Schema = {
  create: z.object({
    origin: z.string().min(3),
    destination: z.string().min(3),
    weight: z.number().positive(),
  }),
  response: z.object({
    id: z.string(),
    origin: z.string(),
    destination: z.string(),
    weight: z.number(),
    status: z.string(),
    createdAt: z.date(),
  }),
};

// Version 2 - Extended fields
const v2Schema = {
  create: v1Schema.create.extend({
    contents: z.string().optional(),
    priorityLevel: z.enum(['normal', 'urgent', 'express']),
    driverId: z.string().uuid().optional(),
  }),
  response: v1Schema.response.extend({
    contents: z.string(),
    priorityLevel: z.string(),
    driver: z.object({
      id: z.string(),
      name: z.string(),
    }).optional(),
    estimatedDelivery: z.date().optional(),
  }),
};

// Version 3 - Advanced fields
const v3Schema = {
  create: v2Schema.create.extend({
    references: z.string().array().optional(),
    metadata: z.record(z.any()).optional(),
    insuranceRequired: z.boolean().optional(),
  }),
  response: v2Schema.response.extend({
    references: z.string().array(),
    metadata: z.record(z.any()),
    insuranceRequired: z.boolean(),
    trackingUpdates: z.object({
      timestamp: z.date(),
      location: z.string(),
      status: z.string(),
    }).array(),
  }),
};

module.exports = {
  v1: v1Schema,
  v2: v2Schema,
  v3: v3Schema,
};
```

### Schema Conversion Middleware

**File: `api/src/middleware/schemaVersion.js`**

```javascript
const schemas = require('../schemas/versions');

// Get schema for version
function getSchema(version, operation) {
  const versionKey = `v${version}`;
  const schema = schemas[versionKey]?.[operation];

  if (!schema) {
    throw new Error(`Schema not found for version ${version}, operation ${operation}`);
  }

  return schema;
}

// Validate against versioned schema
function validateVersionedBody(operation) {
  return (req, res, next) => {
    try {
      const version = req.apiVersion || 2; // Default to v2
      const schema = getSchema(version, operation);

      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          version: req.apiVersion,
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Format response based on version
function formatVersionedResponse(data, operation) {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function(body) {
      try {
        const version = req.apiVersion || 2;
        const schema = getSchema(version, operation);

        // Validate response matches schema
        const validated = schema.parse(body);

        res.setHeader('API-Version', version);
        return originalJson.call(this, validated);
      } catch (error) {
        console.error('Response validation failed', error);
        return originalJson.call(this, body);
      }
    };

    next();
  };
}

module.exports = {
  getSchema,
  validateVersionedBody,
  formatVersionedResponse,
};
```

### Using Versioned Schemas

```javascript
const { validateVersionedBody, formatVersionedResponse } =
  require('../middleware/schemaVersion');

// API route with schema versioning
router.post(
  '/v2/shipments',
  authenticate,
  validateVersionedBody('create'),
  formatVersionedResponse(null, 'response'),
  async (req, res, next) => {
    try {
      const shipment = await prisma.shipment.create({
        data: {
          ...req.validatedBody,
          userId: req.user.sub,
        },
      });

      res.status(201).json(shipment);
    } catch (err) {
      next(err);
    }
  }
);
```

## 3. Schema Migration

### Migration Framework

**File: `api/src/services/schemaMigration.js`**

```javascript
class SchemaMigration {
  constructor() {
    this.migrations = new Map();
  }

  // Register migration from one version to another
  registerMigration(fromVersion, toVersion, migrationFn) {
    const key = `${fromVersion}->${toVersion}`;
    this.migrations.set(key, migrationFn);
  }

  // Migrate data from one version to another
  async migrate(data, fromVersion, toVersion) {
    if (fromVersion === toVersion) return data;

    let current = data;

    // Find path from fromVersion to toVersion
    for (
      let v = fromVersion;
      v < toVersion;
      v++
    ) {
      const key = `${v}->${v + 1}`;
      const migrationFn = this.migrations.get(key);

      if (!migrationFn) {
        throw new Error(`No migration found from v${v} to v${v + 1}`);
      }

      current = await migrationFn(current);
    }

    return current;
  }
}

const migration = new SchemaMigration();

// Register v1 -> v2 migration
migration.registerMigration(1, 2, async (data) => {
  return {
    ...data,
    contents: data.contents || '',
    priorityLevel: 'normal',
  };
});

// Register v2 -> v3 migration
migration.registerMigration(2, 3, async (data) => {
  return {
    ...data,
    references: [],
    metadata: {},
    insuranceRequired: false,
  };
});

module.exports = migration;
```

## 4. Real-Time Validation

### Form Validation Hook (Frontend)

**File: `web/hooks/useValidation.ts`**

```typescript
import { z } from 'zod';

interface ValidationError {
  field: string;
  message: string;
}

export function useValidation<T>(schema: z.ZodSchema) {
  const validate = (data: unknown): { valid: boolean; errors: ValidationError[] } => {
    try {
      schema.parse(data);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return { valid: false, errors: [{ field: '', message: 'Unknown error' }] };
    }
  };

  return { validate };
}
```

## 5. Testing Validation

**File: `api/src/routes/__tests__/validation.test.js`**

```javascript
describe('Data Validation', () => {
  describe('Shipment Schema', () => {
    it('should validate valid shipment', async () => {
      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          origin: 'New York',
          destination: 'Los Angeles',
          weight: 100,
        });

      expect(response.status).toBe(201);
    });

    it('should reject invalid weight', async () => {
      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          origin: 'New York',
          destination: 'Los Angeles',
          weight: -100,
        });

      expect(response.status).toBe(400);
      expect(response.body.details[0].field).toBe('weight');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          origin: 'New York',
        });

      expect(response.status).toBe(400);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should coerce and validate query params', async () => {
      const response = await request(app)
        .get('/api/shipments?page=1&limit=50')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(50);
    });
  });

  describe('Schema Versioning', () => {
    it('should validate v2 schema with extended fields', async () => {
      const response = await request(app)
        .post('/api/v2/shipments')
        .set('Authorization', `Bearer ${token}`)
        .set('API-Version', '2')
        .send({
          origin: 'New York',
          destination: 'Los Angeles',
          weight: 100,
          priorityLevel: 'urgent',
          contents: 'Electronics',
        });

      expect(response.status).toBe(201);
      expect(response.body.priorityLevel).toBe('urgent');
    });

    it('should validate v3 schema with metadata', async () => {
      const response = await request(app)
        .post('/api/v3/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          origin: 'New York',
          destination: 'Los Angeles',
          weight: 100,
          priorityLevel: 'express',
          contents: 'Documents',
          metadata: { clientRef: 'ABC123' },
          insuranceRequired: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.metadata).toEqual({ clientRef: 'ABC123' });
    });
  });

  describe('Custom Validation Rules', () => {
    it('should validate custom enum values', async () => {
      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          origin: 'New York',
          destination: 'Los Angeles',
          weight: 100,
          priorityLevel: 'invalid',
        });

      expect(response.status).toBe(400);
    });
  });
});
```

## 6. Documentation

### OpenAPI Schema Integration

```javascript
/**
 * @swagger
 * /v2/shipments:
 *   post:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *               - weight
 *             properties:
 *               origin:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: 'New York, NY'
 *               destination:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: 'Los Angeles, CA'
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 50000
 *                 example: 150
 *               priorityLevel:
 *                 type: string
 *                 enum: ['normal', 'urgent', 'express']
 *                 default: 'normal'
 *             responses:
 *               201:
 *                 description: Shipment created
 *               400:
 *                 description: Validation error
 *                 content:
 *                   application/json:
 *                     schema:
 *                       type: object
 *                       properties:
 *                         error:
 *                           type: string
 *                         code:
 *                           type: string
 *                         details:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               field:
 *                                 type: string
 *                               message:
 *                                 type: string
 */
```

## Best Practices

1. **Validate early** - Validate at the entry point
2. **Type safety** - Use Zod for runtime type checking
3. **Detailed errors** - Provide field-level error messages
4. **Schema versioning** - Support multiple API versions
5. **Document schemas** - Keep OpenAPI specs in sync
6. **Test edge cases** - Test boundary conditions
7. **Consistent messages** - Use same error messages across API

