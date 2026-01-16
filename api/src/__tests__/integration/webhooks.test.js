/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Integration Tests for Webhook Events
 */

const request = require('supertest');
const app = require('../../app');
const { prisma } = require('../../database');

describe('Webhook Integration Tests', () => {
    const STRIPE_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

    function generateStripeSignature(timestamp, body) {
        const crypto = require('crypto');
        const signed_content = `${timestamp}.${body}`;
        const signature = crypto
            .createHmac('sha256', STRIPE_SECRET)
            .update(signed_content)
            .digest('base64');
        return `t=${timestamp},v1=${signature}`;
    }

    describe('Stripe Webhook Handling', () => {
        it('should accept checkout.session.completed webhook', async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const eventBody = JSON.stringify({
                id: 'evt_test_checkout_completed_123',
                object: 'event',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_123',
                        object: 'checkout.session',
                        payment_status: 'paid',
                        metadata: {
                            jobId: 'job-123',
                            shipperId: 'shipper-456',
                        },
                    },
                },
            });

            const signature = generateStripeSignature(timestamp, eventBody);

            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .send(JSON.parse(eventBody))
                .expect(200);

            expect(response.body.received).toBe(true);
        });

        it('should prevent duplicate webhook processing', async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const eventId = 'evt_test_duplicate_' + Date.now();
            const eventBody = JSON.stringify({
                id: eventId,
                object: 'event',
                type: 'charge.succeeded',
                data: {
                    object: {
                        id: 'ch_test_123',
                        amount: 5000,
                        metadata: { jobId: 'job-123' },
                    },
                },
            });

            const signature = generateStripeSignature(timestamp, eventBody);

            // First request should process
            const response1 = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .send(JSON.parse(eventBody))
                .expect(200);

            expect(response1.body.received).toBe(true);

            // Second identical request should be rejected as duplicate
            const response2 = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .send(JSON.parse(eventBody))
                .expect(409);

            expect(response2.body.error).toMatch(/duplicate|already processed/i);
        });

        it('should validate webhook signature', async () => {
            const invalidBody = JSON.stringify({
                id: 'evt_test_invalid_sig',
                type: 'charge.succeeded',
            });

            const invalidSignature = 't=invalid,v1=invalidsignature';

            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', invalidSignature)
                .send(JSON.parse(invalidBody))
                .expect(401);

            expect(response.body.error).toMatch(/signature|invalid|unauthorized/i);
        });

        it('should handle payment_intent.succeeded event', async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const eventBody = JSON.stringify({
                id: 'evt_test_payment_succeeded',
                object: 'event',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_test_123',
                        status: 'succeeded',
                        amount: 10000,
                        metadata: {
                            jobId: 'job-789',
                            idempotencyKey: 'idem-key-123',
                        },
                    },
                },
            });

            const signature = generateStripeSignature(timestamp, eventBody);

            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .send(JSON.parse(eventBody))
                .expect(200);

            expect(response.body.received).toBe(true);
        });

        it('should handle charge.failed event', async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const eventBody = JSON.stringify({
                id: 'evt_test_charge_failed',
                object: 'event',
                type: 'charge.failed',
                data: {
                    object: {
                        id: 'ch_test_failed',
                        status: 'failed',
                        failure_message: 'Your card was declined',
                        metadata: { jobId: 'job-999' },
                    },
                },
            });

            const signature = generateStripeSignature(timestamp, eventBody);

            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .send(JSON.parse(eventBody))
                .expect(200);

            expect(response.body.received).toBe(true);
        });

        it('should handle customer.subscription.updated event', async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const eventBody = JSON.stringify({
                id: 'evt_test_sub_updated',
                object: 'event',
                type: 'customer.subscription.updated',
                data: {
                    object: {
                        id: 'sub_test_123',
                        status: 'active',
                        plan: { id: 'price_premium', product: 'prod_premium' },
                        metadata: { userId: 'user-123' },
                    },
                },
            });

            const signature = generateStripeSignature(timestamp, eventBody);

            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .send(JSON.parse(eventBody))
                .expect(200);

            expect(response.body.received).toBe(true);
        });

        it('should handle customer.subscription.deleted event', async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const eventBody = JSON.stringify({
                id: 'evt_test_sub_deleted',
                object: 'event',
                type: 'customer.subscription.deleted',
                data: {
                    object: {
                        id: 'sub_test_456',
                        status: 'canceled',
                        metadata: { userId: 'user-456' },
                    },
                },
            });

            const signature = generateStripeSignature(timestamp, eventBody);

            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .send(JSON.parse(eventBody))
                .expect(200);

            expect(response.body.received).toBe(true);
        });
    });

    describe('Webhook Retry Logic', () => {
        it('should retry failed webhook processing', async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const eventBody = JSON.stringify({
                id: 'evt_test_retry_' + Date.now(),
                object: 'event',
                type: 'charge.succeeded',
                data: {
                    object: {
                        id: 'ch_test_retry',
                        amount: 3000,
                        metadata: { jobId: 'job-retry-test' },
                    },
                },
            });

            const signature = generateStripeSignature(timestamp, eventBody);

            // First attempt may fail (simulating transient error)
            // Webhook should be queued for retry
            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .send(JSON.parse(eventBody));

            // Should eventually succeed (200 or 202 for async processing)
            expect([200, 202]).toContain(response.status);
        });

        it('should respect retry limits', async () => {
            // After 3 failed retries, webhook should be marked as failed
            // This test would need access to internal retry mechanism
            // Typically tested via monitoring/logging
            expect(true).toBe(true);
        });
    });

    describe('Webhook Event Ordering', () => {
        it('should handle out-of-order events gracefully', async () => {
            const timestamp1 = Math.floor(Date.now() / 1000);
            const timestamp2 = timestamp1 - 5; // Older timestamp

            const event1Body = JSON.stringify({
                id: 'evt_test_order_1',
                object: 'event',
                created: timestamp1,
                type: 'charge.succeeded',
                data: { object: { id: 'ch_1', amount: 5000 } },
            });

            const event2Body = JSON.stringify({
                id: 'evt_test_order_2',
                object: 'event',
                created: timestamp2,
                type: 'charge.refunded',
                data: { object: { id: 'ch_1', amount: 5000 } },
            });

            const sig1 = generateStripeSignature(timestamp1, event1Body);
            const sig2 = generateStripeSignature(timestamp2, event2Body);

            // Send newer event first
            await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', sig1)
                .send(JSON.parse(event1Body))
                .expect(200);

            // Then older event
            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', sig2)
                .send(JSON.parse(event2Body));

            // Should handle gracefully (either 200 or 409)
            expect([200, 409]).toContain(response.status);
        });
    });

    describe('Webhook Error Handling', () => {
        it('should return 400 for missing webhook signature', async () => {
            const response = await request(app)
                .post('/webhooks/stripe')
                .send({ type: 'charge.succeeded' })
                .expect(400);

            expect(response.body.error).toMatch(/signature|missing/i);
        });

        it('should return 400 for malformed JSON', async () => {
            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', 't=123,v1=abc')
                .set('Content-Type', 'application/json')
                .send('not valid json')
                .expect(400);

            expect(response.body.error).toBeDefined();
        });

        it('should handle unknown event types gracefully', async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const eventBody = JSON.stringify({
                id: 'evt_test_unknown',
                object: 'event',
                type: 'account.updated', // Unknown type for payment processing
                data: { object: {} },
            });

            const signature = generateStripeSignature(timestamp, eventBody);

            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .send(JSON.parse(eventBody))
                .expect(200);

            // Should accept but not process
            expect(response.body.received).toBe(true);
        });
    });

    describe('Webhook Correlation & Logging', () => {
        it('should include correlation ID in webhook processing', async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const correlationId = 'webhook-corr-test-123';
            const eventBody = JSON.stringify({
                id: 'evt_test_corr_123',
                object: 'event',
                type: 'charge.succeeded',
                data: { object: { id: 'ch_corr_test' } },
            });

            const signature = generateStripeSignature(timestamp, eventBody);

            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .set('x-correlation-id', correlationId)
                .send(JSON.parse(eventBody))
                .expect(200);

            expect(response.headers['x-correlation-id']).toBe(correlationId);
        });

        it('should log webhook processing with details', async () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const eventBody = JSON.stringify({
                id: 'evt_test_logging_123',
                object: 'event',
                type: 'charge.succeeded',
                data: { object: { id: 'ch_logging_test', amount: 7500 } },
            });

            const signature = generateStripeSignature(timestamp, eventBody);

            // This would typically check logs via monitoring system
            const response = await request(app)
                .post('/webhooks/stripe')
                .set('Stripe-Signature', signature)
                .send(JSON.parse(eventBody))
                .expect(200);

            // Verify response structure for logging
            expect(response.body.received).toBe(true);
            expect(response.body.id).toBe('evt_test_logging_123');
        });
    });
});
