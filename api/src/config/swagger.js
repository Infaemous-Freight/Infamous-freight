const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Infamous Freight Enterprises API',
            version: '1.0.0',
            description: 'Complete API documentation for Infamous Freight Enterprises logistics platform',
            contact: {
                name: 'API Support',
                email: 'support@infamous-freight.com',
            },
            license: {
                name: 'Proprietary',
            },
        },
        servers: [
            {
                url: 'https://infamous-freight-api.fly.dev',
                description: 'Production server',
            },
            {
                url: 'http://localhost:4000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token for authentication. Scopes: shipments:read, shipments:write, ai:command, voice:ingest, voice:command, billing:read, billing:write',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message',
                        },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    msg: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                Shipment: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        trackingNumber: { type: 'string' },
                        origin: { type: 'string' },
                        destination: { type: 'string' },
                        status: {
                            type: 'string',
                            enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
                        },
                        driverId: { type: 'string', format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        role: {
                            type: 'string',
                            enum: ['admin', 'driver', 'customer'],
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        uptime: { type: 'number' },
                        timestamp: { type: 'number' },
                        status: {
                            type: 'string',
                            enum: ['ok', 'degraded'],
                        },
                        database: {
                            type: 'string',
                            enum: ['connected', 'disconnected'],
                        },
                    },
                },
                AICommandRequest: {
                    type: 'object',
                    required: ['command'],
                    properties: {
                        command: {
                            type: 'string',
                            description: 'Natural language command to execute',
                            example: 'Show me shipments for driver John Doe',
                        },
                        context: {
                            type: 'object',
                            description: 'Additional context for the command',
                        },
                    },
                },
                AICommandResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                response: { type: 'string' },
                                action: { type: 'string' },
                                results: { type: 'object' },
                            },
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
    apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
