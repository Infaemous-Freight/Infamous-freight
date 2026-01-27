/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Integration Tests for Job Lifecycle
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const { prisma } = require('../../database');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Job Lifecycle Integration Tests', () => {
    let shipperToken;
    let driverToken;
    let shipperId = 'shipper-test-123';
    let driverId = 'driver-test-456';
    let createdJobId;

    beforeAll(() => {
        shipperToken = jwt.sign(
            {
                sub: shipperId,
                email: 'shipper@test.com',
                role: 'shipper',
                scopes: ['shipment:create', 'shipment:read', 'job:create'],
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        driverToken = jwt.sign(
            {
                sub: driverId,
                email: 'driver@test.com',
                role: 'driver',
                scopes: ['job:accept', 'job:update', 'location:update'],
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        // Cleanup test data
        if (createdJobId) {
            await prisma.job.delete({ where: { id: createdJobId } }).catch(() => { });
        }
    });

    describe('Job Creation Flow', () => {
        it('should create a job in DRAFT status', async () => {
            const response = await request(app)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({
                    pickup: '123 Main St, City A',
                    dropoff: '456 Oak Ave, City B',
                    pickupLat: 40.7128,
                    pickupLng: -74.006,
                    dropoffLat: 34.0522,
                    dropoffLng: -118.2437,
                    distance: 250,
                    timeMinutes: 240,
                    description: 'Test delivery',
                })
                .expect(201);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.status).toBe('DRAFT');
            expect(response.body.data.shipperId).toBe(shipperId);
            createdJobId = response.body.data.id;
        });

        it('should require valid pickup and dropoff coordinates', async () => {
            const response = await request(app)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({
                    pickup: '123 Main St',
                    dropoff: '456 Oak Ave',
                    distance: 10,
                    timeMinutes: 15,
                })
                .expect(400);

            expect(response.body.error).toMatch(/coordinates|latitude|longitude/i);
        });

        it('should prevent non-shipper from creating jobs', async () => {
            const response = await request(app)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${driverToken}`)
                .send({
                    pickup: '123 Main St, City A',
                    dropoff: '456 Oak Ave, City B',
                    pickupLat: 40.7128,
                    pickupLng: -74.006,
                    dropoffLat: 34.0522,
                    dropoffLng: -118.2437,
                    distance: 250,
                    timeMinutes: 240,
                })
                .expect(403);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('Job State Transitions', () => {
        it('should transition job from DRAFT to REQUIRES_PAYMENT', async () => {
            const response = await request(app)
                .patch(`/api/jobs/${createdJobId}/status`)
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({ status: 'REQUIRES_PAYMENT' })
                .expect(200);

            expect(response.body.data.status).toBe('REQUIRES_PAYMENT');
        });

        it('should transition from REQUIRES_PAYMENT to OPEN after payment', async () => {
            // Simulate payment processing
            const response = await request(app)
                .patch(`/api/jobs/${createdJobId}/status`)
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({ status: 'OPEN' })
                .expect(200);

            expect(response.body.data.status).toBe('OPEN');
        });

        it('should prevent invalid state transitions', async () => {
            const response = await request(app)
                .patch(`/api/jobs/${createdJobId}/status`)
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({ status: 'DRAFT' }) // Invalid backward transition
                .expect(400);

            expect(response.body.error).toMatch(/invalid|transition|state/i);
        });

        it('should only allow driver to transition to ACCEPTED', async () => {
            const response = await request(app)
                .patch(`/api/jobs/${createdJobId}/status`)
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ status: 'ACCEPTED' })
                .expect(200);

            expect(response.body.data.status).toBe('ACCEPTED');
            expect(response.body.data.driverId).toBe(driverId);
        });

        it('should transition to PICKED_UP when driver picks up shipment', async () => {
            const response = await request(app)
                .patch(`/api/jobs/${createdJobId}/status`)
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ status: 'PICKED_UP' })
                .expect(200);

            expect(response.body.data.status).toBe('PICKED_UP');
        });

        it('should transition to DELIVERED when driver delivers', async () => {
            const response = await request(app)
                .patch(`/api/jobs/${createdJobId}/status`)
                .set('Authorization', `Bearer ${driverToken}`)
                .send({ status: 'DELIVERED' })
                .expect(200);

            expect(response.body.data.status).toBe('DELIVERED');
        });

        it('should transition to COMPLETED to finalize job', async () => {
            const response = await request(app)
                .patch(`/api/jobs/${createdJobId}/status`)
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({ status: 'COMPLETED' })
                .expect(200);

            expect(response.body.data.status).toBe('COMPLETED');
        });
    });

    describe('Job Acceptance & Assignment', () => {
        let acceptanceJobId;

        beforeEach(async () => {
            // Create a fresh job for acceptance testing
            const response = await request(app)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({
                    pickup: '100 Test St, City A',
                    dropoff: '200 Test Ave, City B',
                    pickupLat: 40.7128,
                    pickupLng: -74.006,
                    dropoffLat: 34.0522,
                    dropoffLng: -118.2437,
                    distance: 100,
                    timeMinutes: 120,
                });

            acceptanceJobId = response.body.data.id;

            // Transition to OPEN
            await request(app)
                .patch(`/api/jobs/${acceptanceJobId}/status`)
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({ status: 'REQUIRES_PAYMENT' });

            await request(app)
                .patch(`/api/jobs/${acceptanceJobId}/status`)
                .set('Authorization', `Bearer ${shipperToken}`)
                .send({ status: 'OPEN' });
        });

        it('should only allow driver to accept OPEN jobs', async () => {
            const response = await request(app)
                .post(`/api/jobs/${acceptanceJobId}/accept`)
                .set('Authorization', `Bearer ${driverToken}`)
                .expect(200);

            expect(response.body.data.status).toBe('ACCEPTED');
            expect(response.body.data.driverId).toBe(driverId);
        });

        it('should prevent accepting already accepted jobs', async () => {
            // First driver accepts
            await request(app)
                .post(`/api/jobs/${acceptanceJobId}/accept`)
                .set('Authorization', `Bearer ${driverToken}`);

            // Create another driver token
            const driver2Token = jwt.sign(
                {
                    sub: 'driver-test-789',
                    email: 'driver2@test.com',
                    role: 'driver',
                    scopes: ['job:accept', 'job:update'],
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Second driver tries to accept
            const response = await request(app)
                .post(`/api/jobs/${acceptanceJobId}/accept`)
                .set('Authorization', `Bearer ${driver2Token}`)
                .expect(409);

            expect(response.body.error).toMatch(/already accepted|unavailable/i);
        });
    });

    describe('Job Listing & Filtering', () => {
        it('should list available jobs for drivers', async () => {
            const response = await request(app)
                .get('/api/jobs?status=OPEN')
                .set('Authorization', `Bearer ${driverToken}`)
                .expect(200);

            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.every((job) => job.status === 'OPEN')).toBe(true);
        });

        it('should filter jobs by distance', async () => {
            const response = await request(app)
                .get('/api/jobs?maxDistance=50')
                .set('Authorization', `Bearer ${driverToken}`)
                .expect(200);

            expect(response.body.data.every((job) => job.distance <= 50)).toBe(true);
        });

        it('should support pagination', async () => {
            const page1 = await request(app)
                .get('/api/jobs?page=1&limit=10')
                .set('Authorization', `Bearer ${driverToken}`)
                .expect(200);

            expect(page1.body.data).toBeDefined();
            expect(page1.body.pagination).toBeDefined();
            expect(page1.body.pagination.page).toBe(1);
            expect(page1.body.pagination.limit).toBe(10);
        });

        it('should return user-specific jobs', async () => {
            const response = await request(app)
                .get('/api/jobs/my-jobs')
                .set('Authorization', `Bearer ${shipperToken}`)
                .expect(200);

            expect(response.body.data.every((job) => job.shipperId === shipperId)).toBe(
                true
            );
        });
    });

    describe('Job Error Handling', () => {
        it('should return 404 for non-existent job', async () => {
            const response = await request(app)
                .get('/api/jobs/non-existent-id')
                .set('Authorization', `Bearer ${shipperToken}`)
                .expect(404);

            expect(response.body.error).toMatch(/not found|does not exist/i);
        });

        it('should require authentication to view jobs', async () => {
            const response = await request(app)
                .get('/api/jobs')
                .expect(401);

            expect(response.body.error).toBeDefined();
        });

        it('should enforce ownership on job updates', async () => {
            const otherShipperToken = jwt.sign(
                {
                    sub: 'other-shipper-999',
                    email: 'other@test.com',
                    role: 'shipper',
                    scopes: ['shipment:create', 'shipment:read'],
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .patch(`/api/jobs/${createdJobId}/status`)
                .set('Authorization', `Bearer ${otherShipperToken}`)
                .send({ status: 'CANCELLED' })
                .expect(403);

            expect(response.body.error).toMatch(/access|permission|forbidden/i);
        });
    });
});
