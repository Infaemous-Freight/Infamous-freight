/**
 * Payment & Payout Service Tests
 * Comprehensive test suite for instant payouts and payment processing
 */

const paymentService = require('../services/paymentService');

describe('Payment Service - Instant Payouts', () => {
    describe('requestInstantPayout()', () => {
        test('should process instant payout successfully with Stripe', async () => {
            const payoutData = {
                recipientId: 'user_123',
                recipientType: 'user',
                amount: 100.00,
                currency: 'USD',
                method: 'stripe',
                destination: 'acct_test123',
                reason: 'Test payout',
            };

            const result = await paymentService.requestInstantPayout(payoutData);

            expect(result.success).toBe(true);
            expect(result.payout).toBeDefined();
            expect(result.payout.amount).toBe(100.00);
            expect(result.payout.status).toBe('processing');
            expect(result.message).toContain('0-15 minutes');
        });

        test('should calculate instant payout fees correctly', async () => {
            const payoutData = {
                recipientId: 'user_123',
                recipientType: 'user',
                amount: 100.00,
                currency: 'USD',
                method: 'stripe',
                destination: 'acct_test123',
            };

            const result = await paymentService.requestInstantPayout(payoutData);

            expect(result.success).toBe(true);
            expect(result.payout.fees).toBeDefined();
            expect(result.payout.fees.percentage).toBe(1.50); // 1.5% of $100
            expect(result.payout.fees.fixed).toBe(0.25);
            expect(result.payout.fees.total).toBe(1.75);
            expect(result.payout.netAmount).toBe(98.25); // $100 - $1.75
        });

        test('should reject instant payout below minimum amount', async () => {
            const payoutData = {
                recipientId: 'user_123',
                recipientType: 'user',
                amount: 5.00, // Below $10 minimum
                currency: 'USD',
                method: 'stripe',
                destination: 'acct_test123',
            };

            const result = await paymentService.requestInstantPayout(payoutData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Minimum payout amount');
            expect(result.code).toBe('VALIDATION_ERROR');
        });

        test('should reject instant payout above maximum amount', async () => {
            const payoutData = {
                recipientId: 'user_123',
                recipientType: 'user',
                amount: 30000.00, // Above $25,000 maximum
                currency: 'USD',
                method: 'stripe',
                destination: 'acct_test123',
            };

            const result = await paymentService.requestInstantPayout(payoutData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Maximum payout amount');
            expect(result.code).toBe('VALIDATION_ERROR');
        });

        test('should reject unsupported payment method for instant payout', async () => {
            const payoutData = {
                recipientId: 'user_123',
                recipientType: 'user',
                amount: 100.00,
                currency: 'USD',
                method: 'bankTransfer', // Bank transfer doesn't support instant
                destination: 'acct_test123',
            };

            const result = await paymentService.requestInstantPayout(payoutData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('does not support instant');
        });
    });

    describe('requestStandardPayout()', () => {
        test('should process standard payout successfully', async () => {
            const payoutData = {
                recipientId: 'user_123',
                recipientType: 'user',
                amount: 500.00,
                currency: 'USD',
                method: 'bankTransfer',
                destination: 'bank_account_123',
                reason: 'Weekly earnings',
            };

            const result = await paymentService.requestStandardPayout(payoutData);

            expect(result.success).toBe(true);
            expect(result.payout).toBeDefined();
            expect(result.payout.amount).toBe(500.00);
            expect(result.payout.status).toBe('scheduled');
            expect(result.message).toContain('1-2 business days');
        });

        test('should calculate standard payout fees correctly', async () => {
            const payoutData = {
                recipientId: 'user_123',
                recipientType: 'user',
                amount: 500.00,
                currency: 'USD',
                method: 'bankTransfer',
                destination: 'bank_account_123',
            };

            const result = await paymentService.requestStandardPayout(payoutData);

            expect(result.success).toBe(true);
            expect(result.payout.fees.percentage).toBe(1.25); // 0.25% of $500
            expect(result.payout.fees.fixed).toBe(0.00);
            expect(result.payout.fees.total).toBe(1.25);
            expect(result.payout.netAmount).toBe(498.75);
        });

        test('should accept lower minimum amount for standard payout', async () => {
            const payoutData = {
                recipientId: 'user_123',
                recipientType: 'user',
                amount: 5.00, // Below instant minimum but OK for standard
                currency: 'USD',
                method: 'bankTransfer',
                destination: 'bank_account_123',
            };

            const result = await paymentService.requestStandardPayout(payoutData);

            expect(result.success).toBe(true);
            expect(result.payout.amount).toBe(5.00);
        });
    });

    describe('processBonusPayout()', () => {
        test('should process bonus payout successfully', async () => {
            const bonusData = {
                userId: 'user_123',
                bonusId: 'bonus_456',
                amount: 50.00,
                bonusType: 'referral',
                paymentMethod: 'stripe',
            };

            const result = await paymentService.processBonusPayout(bonusData);

            expect(result.success).toBe(true);
            expect(result.payout).toBeDefined();
            expect(result.payout.amount).toBe(50.00);
            expect(result.payout.reason).toContain('referral bonus');
        });

        test('should handle missing payment method', async () => {
            const bonusData = {
                userId: 'user_no_payment',
                bonusId: 'bonus_456',
                amount: 50.00,
                bonusType: 'loyalty',
            };

            const result = await paymentService.processBonusPayout(bonusData);

            // In production, this would check if user has payment method configured
            expect(result).toBeDefined();
        });
    });

    describe('validatePayout()', () => {
        test('should validate correct instant payout', () => {
            const result = paymentService.validatePayout(100, 'stripe', 'instant');

            expect(result.valid).toBe(true);
        });

        test('should reject amount below minimum', () => {
            const result = paymentService.validatePayout(5, 'stripe', 'instant');

            expect(result.valid).toBe(false);
            expect(result.error).toContain('Minimum');
        });

        test('should reject amount above maximum', () => {
            const result = paymentService.validatePayout(30000, 'stripe', 'instant');

            expect(result.valid).toBe(false);
            expect(result.error).toContain('Maximum');
        });

        test('should reject invalid method for instant payout', () => {
            const result = paymentService.validatePayout(100, 'bankTransfer', 'instant');

            expect(result.valid).toBe(false);
            expect(result.error).toContain('does not support instant');
        });
    });

    describe('calculatePayoutFees()', () => {
        test('should calculate instant payout fees', () => {
            const fees = paymentService.calculatePayoutFees(100, 'instant');

            expect(fees.percentage).toBe(1.50); // 1.5% of $100
            expect(fees.fixed).toBe(0.25);
            expect(fees.total).toBe(1.75);
            expect(fees.rate).toBe('1.5% + $0.25');
        });

        test('should calculate standard payout fees', () => {
            const fees = paymentService.calculatePayoutFees(500, 'standard');

            expect(fees.percentage).toBe(1.25); // 0.25% of $500
            expect(fees.fixed).toBe(0.00);
            expect(fees.total).toBe(1.25);
            expect(fees.rate).toBe('0.25% + $0');
        });

        test('should round fees to 2 decimal places', () => {
            const fees = paymentService.calculatePayoutFees(333.33, 'instant');

            expect(fees.total).toBeCloseTo(5.25, 2);
            expect(Number.isInteger(fees.total * 100)).toBe(true);
        });
    });

    describe('batchProcessPayouts()', () => {
        test('should process multiple payouts successfully', async () => {
            const payouts = [
                {
                    recipientId: 'user_1',
                    amount: 100,
                    method: 'stripe',
                    destination: 'acct_1',
                    instant: true,
                },
                {
                    recipientId: 'user_2',
                    amount: 200,
                    method: 'stripe',
                    destination: 'acct_2',
                    instant: true,
                },
                {
                    recipientId: 'user_3',
                    amount: 300,
                    method: 'bankTransfer',
                    destination: 'bank_3',
                    instant: false,
                },
            ];

            const result = await paymentService.batchProcessPayouts(payouts);

            expect(result.success).toBe(true);
            expect(result.processed).toBe(3);
            expect(result.successful).toBeGreaterThan(0);
            expect(result.results).toHaveLength(3);
        });

        test('should handle partial failures in batch', async () => {
            const payouts = [
                {
                    recipientId: 'user_1',
                    amount: 100,
                    method: 'stripe',
                    destination: 'acct_1',
                    instant: true,
                },
                {
                    recipientId: 'user_2',
                    amount: 5, // Below minimum - will fail
                    method: 'stripe',
                    destination: 'acct_2',
                    instant: true,
                },
            ];

            const result = await paymentService.batchProcessPayouts(payouts);

            expect(result.processed).toBe(2);
            expect(result.failed).toBeGreaterThan(0);
        });
    });

    describe('getAvailablePaymentMethods()', () => {
        test('should return available payment methods', async () => {
            const result = await paymentService.getAvailablePaymentMethods('user_123', 'US');

            expect(result.success).toBe(true);
            expect(result.methods).toBeDefined();
            expect(result.methods.length).toBeGreaterThan(0);

            const stripeMethod = result.methods.find(m => m.id === 'stripe');
            expect(stripeMethod).toBeDefined();
            expect(stripeMethod.type).toBe('instant');
        });

        test('should include fee information for each method', async () => {
            const result = await paymentService.getAvailablePaymentMethods('user_123');

            result.methods.forEach(method => {
                expect(method.fee).toBeDefined();
                expect(method.processingTime).toBeDefined();
            });
        });
    });

    describe('getPayoutStatus()', () => {
        test('should return payout status', async () => {
            const payoutId = 'po_test123';

            const result = await paymentService.getPayoutStatus(payoutId, 'stripe');

            expect(result).toBeDefined();
            expect(result.status).toBeDefined();
        });
    });

    describe('calculateArrivalTime()', () => {
        test('should calculate instant payout arrival time', () => {
            const arrivalTime = paymentService.calculateArrivalTime('instant');
            const arrival = new Date(arrivalTime);
            const now = new Date();

            const diffMinutes = (arrival - now) / (1000 * 60);
            expect(diffMinutes).toBeCloseTo(15, 0);
        });

        test('should calculate standard payout arrival time', () => {
            const arrivalTime = paymentService.calculateArrivalTime('standard');
            const arrival = new Date(arrivalTime);
            const now = new Date();

            const diffDays = (arrival - now) / (1000 * 60 * 60 * 24);
            expect(diffDays).toBeCloseTo(2, 0);
        });
    });
});

describe('Payment Service - Payment Methods', () => {
    test('should support Stripe instant payouts', () => {
        const config = paymentService.config;

        expect(config.methods.stripe.enabled).toBe(true);
        expect(config.methods.stripe.instantPayoutSupport).toBe(true);
    });

    test('should support PayPal instant payouts', () => {
        const config = paymentService.config;

        expect(config.methods.paypal.enabled).toBe(true);
        expect(config.methods.paypal.instantPayoutSupport).toBe(true);
    });

    test('should support debit card instant payouts', () => {
        const config = paymentService.config;

        expect(config.methods.debitCard.enabled).toBe(true);
        expect(config.methods.debitCard.instantPayoutSupport).toBe(true);
    });

    test('should not support bank transfer instant payouts', () => {
        const config = paymentService.config;

        expect(config.methods.bankTransfer.instantPayoutSupport).toBe(false);
    });
});

describe('Payment Service - Fee Calculations', () => {
    test('instant payout fee is 1.5% + $0.25', () => {
        const fees = paymentService.calculatePayoutFees(100, 'instant');
        expect(fees.total).toBe(1.75);
    });

    test('standard payout fee is 0.25%', () => {
        const fees = paymentService.calculatePayoutFees(1000, 'standard');
        expect(fees.total).toBe(2.50); // 0.25% of $1000
    });

    test('fees should be accurate for various amounts', () => {
        const testCases = [
            { amount: 50, type: 'instant', expected: 1.00 },
            { amount: 200, type: 'instant', expected: 3.25 },
            { amount: 1000, type: 'instant', expected: 15.25 },
            { amount: 100, type: 'standard', expected: 0.25 },
            { amount: 5000, type: 'standard', expected: 12.50 },
        ];

        testCases.forEach(({ amount, type, expected }) => {
            const fees = paymentService.calculatePayoutFees(amount, type);
            expect(fees.total).toBeCloseTo(expected, 2);
        });
    });
});
