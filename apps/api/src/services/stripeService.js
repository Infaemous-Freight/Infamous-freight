/**
 * Stripe Configuration & Utilities
 * 100% Payment Processing Setup
 * 
 * This file centralizes all Stripe configuration
 * and provides utility functions for payment operations
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration - 100% to merchant
const STRIPE_CONFIG = {
    // Account routing - set to null for direct account, or use Stripe Connect account ID
    connectAccountId: process.env.STRIPE_CONNECT_ACCOUNT_ID || null,

    // Application fee - 0% = 100% to merchant
    applicationFeePercent: 0,

    // Currencies supported
    supportedCurrencies: ['usd', 'eur', 'gbp', 'cad', 'aud'],

    // Default currency
    defaultCurrency: process.env.BILLING_CURRENCY || 'usd',

    // Stripe fee (2.9% + $0.30 for standard US cards)
    stripeFeePercent: 2.9,
    stripeFeeFixed: 0.30,

    // Webhook events to handle
    webhookEvents: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'charge.refunded',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'customer.subscription.trial_will_end',
    ],
};

/**
 * Calculate merchant revenue from customer payment
 * 100% after Stripe fees
 */
function calculateMerchantRevenue(amount, percent = STRIPE_CONFIG.stripeFeePercent, fixed = STRIPE_CONFIG.stripeFeeFixed) {
    const percentageFee = amount * (percent / 100);
    const totalFee = percentageFee + fixed;
    const merchantRevenue = amount - totalFee;
    return {
        customerPayment: amount,
        stripeFee: totalFee,
        merchantRevenue: merchantRevenue,
        merchantPercent: ((merchantRevenue / amount) * 100).toFixed(2),
    };
}

/**
 * Create payment intent - 100% to merchant
 */
async function createPaymentIntent(userId, userEmail, amount, currency = 'usd', description, metadata = {}) {
    try {
        const amountInCents = Math.round(parseFloat(amount) * 100);

        const paymentIntent = await stripe.paymentIntents.create(
            {
                amount: amountInCents,
                currency: currency.toLowerCase(),
                description: description || 'Payment from Infamous Freight Enterprises',
                metadata: {
                    userId,
                    userEmail,
                    merchantRevenue: calculateMerchantRevenue(amount).merchantRevenue.toFixed(2),
                    ...metadata,
                },
                receipt_email: userEmail,
                // 100% of payment goes to merchant - no application fee
            },
            STRIPE_CONFIG.connectAccountId ? { stripeAccount: STRIPE_CONFIG.connectAccountId } : {}
        );

        // Log to database
        await prisma.payment.create({
            data: {
                userId,
                stripePaymentIntentId: paymentIntent.id,
                amount: parseFloat(amount),
                currency: currency.toLowerCase(),
                status: paymentIntent.status,
                description,
                metadata: JSON.stringify({
                    revenue: calculateMerchantRevenue(amount),
                    ...metadata,
                }),
                type: 'ONE_TIME',
            },
        }).catch((err) => console.error('Failed to log payment:', err));

        return {
            success: true,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            revenue: calculateMerchantRevenue(amount),
        };
    } catch (error) {
        console.error('Failed to create payment intent:', error);
        throw error;
    }
}

/**
 * Create subscription - 100% recurring revenue to merchant
 */
async function createSubscription(userId, userEmail, priceId, metadata = {}) {
    try {
        // Get or create Stripe customer
        let customer;
        const existingCustomer = await prisma.stripeCustomer.findUnique({
            where: { userId },
        }).catch(() => null);

        if (existingCustomer?.stripeCustomerId) {
            customer = await stripe.customers.retrieve(
                existingCustomer.stripeCustomerId,
                STRIPE_CONFIG.connectAccountId ? { stripeAccount: STRIPE_CONFIG.connectAccountId } : {}
            );
        } else {
            customer = await stripe.customers.create(
                {
                    email: userEmail,
                    metadata: { userId, userEmail },
                },
                STRIPE_CONFIG.connectAccountId ? { stripeAccount: STRIPE_CONFIG.connectAccountId } : {}
            );

            await prisma.stripeCustomer.upsert({
                where: { userId },
                create: { userId, stripeCustomerId: customer.id },
                update: { stripeCustomerId: customer.id },
            }).catch((err) => console.error('Failed to save customer:', err));
        }

        // Create subscription - 100% to merchant
        const subscription = await stripe.subscriptions.create(
            {
                customer: customer.id,
                items: [{ price: priceId }],
                metadata: {
                    userId,
                    ...metadata,
                },
                automatic_tax: { enabled: true },
                // 100% of subscription revenue goes to merchant
            },
            STRIPE_CONFIG.connectAccountId ? { stripeAccount: STRIPE_CONFIG.connectAccountId } : {}
        );

        // Log to database
        await prisma.subscription.create({
            data: {
                userId,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: customer.id,
                stripePriceId: priceId,
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
        }).catch((err) => console.error('Failed to log subscription:', err));

        return {
            success: true,
            subscriptionId: subscription.id,
            status: subscription.status,
            nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
        };
    } catch (error) {
        console.error('Failed to create subscription:', error);
        throw error;
    }
}

/**
 * Cancel subscription - process refunds
 */
async function cancelSubscription(userId, subscriptionId) {
    try {
        // Verify ownership
        const subscription = await prisma.subscription.findFirst({
            where: {
                stripeSubscriptionId: subscriptionId,
                userId,
            },
        });

        if (!subscription) {
            throw new Error('Subscription not found or unauthorized');
        }

        // Cancel in Stripe
        await stripe.subscriptions.del(
            subscriptionId,
            STRIPE_CONFIG.connectAccountId ? { stripeAccount: STRIPE_CONFIG.connectAccountId } : {}
        );

        // Update database
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'cancelled' },
        });

        return {
            success: true,
            message: 'Subscription cancelled',
            subscriptionId,
        };
    } catch (error) {
        console.error('Failed to cancel subscription:', error);
        throw error;
    }
}

/**
 * Get revenue statistics
 */
async function getRevenueStats(periodDays = 30) {
    try {
        const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

        // One-time payments
        const paymentStats = await prisma.payment.aggregate({
            where: {
                status: 'succeeded',
                createdAt: { gte: startDate },
            },
            _sum: { amount: true },
            _count: true,
        });

        // Subscriptions
        const subscriptionStats = await prisma.subscription.findMany({
            where: { status: 'active' },
        });

        // Calculate revenue
        const totalOneTime = paymentStats._sum.amount || 0;
        const merchantOneTimeRevenue = calculateMerchantRevenue(totalOneTime).merchantRevenue;

        return {
            period: `${periodDays} days`,
            payments: {
                total: totalOneTime,
                count: paymentStats._count,
                merchantRevenue: merchantOneTimeRevenue,
            },
            subscriptions: {
                active: subscriptionStats.length,
                // MRR = Monthly Recurring Revenue (estimated)
                estimatedMRR: subscriptionStats.length * 99, // Average $99/month
            },
            totalMerchantRevenue: merchantOneTimeRevenue,
            currency: STRIPE_CONFIG.defaultCurrency,
            note: '100% of revenue goes to merchant account',
        };
    } catch (error) {
        console.error('Failed to get revenue stats:', error);
        throw error;
    }
}

/**
 * Handle webhook event
 */
async function handleWebhookEvent(event) {
    switch (event.type) {
        case 'payment_intent.succeeded':
            return await handlePaymentSucceeded(event.data.object);
        case 'payment_intent.payment_failed':
            return await handlePaymentFailed(event.data.object);
        case 'charge.refunded':
            return await handleRefund(event.data.object);
        case 'customer.subscription.updated':
            return await handleSubscriptionUpdated(event.data.object);
        case 'customer.subscription.deleted':
            return await handleSubscriptionDeleted(event.data.object);
        default:
            return { handled: false };
    }
}

/**
 * Payment succeeded handler
 */
async function handlePaymentSucceeded(paymentIntent) {
    try {
        await prisma.payment.update({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: { status: 'succeeded' },
        }).catch(() => { });
        return { handled: true };
    } catch (error) {
        console.error('Failed to handle payment succeeded:', error);
        return { handled: false };
    }
}

/**
 * Payment failed handler
 */
async function handlePaymentFailed(paymentIntent) {
    try {
        await prisma.payment.update({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: { status: 'failed' },
        }).catch(() => { });
        return { handled: true };
    } catch (error) {
        console.error('Failed to handle payment failed:', error);
        return { handled: false };
    }
}

/**
 * Refund handler
 */
async function handleRefund(charge) {
    try {
        console.log(`Refund processed: ${charge.id}, Amount: ${charge.refunded}`);
        return { handled: true };
    } catch (error) {
        console.error('Failed to handle refund:', error);
        return { handled: false };
    }
}

/**
 * Subscription updated handler
 */
async function handleSubscriptionUpdated(subscription) {
    try {
        await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
        }).catch(() => { });
        return { handled: true };
    } catch (error) {
        console.error('Failed to handle subscription updated:', error);
        return { handled: false };
    }
}

/**
 * Subscription deleted handler
 */
async function handleSubscriptionDeleted(subscription) {
    try {
        await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: { status: 'cancelled' },
        }).catch(() => { });
        return { handled: true };
    } catch (error) {
        console.error('Failed to handle subscription deleted:', error);
        return { handled: false };
    }
}

module.exports = {
    STRIPE_CONFIG,
    calculateMerchantRevenue,
    createPaymentIntent,
    createSubscription,
    cancelSubscription,
    getRevenueStats,
    handleWebhookEvent,
};
