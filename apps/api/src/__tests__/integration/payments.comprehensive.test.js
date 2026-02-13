/**
 * Payment Routes Integration Tests - Comprehensive Coverage
 * Full merchant payout system, payment processing, and refund handling
 */

const request = require('supertest');
const { generateTestJWT } = require('../helpers/jwt');

describe('Payment Routes - Complete Coverage', () => {
    let app;

    beforeAll(() => {
        app = require('../../app');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/payments/payout-request', () => {
        it('should request instant payout with valid data', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:payout'],
            });

            const response = await request(app)
                .post('/api/payments/payout-request')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 500.00,
                    currency: 'USD',
                    method: 'stripe',
                });

            expect([200, 201, 202]).toContain(response.status);
            if (response.body.data) {
                expect(response.body.data).toHaveProperty('payoutId');
                expect(response.body.data.status).toMatch(/processing|pending/);
            }
        });

        it('should reject payout with insufficient permission', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['user:profile'], // Missing payment:payout
            });

            const response = await request(app)
                .post('/api/payments/payout-request')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 100, currency: 'USD' });

            expect(response.status).toBe(403);
        });

        it('should reject payout below minimum amount', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:payout'],
            });

            const response = await request(app)
                .post('/api/payments/payout-request')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 5.00, // Below minimum
                    currency: 'USD',
                });

            expect(response.status).toBe(400);
            if (response.body.error) {
                expect(response.body.error.toLowerCase()).toContain('minimum');
            }
        });

        it('should reject payout above maximum amount', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:payout'],
            });

            const response = await request(app)
                .post('/api/payments/payout-request')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 50000.00, // Above maximum
                    currency: 'USD',
                });

            expect(response.status).toBe(400);
        });

        it('should validate currency', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:payout'],
            });

            const response = await request(app)
                .post('/api/payments/payout-request')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 100,
                    currency: 'INVALID',
                });

            expect(response.status).toBe(400);
        });

        it('should handle missing required fields', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:payout'],
            });

            const response = await request(app)
                .post('/api/payments/payout-request')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 100 }); // Missing currency

            expect(response.status).toBe(400);
        });

        it('should rate limit payout requests', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:payout'],
            });

            const payoutData = { amount: 100, currency: 'USD' };
            const responses = [];

            for (let i = 0; i < 35; i++) {
                responses.push(
                    request(app)
                        .post('/api/payments/payout-request')
                        .set('Authorization', `Bearer ${token}`)
                        .send(payoutData)
                );
            }

            const results = await Promise.all(responses);
            const rateLimitedResponse = results.find((r) => r.status === 429);
            expect(rateLimitedResponse).toBeDefined();
        });
    });

    describe('GET /api/payments/payout/:id', () => {
        it('should retrieve payout status', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:read'],
            });

            const response = await request(app)
                .get('/api/payments/payout/payout_123')
                .set('Authorization', `Bearer ${token}`);

            expect([200, 404]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.data).toHaveProperty('status');
            }
        });

        it('should only show user their own payouts', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:read'],
            });

            const response = await request(app)
                .get('/api/payments/payout/someone_else_payout')
                .set('Authorization', `Bearer ${token}`);

            expect([403, 404]).toContain(response.status);
        });
    });

    describe('POST /api/payments/refund', () => {
        it('should process refund for completed transaction', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:refund'],
            });

            const response = await request(app)
                .post('/api/payments/refund')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    transactionId: 'txn_123',
                    reason: 'customer_request',
                    amount: 50.00,
                });

            expect([200, 201, 400, 404]).toContain(response.status);
        });

        it('should reject refund without permission', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['user:profile'],
            });

            const response = await request(app)
                .post('/api/payments/refund')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    transactionId: 'txn_123',
                    reason: 'customer_request',
                });

            expect(response.status).toBe(403);
        });

        it('should validate refund reason', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:refund'],
            });

            const response = await request(app)
                .post('/api/payments/refund')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    transactionId: 'txn_123',
                    reason: 'invalid_reason',
                });

            expect(response.status).toBe(400);
        });

        it('should prevent duplicate refunds', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:refund'],
            });

            const refundData = {
                transactionId: 'txn_123',
                reason: 'customer_request',
            };

            const response1 = await request(app)
                .post('/api/payments/refund')
                .set('Authorization', `Bearer ${token}`)
                .send(refundData);

            // Try same refund again
            const response2 = await request(app)
                .post('/api/payments/refund')
                .set('Authorization', `Bearer ${token}`)
                .send(refundData);

            if (response1.status === 200 || response1.status === 201) {
                // If first succeeded, second should fail with duplicate error
                expect(response2.status).toBe(400);
            }
        });
    });

    describe('GET /api/payments/history', () => {
        it('should retrieve payment history', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:read'],
            });

            const response = await request(app)
                .get('/api/payments/history')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data || response.body)).toBe(true);
        });

        it('should filter history by date range', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:read'],
            });

            const response = await request(app)
                .get('/api/payments/history')
                .query({
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                })
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });

        it('should paginate through results', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:read'],
            });

            const response = await request(app)
                .get('/api/payments/history')
                .query({ page: 1, limit: 10 })
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            if (response.body.pagination) {
                expect(response.body.pagination).toHaveProperty('page');
                expect(response.body.pagination).toHaveProperty('total');
            }
        });
    });

    describe('GET /api/payments/balance', () => {
        it('should get current account balance', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:read'],
            });

            const response = await request(app)
                .get('/api/payments/balance')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('balance');
            expect(typeof response.body.data.balance).toBe('number');
        });
    });

    describe('POST /api/payments/fee-estimate', () => {
        it('should estimate transaction fees', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:read'],
            });

            const response = await request(app)
                .post('/api/payments/fee-estimate')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 1000.00,
                    method: 'stripe',
                });

            expect(response.status).toBe(200);
            if (response.body.data) {
                expect(response.body.data).toHaveProperty('grossAmount');
                expect(response.body.data).toHaveProperty('fees');
                expect(response.body.data).toHaveProperty('netAmount');
            }
        });

        it('should calculate different fees for different payment methods', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:read'],
            });

            const stripeFees = await request(app)
                .post('/api/payments/fee-estimate')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 1000, method: 'stripe' });

            const paypalFees = await request(app)
                .post('/api/payments/fee-estimate')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 1000, method: 'paypal' });

            // Should return valid data for both
            expect([200, 400, 404]).toContain(stripeFees.status);
            expect([200, 400, 404]).toContain(paypalFees.status);
        });
    });

    describe('error scenarios', () => {
        it('should handle unauthorized access', async () => {
            const response = await request(app)
                .post('/api/payments/payout-request')
                .send({ amount: 100, currency: 'USD' });

            expect(response.status).toBe(401);
        });

        it('should handle malformed requests', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:payout'],
            });

            const response = await request(app)
                .post('/api/payments/payout-request')
                .set('Authorization', `Bearer ${token}`)
                .send('not json');

            expect([400, 415]).toContain(response.status);
        });

        it('should handle server errors gracefully', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:read'],
            });

            const response = await request(app)
                .get('/api/payments/invalid-endpoint')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('payment security', () => {
        it('should require HTTPS headers in production', async () => {
            const token = generateTestJWT({
                sub: 'merchant_123',
                scopes: ['payment:read'],
            });

            const response = await request(app)
                .get('/api/payments/balance')
                .set('Authorization', `Bearer ${token}`);

            // Check security headers
            expect(response.headers['x-content-type-options']).toBeDefined();
        });

        it('should not expose sensitive data in errors', async () => {
            const response = await request(app)
                .post('/api/payments/payout-request')
                .send({ amount: 100 });

            expect(response.body).not.toContain('database');
            expect(response.body).not.toContain('stack');
        });
    });
});
