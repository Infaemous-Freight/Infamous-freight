/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Circuit Breaker Pattern for Stripe API
 */

const logger = require('../middleware/logger');

class CircuitBreakerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircuitBreakerError';
    }
}

class CircuitBreaker {
    constructor(operation, options = {}) {
        this.operation = operation;
        this.name = options.name || 'CircuitBreaker';

        // Configuration
        this.failureThreshold = options.failureThreshold || 5; // Number of failures before opening
        this.successThreshold = options.successThreshold || 2; // Number of successes before closing
        this.timeout = options.timeout || 60000; // Time to wait in OPEN state (ms)
        this.requestTimeout = options.requestTimeout || 10000; // Individual request timeout

        // State
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = Date.now();
        this.lastError = null;
    }

    async execute(args) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new CircuitBreakerError(
                    `Circuit breaker is OPEN. ${this.name} is unavailable. Retry after ${new Date(this.nextAttempt).toISOString()}`
                );
            }
            // Try HALF_OPEN
            this.state = 'HALF_OPEN';
            this.successCount = 0;
        }

        try {
            const result = await this._executeWithTimeout(args);
            this._onSuccess();
            return result;
        } catch (err) {
            this._onFailure(err);
            throw err;
        }
    }

    async _executeWithTimeout(args) {
        return Promise.race([
            this.operation(args),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Request timeout after ${this.requestTimeout}ms`)), this.requestTimeout)
            ),
        ]);
    }

    _onSuccess() {
        this.failureCount = 0;

        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                logger.info('Circuit breaker closing', { name: this.name });
                this.state = 'CLOSED';
                this.successCount = 0;
            }
        }
    }

    _onFailure(err) {
        this.failureCount++;
        this.lastError = err;
        this.successCount = 0;

        if (this.state === 'HALF_OPEN') {
            logger.warn('Circuit breaker opening (HALF_OPEN failure)', { name: this.name });
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
        } else if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
            logger.warn('Circuit breaker opening', { name: this.name, failures: this.failureCount });
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
        }
    }

    getStatus() {
        return {
            name: this.name,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastError: this.lastError?.message,
            nextAttempt: new Date(this.nextAttempt).toISOString(),
        };
    }

    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.lastError = null;
        this.nextAttempt = Date.now();
    }
}

// Create Stripe API circuit breaker
const stripeCheckoutBreaker = new CircuitBreaker(
    async (session) => {
        const stripe = require('./stripe');
        return await stripe.checkout.sessions.create(session);
    },
    {
        name: 'stripe-checkout',
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        requestTimeout: 10000,
    }
);

const stripeSubscriptionBreaker = new CircuitBreaker(
    async (subscription) => {
        const stripe = require('./stripe');
        return await stripe.subscriptions.create(subscription);
    },
    {
        name: 'stripe-subscription',
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        requestTimeout: 10000,
    }
);

const stripeCustomerBreaker = new CircuitBreaker(
    async (customer) => {
        const stripe = require('./stripe');
        return await stripe.customers.create(customer);
    },
    {
        name: 'stripe-customer',
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        requestTimeout: 10000,
    }
);

const stripeWebhookBreaker = new CircuitBreaker(
    async (payload) => {
        const stripe = require('./stripe');
        return stripe.webhooks.constructEvent(payload.body, payload.sig, payload.secret);
    },
    {
        name: 'stripe-webhook',
        failureThreshold: 10,
        successThreshold: 5,
        timeout: 30000,
        requestTimeout: 5000,
    }
);

// Health check endpoint for circuit breakers
function getCircuitBreakerStatus() {
    return {
        checkout: stripeCheckoutBreaker.getStatus(),
        subscription: stripeSubscriptionBreaker.getStatus(),
        customer: stripeCustomerBreaker.getStatus(),
        webhook: stripeWebhookBreaker.getStatus(),
    };
}

module.exports = {
    CircuitBreaker,
    CircuitBreakerError,
    stripeCheckoutBreaker,
    stripeSubscriptionBreaker,
    stripeCustomerBreaker,
    stripeWebhookBreaker,
    getCircuitBreakerStatus,
};
