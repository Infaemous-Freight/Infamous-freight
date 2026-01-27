/**
 * Instant Payment & Payout Service
 * Handles same-day payments, instant payouts, and transaction processing
 * Supports Stripe, PayPal, Direct Bank Transfer, and more
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Payment Service Configuration
 * Enables instant, same-day payouts for drivers and bonus recipients
 */
const PAYMENT_CONFIG = {
    // Instant payout settings
    instantPayout: {
        enabled: true,
        minAmount: 10.00,        // Minimum $10 for instant payout
        maxAmount: 25000.00,     // Maximum $25,000 per transaction
        feePercentage: 1.5,      // 1.5% instant payout fee
        processingTime: '0-15min', // Processing time
    },

    // Standard payout (next business day)
    standardPayout: {
        enabled: true,
        minAmount: 1.00,
        maxAmount: 100000.00,
        feePercentage: 0.25,     // 0.25% standard payout fee
        processingTime: '1-2 business days',
    },

    // Payment methods
    methods: {
        stripe: {
            enabled: true,
            instantPayoutSupport: true,
            currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        },
        paypal: {
            enabled: true,
            instantPayoutSupport: true,
            currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        },
        bankTransfer: {
            enabled: true,
            instantPayoutSupport: false,  // ACH takes 1-2 days
            currencies: ['USD'],
        },
        debitCard: {
            enabled: true,
            instantPayoutSupport: true,   // Instant to debit card
            currencies: ['USD'],
        },
    },

    // Fee structure
    fees: {
        instant: {
            percentage: 1.5,
            fixed: 0.25,           // $0.25 fixed fee
        },
        standard: {
            percentage: 0.25,
            fixed: 0.00,
        },
    },
};

/**
 * PaymentService Class
 * Manages all payment and payout operations
 */
class PaymentService {
    constructor() {
        this.config = PAYMENT_CONFIG;
    }

    /**
     * Request Instant Payout
     * Process same-day payment to recipient
     */
    async requestInstantPayout(payoutData) {
        try {
            const {
                recipientId,
                recipientType, // 'driver' | 'customer' | 'contractor'
                amount,
                currency = 'USD',
                method = 'stripe',
                destination,   // Bank account, card, PayPal email
                reason,
                metadata = {},
            } = payoutData;

            // Validation
            const validation = this.validatePayout(amount, method, 'instant');
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error,
                    code: 'VALIDATION_ERROR',
                };
            }

            // Calculate fees
            const fees = this.calculatePayoutFees(amount, 'instant');
            const netAmount = amount - fees.total;

            // Process based on payment method
            let payoutResult;
            switch (method) {
                case 'stripe':
                    payoutResult = await this.processStripePayout({
                        recipientId,
                        amount: netAmount,
                        currency,
                        destination,
                        instant: true,
                    });
                    break;

                case 'paypal':
                    payoutResult = await this.processPayPalPayout({
                        recipientId,
                        amount: netAmount,
                        currency,
                        destination,
                        instant: true,
                    });
                    break;

                case 'debitCard':
                    payoutResult = await this.processDebitCardPayout({
                        recipientId,
                        amount: netAmount,
                        currency,
                        destination,
                    });
                    break;

                default:
                    return {
                        success: false,
                        error: 'Unsupported payment method',
                        code: 'INVALID_METHOD',
                    };
            }

            // Return result
            return {
                success: true,
                payout: {
                    id: payoutResult.id,
                    recipientId,
                    recipientType,
                    amount,
                    netAmount,
                    currency,
                    method,
                    fees,
                    status: 'processing',
                    estimatedArrival: this.calculateArrivalTime('instant'),
                    reason,
                    processedAt: new Date().toISOString(),
                    metadata,
                },
                message: 'Instant payout initiated - funds arriving in 0-15 minutes',
            };
        } catch (error) {
            console.error('Instant payout error:', error);
            return {
                success: false,
                error: error.message,
                code: 'PAYOUT_FAILED',
            };
        }
    }

    /**
     * Request Standard Payout
     * Process next-business-day payment
     */
    async requestStandardPayout(payoutData) {
        try {
            const {
                recipientId,
                recipientType,
                amount,
                currency = 'USD',
                method = 'bankTransfer',
                destination,
                reason,
                metadata = {},
            } = payoutData;

            // Validation
            const validation = this.validatePayout(amount, method, 'standard');
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error,
                    code: 'VALIDATION_ERROR',
                };
            }

            // Calculate fees
            const fees = this.calculatePayoutFees(amount, 'standard');
            const netAmount = amount - fees.total;

            // Process payout
            const payoutResult = await this.processBankTransfer({
                recipientId,
                amount: netAmount,
                currency,
                destination,
            });

            return {
                success: true,
                payout: {
                    id: payoutResult.id,
                    recipientId,
                    recipientType,
                    amount,
                    netAmount,
                    currency,
                    method,
                    fees,
                    status: 'scheduled',
                    estimatedArrival: this.calculateArrivalTime('standard'),
                    reason,
                    scheduledAt: new Date().toISOString(),
                    metadata,
                },
                message: 'Standard payout scheduled - arriving in 1-2 business days',
            };
        } catch (error) {
            console.error('Standard payout error:', error);
            return {
                success: false,
                error: error.message,
                code: 'PAYOUT_FAILED',
            };
        }
    }

    /**
     * Process Stripe Instant Payout
     */
    async processStripePayout({ recipientId, amount, currency, destination, instant }) {
        try {
            // Create Stripe payout
            const payout = await stripe.payouts.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                destination: destination, // Stripe Connect account ID
                method: instant ? 'instant' : 'standard',
                metadata: {
                    recipientId,
                    timestamp: new Date().toISOString(),
                },
            });

            return {
                id: payout.id,
                status: payout.status,
                arrivalDate: payout.arrival_date,
            };
        } catch (error) {
            console.error('Stripe payout error:', error);
            throw new Error(`Stripe payout failed: ${error.message}`);
        }
    }

    /**
     * Process PayPal Instant Payout
     */
    async processPayPalPayout({ recipientId, amount, currency, destination, instant }) {
        try {
            // PayPal payout API integration
            const payoutId = `PP-${Date.now()}-${recipientId}`;

            // Simulate PayPal API call
            // In production, use PayPal Payouts API
            const mockPayoutResult = {
                id: payoutId,
                status: 'SUCCESS',
                recipientEmail: destination,
                amount,
                currency,
                processingTime: instant ? '0-15min' : '1-2 days',
            };

            return {
                id: mockPayoutResult.id,
                status: 'processing',
                arrivalDate: instant ? new Date().toISOString() : null,
            };
        } catch (error) {
            console.error('PayPal payout error:', error);
            throw new Error(`PayPal payout failed: ${error.message}`);
        }
    }

    /**
     * Process Direct Bank Transfer
     */
    async processBankTransfer({ recipientId, amount, currency, destination }) {
        try {
            const transferId = `ACH-${Date.now()}-${recipientId}`;

            // Simulate ACH transfer
            // In production, use Stripe ACH or Plaid
            const mockTransferResult = {
                id: transferId,
                status: 'pending',
                accountNumber: destination,
                amount,
                currency,
                estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            };

            return {
                id: mockTransferResult.id,
                status: 'scheduled',
                arrivalDate: mockTransferResult.estimatedArrival,
            };
        } catch (error) {
            console.error('Bank transfer error:', error);
            throw new Error(`Bank transfer failed: ${error.message}`);
        }
    }

    /**
     * Process Debit Card Instant Payout
     */
    async processDebitCardPayout({ recipientId, amount, currency, destination }) {
        try {
            const payoutId = `CARD-${Date.now()}-${recipientId}`;

            // Use Stripe instant payout to debit card
            const cardPayout = await stripe.payouts.create({
                amount: Math.round(amount * 100),
                currency: currency.toLowerCase(),
                destination: destination, // Card ID
                method: 'instant',
                metadata: {
                    recipientId,
                    type: 'debit_card',
                },
            });

            return {
                id: cardPayout.id,
                status: 'processing',
                arrivalDate: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Debit card payout error:', error);
            throw new Error(`Debit card payout failed: ${error.message}`);
        }
    }

    /**
     * Validate Payout Request
     */
    validatePayout(amount, method, type) {
        const typeConfig = type === 'instant'
            ? this.config.instantPayout
            : this.config.standardPayout;

        // Check if method supports instant
        if (type === 'instant' && !this.config.methods[method]?.instantPayoutSupport) {
            return {
                valid: false,
                error: `${method} does not support instant payouts`,
            };
        }

        // Check amount limits
        if (amount < typeConfig.minAmount) {
            return {
                valid: false,
                error: `Minimum payout amount is $${typeConfig.minAmount}`,
            };
        }

        if (amount > typeConfig.maxAmount) {
            return {
                valid: false,
                error: `Maximum payout amount is $${typeConfig.maxAmount}`,
            };
        }

        return { valid: true };
    }

    /**
     * Calculate Payout Fees
     */
    calculatePayoutFees(amount, type) {
        const feeConfig = type === 'instant'
            ? this.config.fees.instant
            : this.config.fees.standard;

        const percentageFee = (amount * feeConfig.percentage) / 100;
        const fixedFee = feeConfig.fixed;
        const total = percentageFee + fixedFee;

        return {
            percentage: percentageFee,
            fixed: fixedFee,
            total: parseFloat(total.toFixed(2)),
            rate: `${feeConfig.percentage}% + $${feeConfig.fixed}`,
        };
    }

    /**
     * Calculate Estimated Arrival Time
     */
    calculateArrivalTime(type) {
        if (type === 'instant') {
            // 15 minutes from now
            return new Date(Date.now() + 15 * 60 * 1000).toISOString();
        } else {
            // 2 business days
            const arrivalDate = new Date();
            arrivalDate.setDate(arrivalDate.getDate() + 2);
            return arrivalDate.toISOString();
        }
    }

    /**
     * Get Payout Status
     */
    async getPayoutStatus(payoutId, method) {
        try {
            if (method === 'stripe') {
                const payout = await stripe.payouts.retrieve(payoutId);
                return {
                    success: true,
                    status: payout.status,
                    arrivalDate: payout.arrival_date,
                    amount: payout.amount / 100,
                    currency: payout.currency.toUpperCase(),
                };
            }

            // For other methods, return mock status
            return {
                success: true,
                status: 'processing',
                message: 'Payout is being processed',
            };
        } catch (error) {
            console.error('Status check error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Process Bonus Payout
     * Special handler for bonus/reward payouts
     */
    async processBonusPayout({ userId, bonusId, amount, bonusType, paymentMethod }) {
        try {
            // Get user payment details
            const paymentDetails = await this.getUserPaymentDetails(userId);

            if (!paymentDetails) {
                return {
                    success: false,
                    error: 'No payment method configured',
                    code: 'NO_PAYMENT_METHOD',
                };
            }

            // Request instant payout for bonus
            const payout = await this.requestInstantPayout({
                recipientId: userId,
                recipientType: 'user',
                amount,
                method: paymentMethod || paymentDetails.preferredMethod,
                destination: paymentDetails.destination,
                reason: `${bonusType} bonus payout`,
                metadata: {
                    bonusId,
                    bonusType,
                    processedDate: new Date().toISOString(),
                },
            });

            return payout;
        } catch (error) {
            console.error('Bonus payout error:', error);
            return {
                success: false,
                error: error.message,
                code: 'BONUS_PAYOUT_FAILED',
            };
        }
    }

    /**
     * Get User Payment Details
     */
    async getUserPaymentDetails(userId) {
        // In production, fetch from database
        // Mock for now
        return {
            userId,
            preferredMethod: 'stripe',
            destination: 'acct_stripe_connect_id',
            verified: true,
            methods: ['stripe', 'paypal', 'debitCard'],
        };
    }

    /**
     * Batch Process Payouts
     * For processing multiple payouts at once (e.g., weekly driver payouts)
     */
    async batchProcessPayouts(payouts) {
        const results = [];

        for (const payout of payouts) {
            try {
                const result = payout.instant
                    ? await this.requestInstantPayout(payout)
                    : await this.requestStandardPayout(payout);

                results.push({
                    recipientId: payout.recipientId,
                    success: result.success,
                    payoutId: result.payout?.id,
                    amount: payout.amount,
                });
            } catch (error) {
                results.push({
                    recipientId: payout.recipientId,
                    success: false,
                    error: error.message,
                });
            }
        }

        return {
            success: true,
            processed: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
        };
    }

    /**
     * Get Payment Methods for User
     */
    async getAvailablePaymentMethods(userId, country = 'US') {
        const methods = [];

        // Add available methods based on country/region
        if (this.config.methods.stripe.enabled) {
            methods.push({
                id: 'stripe',
                name: 'Stripe',
                type: 'instant',
                fee: this.config.fees.instant,
                processingTime: '0-15 minutes',
                supported: true,
            });
        }

        if (this.config.methods.paypal.enabled) {
            methods.push({
                id: 'paypal',
                name: 'PayPal',
                type: 'instant',
                fee: this.config.fees.instant,
                processingTime: '0-15 minutes',
                supported: true,
            });
        }

        if (this.config.methods.debitCard.enabled) {
            methods.push({
                id: 'debitCard',
                name: 'Debit Card',
                type: 'instant',
                fee: this.config.fees.instant,
                processingTime: '0-15 minutes',
                supported: true,
            });
        }

        if (this.config.methods.bankTransfer.enabled) {
            methods.push({
                id: 'bankTransfer',
                name: 'Bank Transfer (ACH)',
                type: 'standard',
                fee: this.config.fees.standard,
                processingTime: '1-2 business days',
                supported: true,
            });
        }

        return {
            success: true,
            methods,
            defaultMethod: 'stripe',
        };
    }
}

// Export singleton instance
module.exports = new PaymentService();
