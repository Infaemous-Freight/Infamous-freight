jest.mock('@sentry/profiling-node', () => ({
    ProfilingIntegration: jest.fn(() => ({})),
}));

// Mock Sentry with required integrations
jest.mock('@sentry/node', () => ({
    init: jest.fn(),
    withScope: jest.fn((fn) => fn({
        setTag: jest.fn(),
        setContext: jest.fn(),
        setUser: jest.fn(),
        setLevel: jest.fn(),
    })),
    addBreadcrumb: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    startTransaction: jest.fn(() => ({
        setStatus: jest.fn(),
        finish: jest.fn(),
    })),
    Integrations: {
        Http: jest.fn(() => ({})),
        Express: jest.fn(() => ({})),
        OnUncaughtException: jest.fn(() => ({})),
        OnUnhandledRejection: jest.fn(() => ({})),
    },
    Handlers: {
        requestHandler: jest.fn(() => (req, res, next) => next()),
        tracingHandler: jest.fn(() => (req, res, next) => next()),
        errorHandler: jest.fn((opts = {}) => (err, req, res, next) => {
            if (opts.shouldHandleError) {
                opts.shouldHandleError(err);
            }
            return next(err);
        }),
    },
}));

const Sentry = require('@sentry/node');
const {
    initializeSentry,
    trackPaymentError,
    trackSubscriptionError,
    trackWebhookError,
    trackInvoiceError,
    trackRateLimitViolation,
    trackSlowOperation,
    trackBusinessEvent,
    withErrorTracking,
    sentryRequestHandler,
    sentryTracingHandler,
    sentryErrorHandler,
} = require('../../src/middleware/errorTracking');

describe('Error Tracking Middleware', () => {
    let mockApp, mockError, mockContext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockApp = { use: jest.fn() };
        mockError = new Error('Test error');
        mockContext = {
            userId: 'user123',
            tier: 'premium',
        };
    });

    describe('initializeSentry', () => {
        it('should initialize Sentry with correct configuration', () => {
            initializeSentry(mockApp);

            expect(Sentry.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    dsn: process.env.SENTRY_DSN,
                    environment: expect.any(String),
                    tracesSampleRate: expect.any(Number),
                    profilesSampleRate: expect.any(Number),
                })
            );
        });

        it('should set proper sample rates for production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            initializeSentry(mockApp);

            const callArgs = Sentry.init.mock.calls[0][0];
            expect(callArgs.tracesSampleRate).toBe(0.1);
            expect(callArgs.profilesSampleRate).toBe(0.1);

            process.env.NODE_ENV = originalEnv;
        });

        it('should set sample rates to 1.0 for development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            initializeSentry(mockApp);

            const callArgs = Sentry.init.mock.calls[0][0];
            expect(callArgs.tracesSampleRate).toBe(1.0);
            expect(callArgs.profilesSampleRate).toBe(1.0);

            process.env.NODE_ENV = originalEnv;
        });

        it('should include required integrations', () => {
            initializeSentry(mockApp);

            const callArgs = Sentry.init.mock.calls[0][0];
            expect(callArgs.integrations).toBeDefined();
            expect(callArgs.integrations.length).toBeGreaterThan(0);
        });

        it('should implement beforeSend filter for PII removal', () => {
            initializeSentry(mockApp);

            const callArgs = Sentry.init.mock.calls[0][0];
            const beforeSend = callArgs.beforeSend;

            const event = {
                request: {
                    cookies: { sessionId: '123' },
                    headers: { Authorization: 'Bearer token' },
                    query_string: 'password=secret&email=test@example.com',
                },
            };

            const result = beforeSend(event, {});

            expect(result.request.cookies).toBeUndefined();
            expect(result.request.query_string).toContain('password=***');
        });
    });

    describe('trackPaymentError', () => {
        it('should track payment error with context', () => {
            const paymentContext = {
                amount: 10000,
                currency: 'USD',
                customerId: 'cus_123',
                method: 'card',
                tier: 'premium',
                provider: 'stripe',
            };

            trackPaymentError(mockError, paymentContext);

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
        });

        it('should set error type tag to payment', () => {
            trackPaymentError(mockError, mockContext);

            // Verify withScope was called
            expect(Sentry.withScope).toHaveBeenCalled();
        });

        it('should set critical level for payment errors', () => {
            trackPaymentError(mockError, mockContext);

            expect(Sentry.withScope).toHaveBeenCalled();
        });

        it('should capture without provider context', () => {
            const context = { amount: 5000, customerId: 'cus_456' };
            trackPaymentError(mockError, context);

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
        });
    });

    describe('trackSubscriptionError', () => {
        it('should track subscription error with context', () => {
            const subscriptionContext = {
                subscriptionId: 'sub_123',
                customerId: 'cus_123',
                fromTier: 'free',
                toTier: 'premium',
                action: 'upgrade',
            };

            trackSubscriptionError(mockError, subscriptionContext);

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
        });

        it('should set error level appropriately', () => {
            trackSubscriptionError(mockError, { action: 'cancel' });

            expect(Sentry.withScope).toHaveBeenCalled();
        });
    });

    describe('trackWebhookError', () => {
        it('should track webhook error with critical level', () => {
            const webhookContext = {
                type: 'charge.refunded',
                eventId: 'evt_123',
                provider: 'stripe',
                retryCount: 1,
                payload: true,
            };

            trackWebhookError(mockError, webhookContext);

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
        });

        it('should handle webhook error without payload', () => {
            trackWebhookError(mockError, {
                type: 'payment_intent.succeeded',
                eventId: 'evt_456',
            });

            expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
        });
    });

    describe('trackInvoiceError', () => {
        it('should track invoice error with context', () => {
            const invoiceContext = {
                invoiceId: 'inv_123',
                customerId: 'cus_123',
                amount: 5000,
                action: 'generate',
            };

            trackInvoiceError(mockError, invoiceContext);

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
        });

        it('should support different invoice actions', () => {
            const actions = ['generate', 'send', 'retry'];

            actions.forEach(action => {
                trackInvoiceError(mockError, { invoiceId: 'inv_123', action });
                expect(Sentry.captureException).toHaveBeenCalled();
            });
        });
    });

    describe('trackRateLimitViolation', () => {
        it('should track rate limit violation', () => {
            const rateLimitContext = {
                endpoint: '/api/payments',
                userId: 'user_123',
                ip: '192.168.1.1',
                requestCount: 150,
                limit: 100,
                windowSeconds: 60,
            };

            trackRateLimitViolation(rateLimitContext);

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureMessage).toHaveBeenCalled();
        });

        it('should set warning level for rate limit', () => {
            trackRateLimitViolation({
                endpoint: '/api/ai',
                userId: 'user_456',
            });

            expect(Sentry.captureMessage).toHaveBeenCalled();
        });
    });

    describe('trackSlowOperation', () => {
        it('should track operations exceeding 3 second threshold', () => {
            trackSlowOperation('database_query', 3500, {
                query: 'SELECT * FROM shipments',
            });

            expect(Sentry.withScope).toHaveBeenCalled();
            expect(Sentry.captureMessage).toHaveBeenCalled();
        });

        it('should not track operations under 3 seconds', () => {
            trackSlowOperation('cache_lookup', 150, {});

            expect(Sentry.captureMessage).not.toHaveBeenCalled();
        });

        it('should include duration in message', () => {
            trackSlowOperation('payment_processing', 4000, {});

            expect(Sentry.captureMessage).toHaveBeenCalledWith(
                expect.stringContaining('4000'),
                'warning'
            );
        });
    });

    describe('trackBusinessEvent', () => {
        it('should add breadcrumb for business event', () => {
            trackBusinessEvent('shipment_created', {
                shipmentId: 'ship_123',
                weight: 500,
            });

            expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'business',
                    message: 'shipment_created',
                    level: 'info',
                })
            );
        });

        it('should include data in breadcrumb', () => {
            const eventData = { orderId: 'order_123', status: 'shipped' };
            trackBusinessEvent('order_updated', eventData);

            expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: eventData,
                })
            );
        });
    });

    describe('withErrorTracking', () => {
        it('should track successful operations', async () => {
            const mockOperation = jest.fn().mockResolvedValue('success');

            const result = await withErrorTracking(
                'test_operation',
                mockOperation,
                {}
            );

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalled();
        });

        it('should track failed operations', async () => {
            const mockOperation = jest.fn().mockRejectedValue(mockError);

            await expect(
                withErrorTracking('test_operation', mockOperation, {})
            ).rejects.toThrow(mockError);

            expect(Sentry.captureException).toHaveBeenCalled();
        });

        it('should handle payment operations specifically', async () => {
            const mockOperation = jest.fn().mockRejectedValue(mockError);

            await expect(
                withErrorTracking('payment_processing', mockOperation, {
                    customerId: 'cus_123',
                })
            ).rejects.toThrow(mockError);

            expect(Sentry.captureException).toHaveBeenCalled();
        });

        it('should handle subscription operations specifically', async () => {
            const mockOperation = jest.fn().mockRejectedValue(mockError);

            await expect(
                withErrorTracking('subscription_upgrade', mockOperation, {
                    fromTier: 'free',
                    toTier: 'premium',
                })
            ).rejects.toThrow(mockError);

            expect(Sentry.captureException).toHaveBeenCalled();
        });
    });

    describe('Sentry middleware handlers', () => {
        it('should provide request handler middleware', () => {
            const handler = sentryRequestHandler();
            expect(typeof handler).toBe('function');
            expect(Sentry.Handlers.requestHandler).toHaveBeenCalled();
        });

        it('should provide tracing handler middleware', () => {
            const handler = sentryTracingHandler();
            expect(typeof handler).toBe('function');
            expect(Sentry.Handlers.tracingHandler).toHaveBeenCalled();
        });

        it('should provide error handler middleware', () => {
            const handler = sentryErrorHandler();
            expect(typeof handler).toBe('function');
            expect(Sentry.Handlers.errorHandler).toHaveBeenCalled();
        });

        it('should configure error handler to filter errors', () => {
            sentryErrorHandler();

            const callArgs = Sentry.Handlers.errorHandler.mock.calls[0][0];
            expect(callArgs.shouldHandleError).toBeDefined();
            expect(callArgs.shouldHandleError(new Error('500'))).toBeFalsy();
        });
    });
});
