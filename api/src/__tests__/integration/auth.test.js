/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Integration Tests for Authentication & Authorization
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app'); // Adjust path based on your Express app export

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Authentication & Authorization Integration Tests', () => {
    let validToken;
    let driverToken;
    let shipperToken;

    beforeAll(() => {
        // Create valid JWT tokens for different roles
        validToken = jwt.sign(
            {
                sub: 'user-123',
                email: 'test@example.com',
                role: 'shipper',
                scopes: ['shipment:create', 'shipment:read'],
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        driverToken = jwt.sign(
            {
                sub: 'driver-456',
                email: 'driver@example.com',
                role: 'driver',
                scopes: ['job:accept', 'job:update', 'location:update'],
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        shipperToken = jwt.sign(
            {
                sub: 'shipper-789',
                email: 'shipper@example.com',
                role: 'shipper',
                scopes: ['shipment:create', 'shipment:read', 'billing:manage'],
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    describe('Bearer Token Authentication', () => {
        it('should accept valid Bearer token in Authorization header', async () => {
            const response = await request(app)
                .get('/api/health')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.body.status).toBe('ok');
        });

        it('should reject missing Authorization header', async () => {
            const response = await request(app)
                .post('/api/shipments')
                .send({ pickup: 'Location A', dropoff: 'Location B' })
                .expect(401);

            expect(response.body.error).toMatch(/Missing bearer token|Invalid/i);
        });

        it('should reject malformed Bearer token', async () => {
            const response = await request(app)
                .get('/api/shipments')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.error).toMatch(/Invalid|expired/i);
        });

        it('should reject expired tokens', async () => {
            const expiredToken = jwt.sign(
                { sub: 'user-123', email: 'test@example.com' },
                JWT_SECRET,
                { expiresIn: '-1h' }
            );

            const response = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);

            expect(response.body.error).toMatch(/expired/i);
        });

        it('should accept alternative x-user-id header in dev mode', async () => {
            if (process.env.NODE_ENV === 'development') {
                const response = await request(app)
                    .get('/api/shipments')
                    .set('x-user-id', 'dev-user-123')
                    .expect(200);

                expect(response.body).toBeDefined();
            }
        });
    });

    describe('Scope-Based Authorization', () => {
        it('should allow driver to accept jobs with job:accept scope', async () => {
            const response = await request(app)
                .post('/api/jobs/job-123/accept')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({})
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should reject driver accepting job without job:accept scope', async () => {
            const limitedToken = jwt.sign(
                { sub: 'driver-456', role: 'driver', scopes: ['location:update'] },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .post('/api/jobs/job-123/accept')
                .set('Authorization', `Bearer ${limitedToken}`)
                .expect(403);

            expect(response.body.error).toMatch(/Insufficient|scope/i);
        });

        it('should allow shipper to create shipments with shipment:create scope', async () => {
            const response = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({
                    pickup: 'Location A',
                    dropoff: 'Location B',
                    distance: 10,
                    timeMinutes: 30,
                })
                .expect(200);

            expect(response.body.data).toBeDefined();
        });

        it('should enforce multiple required scopes', async () => {
            const limitedToken = jwt.sign(
                { sub: 'shipper-789', role: 'shipper', scopes: ['shipment:read'] },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .post('/api/billing/subscribe')
                .set('Authorization', `Bearer ${limitedToken}`)
                .send({ plan: 'PREMIUM' })
                .expect(403);

            expect(response.body.error).toMatch(/Insufficient/i);
        });
    });

    describe('Role-Based Access Control', () => {
        it('should prevent driver from creating shipments', async () => {
            const response = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({
                    pickup: 'Location A',
                    dropoff: 'Location B',
                })
                .expect(403);

            expect(response.body.error).toBeDefined();
        });

        it('should prevent shipper from accepting jobs', async () => {
            const response = await request(app)
                .post('/api/jobs/job-123/accept')
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({})
                .expect(403);

            expect(response.body.error).toBeDefined();
        });

        it('should allow admin to perform any action', async () => {
            const adminToken = jwt.sign(
                {
                    sub: 'admin-999',
                    role: 'admin',
                    scopes: ['admin:all'],
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Admin can create shipments
            const response = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    pickup: 'Location A',
                    dropoff: 'Location B',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Rate Limiting on Auth Endpoints', () => {
        it('should rate limit failed login attempts', async () => {
            const requests = [];
            for (let i = 0; i < 6; i++) {
                requests.push(
                    request(app)
                        .post('/api/auth/login')
                        .send({ email: 'test@example.com', password: 'wrong' })
                );
            }

            const responses = await Promise.all(requests);
            const lastResponse = responses[responses.length - 1];

            expect(lastResponse.status).toBe(429);
            expect(lastResponse.body.error).toMatch(/Too many|rate limit/i);
        });

        it('should enforce per-user rate limits on general endpoints', async () => {
            const requests = [];
            for (let i = 0; i < 101; i++) {
                requests.push(
                    request(app)
                        .get('/api/shipments')
                        .set('Authorization', `Bearer ${validToken}`)
                );
            }

            const responses = await Promise.all(requests);
            const lastResponse = responses[responses.length - 1];

            expect(lastResponse.status).toBe(429);
        });
    });

    describe('JWT Token Claims', () => {
        it('should extract user ID from token sub claim', async () => {
            const response = await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.body.data.id).toBe('user-123');
        });

        it('should extract email from token email claim', async () => {
            const response = await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.body.data.email).toBe('test@example.com');
        });

        it('should extract role from token role claim', async () => {
            const response = await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.body.data.role).toBe('shipper');
        });

        it('should extract scopes from token scopes array', async () => {
            const response = await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.body.data.scopes).toEqual(
                expect.arrayContaining(['shipment:create', 'shipment:read'])
            );
        });
    });

    describe('Correlation ID Tracking', () => {
        it('should generate correlation ID if not provided', async () => {
            const response = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.headers['x-correlation-id']).toBeDefined();
        });

        it('should use provided correlation ID', async () => {
            const correlationId = 'test-correlation-123';
            const response = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${validToken}`)
                .set('x-correlation-id', correlationId)
                .expect(200);

            expect(response.headers['x-correlation-id']).toBe(correlationId);
        });

        it('should include correlation ID in error responses', async () => {
            const correlationId = 'test-error-correlation-456';
            const response = await request(app)
                .get('/api/shipments')
                .set('x-correlation-id', correlationId)
                .expect(401);

            expect(response.headers['x-correlation-id']).toBe(correlationId);
        });
    });
});
