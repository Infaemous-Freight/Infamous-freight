const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const shipmentsRoutes = require('../../src/routes/shipments');
const { env } = require('../../src/config/env');

// Mock dependencies
jest.mock('../../src/db/prisma', () => ({
    prisma: {
        shipment: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        aiEvent: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

jest.mock('../../src/middleware/cache', () => ({
    cacheMiddleware: () => (_req, _res, next) => next(),
    invalidateCache: jest.fn(),
}));

jest.mock('../../src/services/websocket', () => ({
    emitShipmentUpdate: jest.fn(),
}));

const TEST_SECRET = process.env.JWT_SECRET || env.jwtSecret || 'test-secret';
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const { prisma } = require('../../src/db/prisma');

describe('Shipments Routes', () => {
    let app, validToken;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api', shipmentsRoutes);

        validToken = jwt.sign(
            { sub: 'user-123', email: 'test@example.com', scopes: ['shipments:read', 'shipments:write'] },
            TEST_SECRET
        );

        jest.clearAllMocks();
    });

    describe('GET /shipments', () => {
        it('should return shipments with valid authentication', async () => {
            const mockShipments = [
                {
                    id: '1',
                    reference: 'SHIP-001',
                    origin: 'New York',
                    destination: 'Los Angeles',
                    status: 'in_transit',
                    driver: { id: 'd1', name: 'John Doe', phone: '555-0100', status: 'active' },
                },
            ];
            prisma.shipment.findMany.mockResolvedValue(mockShipments);

            const response = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.shipments).toEqual(mockShipments);
        });

        it('should reject request without authentication', async () => {
            const response = await request(app).get('/api/shipments');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Missing bearer token');
        });

        it('should reject request without shipments:read scope', async () => {
            const noScopeToken = jwt.sign(
                { sub: 'user-123', scopes: [] },
                process.env.JWT_SECRET
            );

            const response = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${noScopeToken}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Insufficient scope');
        });

        it('should filter shipments by status', async () => {
            prisma.shipment.findMany.mockResolvedValue([]);

            await request(app)
                .get('/api/shipments?status=delivered')
                .set('Authorization', `Bearer ${validToken}`);

            expect(prisma.shipment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'delivered', userId: 'user-123' },
                })
            );
        });
    });

    describe('GET /shipments/:id', () => {
        it('should return shipment by ID', async () => {
            const mockShipment = {
                id: '1',
                reference: 'SHIP-001',
                origin: 'New York',
                destination: 'Los Angeles',
                userId: 'user-123',
                driver: null,
            };
            prisma.shipment.findUnique.mockResolvedValue(mockShipment);

            const response = await request(app)
                .get(`/api/shipments/${VALID_UUID}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.shipment).toEqual(mockShipment);
        });

        it('should return 404 when shipment not found', async () => {
            prisma.shipment.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .get(`/api/shipments/${VALID_UUID}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Shipment not found');
        });
    });

    describe('POST /shipments', () => {
        it('should create shipment with valid data', async () => {
            const newShipment = {
                reference: 'SHIP-002',
                origin: 'Chicago',
                destination: 'Houston',
            };
            const createdShipment = {
                id: '2',
                ...newShipment,
                status: 'created',
                driverId: null,
                driver: null,
            };

            prisma.$transaction.mockResolvedValue(createdShipment);

            const response = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${validToken}`)
                .send(newShipment);

            expect(response.status).toBe(201);
            expect(response.body.ok).toBe(true);
            expect(response.body.shipment).toMatchObject(createdShipment);
        });

        it('should require shipments:write scope', async () => {
            const readOnlyToken = jwt.sign(
                { sub: 'user-123', scopes: ['shipments:read'] },
                process.env.JWT_SECRET
            );

            const response = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${readOnlyToken}`)
                .send({
                    reference: 'SHIP-003',
                    origin: 'A',
                    destination: 'B',
                });

            expect(response.status).toBe(403);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Validation failed');
        });

        it('should handle duplicate reference error', async () => {
            const duplicateError = new Error('Duplicate');
            duplicateError.code = 'P2002';
            prisma.$transaction.mockRejectedValue(duplicateError);

            const response = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    reference: 'DUP-001',
                    origin: 'A',
                    destination: 'B',
                });

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Reference already exists');
        });
    });

    describe('PATCH /shipments/:id', () => {
        it('should update shipment status', async () => {
            const updatedShipment = {
                id: VALID_UUID,
                reference: 'SHIP-001',
                status: 'delivered',
                driver: null,
            };

            prisma.shipment.findUnique.mockResolvedValue({ id: VALID_UUID, userId: 'user-123' });
            prisma.$transaction.mockResolvedValue(updatedShipment);

            const response = await request(app)
                .patch(`/api/shipments/${VALID_UUID}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ status: 'delivered' });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.shipment.status).toBe('delivered');
        });

        it('should return 404 for non-existent shipment', async () => {
            prisma.shipment.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .patch(`/api/shipments/${VALID_UUID}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ status: 'delivered' });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /shipments/:id', () => {
        it('should delete shipment', async () => {
            prisma.shipment.findUnique.mockResolvedValue({ id: VALID_UUID, userId: 'user-123' });
            prisma.shipment.delete.mockResolvedValue({ id: VALID_UUID });

            const response = await request(app)
                .delete(`/api/shipments/${VALID_UUID}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.message).toContain('deleted');
        });

        it('should return 404 when deleting non-existent shipment', async () => {
            prisma.shipment.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .delete(`/api/shipments/${VALID_UUID}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /shipments/export/:format', () => {
        beforeEach(() => {
            prisma.shipment.findMany.mockResolvedValue([
                { id: '1', reference: 'SHIP-001', origin: 'A', destination: 'B', driver: null },
            ]);
        });

        it('should export shipments as CSV', async () => {
            const response = await request(app)
                .get('/api/shipments/export/csv')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/csv');
        });

        it('should export shipments as JSON', async () => {
            const response = await request(app)
                .get('/api/shipments/export/json')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('application/json');
        });

        it('should reject invalid export format', async () => {
            const response = await request(app)
                .get('/api/shipments/export/xml')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid format');
        });
    });
});
