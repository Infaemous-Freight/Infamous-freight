# API Documentation with Swagger/OpenAPI

## Quick Start

### 1. Install Dependencies

```bash
npm install swagger-jsdoc swagger-ui-express
```

### 2. Setup Swagger

**File: `api/src/config/swagger.js`**

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Infamous Freight Enterprises API',
      version: '2.2.0',
      description: 'REST API for freight management platform',
      contact: {
        name: 'API Support',
        email: 'support@infamousfreight.com',
        url: 'https://infamousfreight.com',
      },
      license: {
        name: 'Proprietary',
        url: 'https://infamousfreight.com/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Development Server',
      },
      {
        url: 'https://api.infamousfreight.com/api',
        description: 'Production Server',
      },
      {
        url: 'https://api-staging.infamousfreight.com/api',
        description: 'Staging Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token authentication',
        },
      },
      schemas: {
        Shipment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Shipment ID',
            },
            status: {
              type: 'string',
              enum: [
                'pending',
                'confirmed',
                'in_transit',
                'delivered',
                'cancelled',
              ],
              description: 'Shipment status',
            },
            origin: {
              type: 'string',
              description: 'Origin address',
            },
            destination: {
              type: 'string',
              description: 'Destination address',
            },
            weight: {
              type: 'number',
              description: 'Weight in kg',
            },
            driverId: {
              type: 'string',
              format: 'uuid',
              description: 'Assigned driver ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: [
            'id',
            'status',
            'origin',
            'destination',
            'createdAt',
          ],
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            name: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'driver'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            statusCode: {
              type: 'integer',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/routes/v1/*.js',
    './src/routes/v2/*.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
```

### 3. Mount Swagger UI

**File: `api/src/server.js`**

```javascript
const { specs, swaggerUi } = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Infamous Freight API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    filter: true,
  },
}));
```

## Documenting Endpoints

### Example: Shipments Endpoint

**File: `api/src/routes/shipments.js`**

```javascript
const express = require('express');
const router = express.Router();
const { authenticate, requireScope, limiters } = require('../middleware/security');

/**
 * @swagger
 * /v2/shipments:
 *   get:
 *     summary: List all shipments
 *     description: Retrieve a paginated list of shipments with optional filtering
 *     operationId: listShipments
 *     tags:
 *       - Shipments
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Results per page
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_transit, delivered, cancelled]
 *         description: Filter by status
 *       - name: driverId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shipments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shipment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/shipments',
  limiters.general,
  authenticate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const skip = (page - 1) * limit;

      const shipments = await prisma.shipment.findMany({
        where: {
          ...(req.query.status && { status: req.query.status }),
          ...(req.query.driverId && { driverId: req.query.driverId }),
        },
        skip,
        take: limit,
      });

      const total = await prisma.shipment.count();

      res.json({
        data: shipments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /v2/shipments:
 *   post:
 *     summary: Create a new shipment
 *     description: Create a new shipment record
 *     operationId: createShipment
 *     tags:
 *       - Shipments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *             properties:
 *               origin:
 *                 type: string
 *                 description: Origin address
 *               destination:
 *                 type: string
 *                 description: Destination address
 *               weight:
 *                 type: number
 *                 description: Weight in kg
 *               driverId:
 *                 type: string
 *                 format: uuid
 *                 description: Driver assignment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Shipment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shipment'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/shipments',
  limiters.general,
  authenticate,
  requireScope('shipment:create'),
  async (req, res, next) => {
    try {
      const shipment = await prisma.shipment.create({
        data: {
          origin: req.body.origin,
          destination: req.body.destination,
          weight: req.body.weight,
          driverId: req.body.driverId,
          status: 'pending',
        },
      });

      res.status(201).json(shipment);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /v2/shipments/{id}:
 *   get:
 *     summary: Get shipment details
 *     operationId: getShipment
 *     tags:
 *       - Shipments
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shipment ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shipment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shipment'
 *       404:
 *         description: Shipment not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/shipments/:id',
  limiters.general,
  authenticate,
  async (req, res, next) => {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: req.params.id },
      });

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      res.json(shipment);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
```

## Access Documentation

- **Swagger UI**: `http://localhost:4000/api-docs`
- **OpenAPI JSON**: `http://localhost:4000/api-docs.json`

## Best Practices

1. **Keep docs in sync**: Document code and update swagger together
2. **Use consistent schemas**: Define reusable components
3. **Document errors**: Include all possible error responses
4. **Provide examples**: Add real-world request/response examples
5. **Security first**: Document all authentication/authorization requirements

## Export OpenAPI Spec

```bash
# Download JSON spec
curl http://localhost:4000/api-docs.json > openapi.json

# Generate client SDKs
openapi-generator-cli generate -i openapi.json -g typescript-axios -o ./client-sdk
```

## References

- [Swagger/OpenAPI Documentation](https://swagger.io/)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)
- [swagger-jsdoc GitHub](https://github.com/Surnet/swagger-jsdoc)
