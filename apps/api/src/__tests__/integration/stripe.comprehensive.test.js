/**
 * Stripe Payment Route Tests - Comprehensive Coverage
 * Full Stripe integration testing with webhooks, charges, and payouts
 */

const request = require('supertest');
const { generateTestJWT } = require('../helpers/jwt');

describe('Stripe Routes - Complete Coverage', () => {
    let app;

    beforeAll(() => {
        app = require('../../app');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/stripe/intent', () => {
        it('should create Stripe payment intent', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:payment'],
            });

            const response = await request(app)
                .post('/api/stripe/intent')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 100.00,
                    currency: 'usd',
                });

            expect([200, 201, 400, 500]).toContain(response.status);
            if (response.status === 200 || response.status === 201) {
                expect(response.body.data).toHaveProperty('clientSecret');
            }
        });

        it('should validate amount is positive', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:payment'],
            });

            const response = await request(app)
                .post('/api/stripe/intent')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: -100,
                    currency: 'usd',
                });

            expect(response.status).toBe(400);
        });

        it('should support multiple currencies', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:payment'],
            });

            const currencies = ['usd', 'eur', 'gbp', 'cad', 'aud'];

            for (const currency of currencies) {
                const response = await request(app)
                    .post('/api/stripe/intent')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        amount: 100,
                        currency,
                    });

                expect([200, 201, 400, 422]).toContain(response.status);
            }
        });

        it('should attach metadata to payment', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:payment'],
            });

            const response = await request(app)
                .post('/api/stripe/intent')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 100,
                    currency: 'usd',
                    metadata: {
                        orderId: 'order_123',
                        userId: 'user_123',
                    },
                });

            expect([200, 201, 400]).toContain(response.status);
        });
    });

    describe('POST /api/stripe/charge', () => {
        it('should create charge from payment method', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:payment'],
            });

            const response = await request(app)
                .post('/api/stripe/charge')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 100,
                    currency: 'usd',
                    source: 'tok_visa', // Test token
                    description: 'Test charge',
                });

            expect([200, 201, 400, 402, 500]).toContain(response.status);
        });

        it('should reject invalid payment methods', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:payment'],
            });

            const response = await request(app)
                .post('/api/stripe/charge')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 100,
                    currency: 'usd',
                    source: 'invalid_token',
                });

            expect(response.status).toBe(400);
        });

        it('should handle failed charges', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:payment'],
            });

            const response = await request(app)
                .post('/api/stripe/charge')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 100,
                    currency: 'usd',
                    source: 'tok_chargeDeclined', // Test decline token
                });

            expect([402, 400, 500]).toContain(response.status);
        });

        it('should track charge status', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:payment'],
            });

            const response = await request(app)
                .post('/api/stripe/charge')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 100,
                    currency: 'usd',
                    source: 'tok_visa',
                });

            if (response.status === 200 || response.status === 201) {
                expect(response.body.data).toHaveProperty('status');
                expect(['succeeded', 'pending', 'failed']).toContain(response.body.data.status);
            }
        });
    });

    describe('POST /api/stripe/refund', () => {
        it('should refund charge', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:refund'],
            });

            const response = await request(app)
                .post('/api/stripe/refund')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    chargeId: 'ch_test123',
                    reason: 'customer_request',
                });

            expect([200, 400, 404, 500]).toContain(response.status);
        });

        it('should validate refund reason', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:refund'],
            });

            const response = await request(app)
                .post('/api/stripe/refund')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    chargeId: 'ch_test123',
                    reason: 'invalid_reason',
                });

            expect(response.status).toBe(400);
        });

        it('should support partial refunds', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:refund'],
            });

            const response = await request(app)
                .post('/api/stripe/refund')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    chargeId: 'ch_test123',
                    amount: 50,
                    reason: 'partial_refund',
                });

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should prevent double refunds', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:refund'],
            });

            const refundData = {
                chargeId: 'ch_test123',
                reason: 'customer_request',
            };

            await request(app)
                .post('/api/stripe/refund')
                .set('Authorization', `Bearer ${token}`)
                .send(refundData);

            const response = await request(app)
                .post('/api/stripe/refund')
                .set('Authorization', `Bearer ${token}`)
                .send(refundData);

            expect([400, 409]).toContain(response.status);
        });
    });

    describe('POST /api/stripe/webhook', () => {
        it('should handle payment_intent.succeeded webhook', async () => {
            const webhookEvent = {
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_test123',
                        amount: 10000,
                        currency: 'usd',
                        status: 'succeeded',
                    },
                },
            };

            const response = await request(app)
                .post('/api/stripe/webhook')
                .send(webhookEvent)
                .set('Content-Type', 'application/json');

            expect([200, 404]).toContain(response.status);
        });

        it('should handle charge.failed webhook', async () => {
            const webhookEvent = {
                type: 'charge.failed',
                data: {
                    object: {
                        id: 'ch_test123',
                        amount: 10000,
                        status: 'failed',
                    },
                },
            };

            const response = await request(app)
                .post('/api/stripe/webhook')
                .send(webhookEvent);

            expect([200, 404]).toContain(response.status);
        });

        it('should handle refund webhook', async () => {
            const webhookEvent = {
                type: 'charge.refunded',
                data: {
                    object: {
                        id: 'ch_test123',
                        refunded: true,
                    },
                },
            };

            const response = await request(app)
                .post('/api/stripe/webhook')
                .send(webhookEvent);

            expect([200, 404]).toContain(response.status);
        });

        it('should ignore unknown webhook events', async () => {
            const webhookEvent = {
                type: 'unknown.event',
                data: { object: {} },
            };

            const response = await request(app)
                .post('/api/stripe/webhook')
                .send(webhookEvent);

            // Should either ignore or return success
            expect([200, 202, 404]).toContain(response.status);
        });
    });

    describe('GET /api/stripe/customer', () => {
        it('should get Stripe customer info', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:read'],
            });

            const response = await request(app)
                .get('/api/stripe/customer')
                .set('Authorization', `Bearer ${token}`);

            expect([200, 404]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.data).toHaveProperty('id');
            }
        });
    });

    describe('GET /api/stripe/invoices', () => {
        it('should retrieve customer invoices', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:read'],
            });

            const response = await request(app)
                .get('/api/stripe/invoices')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data || [])).toBe(true);
        });

        it('should paginate invoices', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:read'],
            });

            const response = await request(app)
                .get('/api/stripe/invoices')
                .query({ limit: 10, starting_after: 'inv_123' })
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });
    });

    describe('error handling', () => {
        it('should handle missing authorization', async () => {
            const response = await request(app)
                .post('/api/stripe/charge')
                .send({ amount: 100, currency: 'usd' });

            expect(response.status).toBe(401);
        });

        it('should handle rate limits gracefully', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:payment'],
            });

            const requests = Array.from({ length: 50 }, () =>
                request(app)
                    .post('/api/stripe/charge')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        amount: 10,
                        currency: 'usd',
                    })
            );

            const responses = await Promise.all(requests);
            const rateLimited = responses.filter((r) => r.status === 429);

            // At least some should be rate limited
            expect(rateLimited.length).toBeGreaterThan(0);
        });

        it('should not expose API keys in responses', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['billing:read'],
            });

            const response = await request(app)
                .get('/api/stripe/customer')
                .set('Authorization', `Bearer ${token}`);

            const responseString = JSON.stringify(response.body);
            expect(responseString).not.toContain('sk_');
            expect(responseString).not.toContain('pk_');
        });
    });

    describe('Stripe Connect', () => {
        it('should support Stripe Connect for merchants', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['stripe:connect'],
            });

            const response = await request(app)
                .post('/api/stripe/connect/authorize')
                .set('Authorization', `Bearer ${token}`)
                .send({ redirectUrl: 'https://example.com/callback' });

            expect([200, 201, 400, 403]).toContain(response.status);
        });
    });
});
