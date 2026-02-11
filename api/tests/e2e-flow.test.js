/**
 * End-to-End Flow Tests
 * 
 * Comprehensive test suite for complete user journeys.
 * Tests realistic workflows across multiple endpoints and services.
 * 
 * Coverage:
 * - User authentication flow
 * - Shipment lifecycle
 * - Billing flow
 * - Voice command flow
 * - AI command flow
 * - Multi-step workflows
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('stripe');

describe('End-to-End Flows', () => {
    let app;
    let prisma;
    let authToken;

    beforeEach(() => {
        // Setup Express app with all routes
        app = express();
        app.use(express.json());

        // Mock Prisma
        const mockPrisma = {
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn()
            },
            shipment: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn()
            },
            driver: {
                findUnique: jest.fn(),
                update: jest.fn()
            },
            $queryRaw: jest.fn()
        };
        PrismaClient.mockImplementation(() => mockPrisma);
        prisma = new PrismaClient();

        // Setup authentication routes
        app.post('/api/auth/register', async (req, res) => {
            try {
                const { email, password, name } = req.body;

                const existingUser = await prisma.user.findUnique({ where: { email } });
                if (existingUser) {
                    return res.status(400).json({ error: 'Email already exists' });
                }

                const user = await prisma.user.create({
                    data: { id: 'user-' + Date.now(), email, name, passwordHash: 'hashed-' + password }
                });

                const token = jwt.sign(
                    { sub: user.id, email: user.email, scopes: ['read:shipments', 'write:shipments'] },
                    process.env.JWT_SECRET || 'test-secret',
                    { expiresIn: '1h' }
                );

                res.json({ success: true, token, user: { id: user.id, email, name } });
            } catch (error) {
                if (error?.code === 'P2002') {
                    return res.status(409).json({ error: 'Email already exists' });
                }

                return res.status(500).json({ error: 'Registration failed' });
            }
        });

        app.post('/api/auth/login', async (req, res) => {
            const { email, password } = req.body;

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || !user.passwordHash.startsWith('hashed-' + password)) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { sub: user.id, email: user.email, scopes: ['read:shipments', 'write:shipments'] },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            res.json({ success: true, token });
        });

        // Setup shipment routes
        const { authenticate, requireScope } = require('../src/middleware/security');

        app.post('/api/shipments',
            authenticate,
            requireScope('write:shipments'),
            async (req, res) => {
                const { origin, destination, weight } = req.body;

                const shipment = await prisma.shipment.create({
                    data: {
                        id: 'shipment-' + Date.now(),
                        origin,
                        destination,
                        weight,
                        status: 'pending',
                        userId: req.user.sub
                    }
                });

                res.json({ success: true, shipment });
            }
        );

        app.get('/api/shipments',
            authenticate,
            requireScope('read:shipments'),
            async (req, res) => {
                const shipments = await prisma.shipment.findMany({
                    where: { userId: req.user.sub }
                });

                res.json({ success: true, shipments });
            }
        );

        app.get('/api/shipments/:id',
            authenticate,
            requireScope('read:shipments'),
            async (req, res) => {
                const shipment = await prisma.shipment.findUnique({
                    where: { id: req.params.id }
                });

                if (!shipment || shipment.userId !== req.user.sub) {
                    return res.status(404).json({ error: 'Shipment not found' });
                }

                res.json({ success: true, shipment });
            }
        );

        app.patch('/api/shipments/:id',
            authenticate,
            requireScope('write:shipments'),
            async (req, res) => {
                const { status } = req.body;

                const shipment = await prisma.shipment.update({
                    where: { id: req.params.id },
                    data: { status }
                });

                res.json({ success: true, shipment });
            }
        );

        // Setup AI command route
        app.post('/api/ai/command',
            authenticate,
            requireScope('ai:command'),
            async (req, res) => {
                const { command } = req.body;

                // Simulate AI processing
                const result = `AI processed: ${command}`;

                res.json({ success: true, result });
            }
        );

        // Setup billing routes
        const stripe = require('stripe');
        const mockStripe = {
            paymentIntents: { create: jest.fn() },
            charges: { create: jest.fn() }
        };
        stripe.mockReturnValue(mockStripe);

        app.post('/api/billing/charge',
            authenticate,
            requireScope('billing:write'),
            async (req, res) => {
                const { amount } = req.body;

                const charge = await mockStripe.charges.create({
                    amount,
                    currency: 'usd',
                    source: 'tok_visa'
                });

                res.json({ success: true, chargeId: charge.id || 'ch_test_123' });
            }
        );

        // Setup voice route
        app.post('/api/voice/command',
            authenticate,
            requireScope('voice:command'),
            async (req, res) => {
                const { transcript } = req.body;

                // Simulate voice command processing
                const action = transcript.toLowerCase().includes('create') ? 'create_shipment' : 'query';

                res.json({ success: true, action, transcript });
            }
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('User Registration and Login Flow', () => {
        test('should complete full registration and login flow', async () => {
            // Step 1: Register new user
            prisma.user.findUnique.mockResolvedValue(null); // No existing user
            prisma.user.create.mockResolvedValue({
                id: 'user-123',
                email: 'newuser@example.com',
                name: 'New User',
                passwordHash: 'hashed-password123'
            });

            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'password123',
                    name: 'New User'
                });

            expect(registerResponse.status).toBe(200);
            expect(registerResponse.body.success).toBe(true);
            expect(registerResponse.body.token).toBeDefined();
            expect(registerResponse.body.user.email).toBe('newuser@example.com');

            const registrationToken = registerResponse.body.token;

            // Step 2: Use token to access protected resource
            prisma.shipment.findMany.mockResolvedValue([]);

            const shipmentResponse = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${registrationToken}`);

            expect(shipmentResponse.status).toBe(200);
            expect(shipmentResponse.body.success).toBe(true);

            // Step 3: Logout (simulate) and login again
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'newuser@example.com',
                passwordHash: 'hashed-password123'
            });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'newuser@example.com',
                    password: 'password123'
                });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.success).toBe(true);
            expect(loginResponse.body.token).toBeDefined();

            // Step 4: Use new token
            const newToken = loginResponse.body.token;

            const verifyResponse = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${newToken}`);

            expect(verifyResponse.status).toBe(200);
        });

        test('should prevent duplicate registration', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'existing-user',
                email: 'existing@example.com'
            });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'existing@example.com',
                    password: 'password123',
                    name: 'Existing User'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Email already exists');
        });

        test('should handle duplicate email write errors during registration', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockRejectedValue({ code: 'P2002' });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'existing@example.com',
                    password: 'password123',
                    name: 'Existing User'
                });

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Email already exists');
        });

        test('should reject invalid login credentials', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                passwordHash: 'hashed-correctpass'
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'user@example.com',
                    password: 'wrongpass'
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });
    });

    describe('Complete Shipment Lifecycle', () => {
        beforeEach(async () => {
            // Setup authenticated user
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-shipment',
                email: 'shipper@example.com',
                passwordHash: 'hashed-pass'
            });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'shipper@example.com',
                    password: 'pass'
                });

            authToken = loginResponse.body.token;
        });

        test('should complete full shipment lifecycle', async () => {
            // Step 1: Create shipment
            prisma.shipment.create.mockResolvedValue({
                id: 'shipment-lifecycle-1',
                origin: 'New York',
                destination: 'Los Angeles',
                weight: 1000,
                status: 'pending',
                userId: 'user-shipment'
            });

            const createResponse = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    origin: 'New York',
                    destination: 'Los Angeles',
                    weight: 1000
                });

            expect(createResponse.status).toBe(200);
            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.shipment.status).toBe('pending');

            const shipmentId = createResponse.body.shipment.id;

            // Step 2: Retrieve shipment
            prisma.shipment.findUnique.mockResolvedValue({
                id: shipmentId,
                origin: 'New York',
                destination: 'Los Angeles',
                weight: 1000,
                status: 'pending',
                userId: 'user-shipment'
            });

            const getResponse = await request(app)
                .get(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.shipment.id).toBe(shipmentId);

            // Step 3: Update shipment status to in-transit
            prisma.shipment.update.mockResolvedValue({
                id: shipmentId,
                status: 'in-transit',
                userId: 'user-shipment'
            });

            const updateResponse1 = await request(app)
                .patch(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'in-transit' });

            expect(updateResponse1.status).toBe(200);
            expect(updateResponse1.body.shipment.status).toBe('in-transit');

            // Step 4: Update shipment status to delivered
            prisma.shipment.update.mockResolvedValue({
                id: shipmentId,
                status: 'delivered',
                userId: 'user-shipment'
            });

            const updateResponse2 = await request(app)
                .patch(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'delivered' });

            expect(updateResponse2.status).toBe(200);
            expect(updateResponse2.body.shipment.status).toBe('delivered');

            // Step 5: List all shipments to verify
            prisma.shipment.findMany.mockResolvedValue([
                {
                    id: shipmentId,
                    origin: 'New York',
                    destination: 'Los Angeles',
                    weight: 1000,
                    status: 'delivered',
                    userId: 'user-shipment'
                }
            ]);

            const listResponse = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${authToken}`);

            expect(listResponse.status).toBe(200);
            expect(listResponse.body.shipments.length).toBe(1);
            expect(listResponse.body.shipments[0].status).toBe('delivered');
        });

        test('should prevent accessing other users shipments', async () => {
            prisma.shipment.findUnique.mockResolvedValue({
                id: 'other-shipment',
                userId: 'different-user'
            });

            const response = await request(app)
                .get('/api/shipments/other-shipment')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Shipment not found');
        });
    });

    describe('Billing Integration Flow', () => {
        beforeEach(async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'billing-user',
                email: 'billing@example.com',
                passwordHash: 'hashed-pass'
            });

            // Create token with billing scope
            authToken = jwt.sign(
                { sub: 'billing-user', email: 'billing@example.com', scopes: ['billing:write', 'write:shipments'] },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );
        });

        test('should complete shipment with payment', async () => {
            // Step 1: Create shipment
            prisma.shipment.create.mockResolvedValue({
                id: 'paid-shipment-1',
                origin: 'Chicago',
                destination: 'Miami',
                weight: 500,
                status: 'pending',
                userId: 'billing-user'
            });

            const shipmentResponse = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    origin: 'Chicago',
                    destination: 'Miami',
                    weight: 500
                });

            expect(shipmentResponse.status).toBe(200);

            // Step 2: Process payment
            const stripe = require('stripe')();
            stripe.charges.create.mockResolvedValue({
                id: 'ch_payment_123',
                amount: 5000,
                status: 'succeeded'
            });

            const paymentResponse = await request(app)
                .post('/api/billing/charge')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 5000 });

            expect(paymentResponse.status).toBe(200);
            expect(paymentResponse.body.success).toBe(true);
            expect(paymentResponse.body.chargeId).toBeDefined();

            // Step 3: Verify shipment can proceed
            prisma.shipment.update.mockResolvedValue({
                id: 'paid-shipment-1',
                status: 'confirmed',
                userId: 'billing-user'
            });

            const confirmResponse = await request(app)
                .patch('/api/shipments/paid-shipment-1')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'confirmed' });

            expect(confirmResponse.status).toBe(200);
            expect(confirmResponse.body.shipment.status).toBe('confirmed');
        });
    });

    describe('AI Command Integration Flow', () => {
        beforeEach(() => {
            authToken = jwt.sign(
                {
                    sub: 'ai-user',
                    email: 'ai@example.com',
                    scopes: ['ai:command', 'read:shipments', 'write:shipments']
                },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );
        });

        test('should process AI command to create shipment', async () => {
            // Step 1: Send AI command
            const aiResponse = await request(app)
                .post('/api/ai/command')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ command: 'Create shipment from Boston to Seattle' });

            expect(aiResponse.status).toBe(200);
            expect(aiResponse.body.result).toContain('AI processed');

            // Step 2: Create shipment based on AI interpretation
            prisma.shipment.create.mockResolvedValue({
                id: 'ai-shipment-1',
                origin: 'Boston',
                destination: 'Seattle',
                weight: 0,
                status: 'pending',
                userId: 'ai-user'
            });

            const shipmentResponse = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    origin: 'Boston',
                    destination: 'Seattle',
                    weight: 0
                });

            expect(shipmentResponse.status).toBe(200);
            expect(shipmentResponse.body.shipment.origin).toBe('Boston');
            expect(shipmentResponse.body.shipment.destination).toBe('Seattle');
        });

        test('should query shipments via AI', async () => {
            // Step 1: AI query command
            const aiResponse = await request(app)
                .post('/api/ai/command')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ command: 'Show my shipments' });

            expect(aiResponse.status).toBe(200);

            // Step 2: Retrieve shipments
            prisma.shipment.findMany.mockResolvedValue([
                { id: 'ship1', origin: 'NYC', destination: 'LA', status: 'delivered' },
                { id: 'ship2', origin: 'SF', destination: 'TX', status: 'in-transit' }
            ]);

            const shipmentResponse = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${authToken}`);

            expect(shipmentResponse.status).toBe(200);
            expect(shipmentResponse.body.shipments.length).toBe(2);
        });
    });

    describe('Voice Command Flow', () => {
        beforeEach(() => {
            authToken = jwt.sign(
                {
                    sub: 'voice-user',
                    email: 'voice@example.com',
                    scopes: ['voice:command', 'write:shipments']
                },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );
        });

        test('should create shipment via voice command', async () => {
            // Step 1: Process voice transcript
            const voiceResponse = await request(app)
                .post('/api/voice/command')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ transcript: 'Create a shipment from Denver to Portland' });

            expect(voiceResponse.status).toBe(200);
            expect(voiceResponse.body.action).toBe('create_shipment');

            // Step 2: Create shipment
            prisma.shipment.create.mockResolvedValue({
                id: 'voice-shipment-1',
                origin: 'Denver',
                destination: 'Portland',
                weight: 0,
                status: 'pending',
                userId: 'voice-user'
            });

            const shipmentResponse = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    origin: 'Denver',
                    destination: 'Portland',
                    weight: 0
                });

            expect(shipmentResponse.status).toBe(200);
            expect(shipmentResponse.body.shipment.origin).toBe('Denver');
        });
    });

    describe('Multi-User Scenarios', () => {
        test('should handle concurrent users independently', async () => {
            // User 1 setup
            prisma.user.findUnique.mockResolvedValueOnce({
                id: 'user1',
                email: 'user1@example.com',
                passwordHash: 'hashed-pass1'
            });

            const login1 = await request(app)
                .post('/api/auth/login')
                .send({ email: 'user1@example.com', password: 'pass1' });

            const token1 = login1.body.token;

            // User 2 setup
            prisma.user.findUnique.mockResolvedValueOnce({
                id: 'user2',
                email: 'user2@example.com',
                passwordHash: 'hashed-pass2'
            });

            const login2 = await request(app)
                .post('/api/auth/login')
                .send({ email: 'user2@example.com', password: 'pass2' });

            const token2 = login2.body.token;

            // User 1 creates shipment
            prisma.shipment.create.mockResolvedValueOnce({
                id: 'user1-shipment',
                origin: 'NYC',
                destination: 'LA',
                userId: 'user1'
            });

            const shipment1 = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${token1}`)
                .send({ origin: 'NYC', destination: 'LA', weight: 100 });

            expect(shipment1.status).toBe(200);

            // User 2 creates shipment
            prisma.shipment.create.mockResolvedValueOnce({
                id: 'user2-shipment',
                origin: 'SF',
                destination: 'SEA',
                userId: 'user2'
            });

            const shipment2 = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${token2}`)
                .send({ origin: 'SF', destination: 'SEA', weight: 200 });

            expect(shipment2.status).toBe(200);

            // User 1 lists only their shipments
            prisma.shipment.findMany.mockResolvedValueOnce([
                { id: 'user1-shipment', userId: 'user1' }
            ]);

            const list1 = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${token1}`);

            expect(list1.body.shipments.length).toBe(1);
            expect(list1.body.shipments[0].id).toBe('user1-shipment');

            // User 2 lists only their shipments
            prisma.shipment.findMany.mockResolvedValueOnce([
                { id: 'user2-shipment', userId: 'user2' }
            ]);

            const list2 = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${token2}`);

            expect(list2.body.shipments.length).toBe(1);
            expect(list2.body.shipments[0].id).toBe('user2-shipment');
        });
    });

    describe('Error Recovery Flows', () => {
        test('should recover from failed payment and retry', async () => {
            authToken = jwt.sign(
                { sub: 'retry-user', scopes: ['billing:write', 'write:shipments'] },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            // First payment attempt fails
            const stripe = require('stripe')();
            stripe.charges.create.mockRejectedValueOnce(new Error('Card declined'));

            const failedPayment = await request(app)
                .post('/api/billing/charge')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 5000 });

            expect(failedPayment.status).toBe(500);

            // Retry with different card (succeeds)
            stripe.charges.create.mockResolvedValueOnce({
                id: 'ch_retry_success',
                amount: 5000,
                status: 'succeeded'
            });

            const successPayment = await request(app)
                .post('/api/billing/charge')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 5000 });

            expect(successPayment.status).toBe(200);
            expect(successPayment.body.success).toBe(true);
        });
    });

    describe('Performance Under Load', () => {
        test('should handle multiple concurrent operations', async () => {
            authToken = jwt.sign(
                { sub: 'perf-user', scopes: ['read:shipments', 'write:shipments'] },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            // Setup mocks
            prisma.shipment.create.mockResolvedValue({
                id: 'concurrent-shipment',
                origin: 'NYC',
                destination: 'LA',
                userId: 'perf-user'
            });

            prisma.shipment.findMany.mockResolvedValue([]);

            // Create 20 concurrent operations
            const operations = [];

            for (let i = 0; i < 10; i++) {
                operations.push(
                    request(app)
                        .post('/api/shipments')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({ origin: 'NYC', destination: 'LA', weight: 100 })
                );
            }

            for (let i = 0; i < 10; i++) {
                operations.push(
                    request(app)
                        .get('/api/shipments')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }

            const startTime = Date.now();
            const results = await Promise.all(operations);
            const duration = Date.now() - startTime;

            // All operations should succeed
            results.forEach(result => {
                expect(result.status).toBe(200);
            });

            // Should complete in reasonable time (under 2 seconds)
            expect(duration).toBeLessThan(2000);
        });
    });
});

module.exports = { setupE2ETests: () => { } };
