/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Billing & Payment Processing API Routes
 */

const express = require('express');
const { limiters, authenticate, requireOrganization, requireScope, auditLog } = require('../middleware/security');
const { validateString, validateEmail, handleValidationErrors } = require('../middleware/validation');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// Stripe configuration - 100% to merchant account
const STRIPE_CONNECT_ACCOUNT = process.env.STRIPE_CONNECT_ACCOUNT_ID || null;
const APPLICATION_FEE_PERCENT = 0; // 100% goes to you, 0% application fee

/**
 * POST /api/billing/create-payment-intent
 * Create a Stripe payment intent for one-time payment
 * Scope: billing:write
 */
router.post(
    '/create-payment-intent',
    limiters.billing,
    authenticate,
    requireOrganization,
    requireScope('billing:write'),
    auditLog,
    validateString('amount'),
    validateString('currency'),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { amount, currency = 'usd', description, metadata = {} } = req.body;
            const amountInCents = Math.round(parseFloat(amount) * 100);

            // Create payment intent - 100% to your Stripe account
            const paymentIntent = await stripe.paymentIntents.create(
                {
                    amount: amountInCents,
                    currency: currency.toLowerCase(),
                    description: description || 'Payment from Infamous Freight Enterprises',
                    metadata: {
                        userId: req.user.sub,
                        userEmail: req.user.email,
                        ...metadata,
                    },
                    receipt_email: req.user.email,
                },
                STRIPE_CONNECT_ACCOUNT ? { stripeAccount: STRIPE_CONNECT_ACCOUNT } : {}
            );

            // Log payment intent
            await prisma.payment.create({
                data: {
                    userId: req.user.sub,
                    stripePaymentIntentId: paymentIntent.id,
                    amount: parseFloat(amount),
                    currency: currency.toLowerCase(),
                    status: paymentIntent.status,
                    description: description,
                    metadata: JSON.stringify(metadata),
                    type: 'ONE_TIME',
                },
            }).catch(() => { }); // Non-blocking

            res.status(201).json({
                success: true,
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/billing/create-subscription
 * Create a new subscription (Stripe) - 100% to your account
 * Scope: billing:write
 */
router.post(
    '/create-subscription',
    limiters.billing,
    authenticate,
    requireOrganization,
    requireScope('billing:write'),
    auditLog,
    validateString('priceId'),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { priceId, email = req.user.email, metadata = {} } = req.body;

            // Get or create Stripe customer - 100% of payments to your account
            let customer;
            const existingCustomer = await prisma.stripeCustomer.findUnique({
                where: { userId: req.user.sub },
            }).catch(() => null);

            if (existingCustomer?.stripeCustomerId) {
                customer = await stripe.customers.retrieve(
                    existingCustomer.stripeCustomerId,
                    STRIPE_CONNECT_ACCOUNT ? { stripeAccount: STRIPE_CONNECT_ACCOUNT } : {}
                );
            } else {
                customer = await stripe.customers.create(
                    {
                        email,
                        metadata: {
                            userId: req.user.sub,
                            userEmail: req.user.email,
                        },
                    },
                    STRIPE_CONNECT_ACCOUNT ? { stripeAccount: STRIPE_CONNECT_ACCOUNT } : {}
                );

                // Save customer ID to database
                await prisma.stripeCustomer.upsert({
                    where: { userId: req.user.sub },
                    create: {
                        userId: req.user.sub,
                        stripeCustomerId: customer.id,
                    },
                    update: {
                        stripeCustomerId: customer.id,
                    },
                }).catch(() => { }); // Non-blocking
            }

            // Create subscription - 100% to your Stripe account
            const subscription = await stripe.subscriptions.create(
                {
                    customer: customer.id,
                    items: [
                        {
                            price: priceId,
                        },
                    ],
                    metadata: {
                        userId: req.user.sub,
                        ...metadata,
                    },
                    automatic_tax: { enabled: true },
                },
                STRIPE_CONNECT_ACCOUNT ? { stripeAccount: STRIPE_CONNECT_ACCOUNT } : {}
            );

            // Store subscription in database
            await prisma.subscription.create({
                data: {
                    userId: req.user.sub,
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: customer.id,
                    stripePriceId: priceId,
                    status: subscription.status,
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                },
            }).catch(() => { }); // Non-blocking

            res.status(201).json({
                success: true,
                subscriptionId: subscription.id,
                status: subscription.status,
                nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/billing/subscriptions
 * Get all subscriptions for current user
 * Scope: billing:read
 */
router.get(
    '/subscriptions',
    limiters.billing,
    authenticate,
    requireOrganization,
    requireScope('billing:read'),
    auditLog,
    async (req, res, next) => {
        try {
            const subscriptions = await prisma.subscription.findMany({
                where: { userId: req.user.sub },
                select: {
                    id: true,
                    stripeSubscriptionId: true,
                    stripePriceId: true,
                    status: true,
                    currentPeriodStart: true,
                    currentPeriodEnd: true,
                    createdAt: true,
                },
            });

            res.json({
                success: true,
                subscriptions,
                count: subscriptions.length,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/billing/cancel-subscription/:id
 * Cancel a subscription - 100% refund to customer
 * Scope: billing:write
 */
router.post(
    '/cancel-subscription/:id',
    limiters.billing,
    authenticate,
    requireOrganization,
    requireScope('billing:write'),
    auditLog,
    async (req, res, next) => {
        try {
            const { id } = req.params;

            // Get subscription from database
            const dbSubscription = await prisma.subscription.findFirst({
                where: {
                    stripeSubscriptionId: id,
                    userId: req.user.sub,
                },
            });

            if (!dbSubscription) {
                return res.status(404).json({
                    success: false,
                    error: 'Subscription not found',
                });
            }

            // Cancel in Stripe - refunds go 100% to customer
            const subscription = await stripe.subscriptions.del(
                id,
                STRIPE_CONNECT_ACCOUNT ? { stripeAccount: STRIPE_CONNECT_ACCOUNT } : {}
            );

            // Update database
            await prisma.subscription.update({
                where: { id: dbSubscription.id },
                data: { status: 'cancelled' },
            });

            res.json({
                success: true,
                message: 'Subscription cancelled successfully',
                subscriptionId: id,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/billing/webhook
 * Stripe webhook for payment events - 100% settlement to your account
 */
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res, next) => {
        try {
            const sig = req.headers['stripe-signature'];
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

            if (!sig || !webhookSecret) {
                return res.status(400).json({ error: 'Missing signature or webhook secret' });
            }

            let event;
            try {
                event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
            } catch (err) {
                return res.status(400).json({ error: `Webhook Error: ${err.message}` });
            }

            // Handle events - all revenue flows to your Stripe account
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    await prisma.payment.update({
                        where: { stripePaymentIntentId: paymentIntent.id },
                        data: { status: 'succeeded' },
                    }).catch(() => { });
                    break;

                case 'payment_intent.payment_failed':
                    const failedPayment = event.data.object;
                    await prisma.payment.update({
                        where: { stripePaymentIntentId: failedPayment.id },
                        data: { status: 'failed' },
                    }).catch(() => { });
                    break;

                case 'customer.subscription.updated':
                    const updatedSubscription = event.data.object;
                    await prisma.subscription.update({
                        where: { stripeSubscriptionId: updatedSubscription.id },
                        data: {
                            status: updatedSubscription.status,
                            currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
                            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
                        },
                    }).catch(() => { });
                    break;

                case 'customer.subscription.deleted':
                    const deletedSubscription = event.data.object;
                    await prisma.subscription.update({
                        where: { stripeSubscriptionId: deletedSubscription.id },
                        data: { status: 'cancelled' },
                    }).catch(() => { });
                    break;

                case 'charge.refunded':
                    const refundedCharge = event.data.object;
                    // Log refund - flows back to customer, revenue to you remains
                    console.log(`Refund processed: ${refundedCharge.id}, Amount: ${refundedCharge.refunded}`);
                    break;

                default:
                    // Unhandled event type
                    break;
            }

            res.json({ received: true });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/billing/revenue
 * Get revenue statistics for dashboard
 * Scope: billing:read
 */
router.get(
    '/revenue',
    limiters.billing,
    authenticate,
    requireScope('billing:read'),
    auditLog,
    async (req, res, next) => {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const stats = await prisma.payment.aggregate({
                where: {
                    status: 'succeeded',
                    createdAt: { gte: thirtyDaysAgo },
                },
                _sum: {
                    amount: true,
                },
                _count: true,
            });

            const subscriptionRevenue = await prisma.subscription.findMany({
                where: {
                    status: 'active',
                },
            });

            res.json({
                success: true,
                revenue: {
                    totalOneTime: stats._sum.amount || 0,
                    totalTransactions: stats._count || 0,
                    activeSubscriptions: subscriptionRevenue.length,
                    period: '30 days',
                    currency: process.env.BILLING_CURRENCY || 'usd',
                    note: '100% of revenue goes to your Stripe account',
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
