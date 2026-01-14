const errorHandler = require('../../src/middleware/errorHandler');
const Sentry = require('@sentry/node');

describe('Error Handler Middleware', () => {
    let req, res, next, originalEnv;

    beforeEach(() => {
        originalEnv = process.env.NODE_ENV;
        req = {
            method: 'GET',
            path: '/test',
            originalUrl: '/test',
            user: null,
            correlationId: 'test-correlation-123',
            hostname: 'localhost',
            ip: '127.0.0.1',
            headers: {},
            get: jest.fn(),
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('should handle error with default 500 status', () => {
        const error = new Error('Test error');

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Test error',
        });
    });

    it('should use error.status if provided', () => {
        const error = new Error('Not found');
        error.status = 404;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Not found',
        });
    });

    it('should use error.statusCode if provided', () => {
        const error = new Error('Bad request');
        error.statusCode = 400;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should log error details', () => {
        const error = new Error('Test error');
        error.stack = 'Error stack trace';

        errorHandler(error, req, res, next);

        expect(console.error).toHaveBeenCalledWith(
            'Request failed',
            expect.objectContaining({
                method: 'GET',
                path: '/test',
                status: 500,
                error: 'Test error',
            })
        );
    });

    it('should include user info in logs when authenticated', () => {
        req.user = { sub: 'user-123' };
        const error = new Error('Test error');

        errorHandler(error, req, res, next);

        expect(console.error).toHaveBeenCalledWith(
            'Request failed',
            expect.objectContaining({
                user: 'user-123',
            })
        );
    });

    it('should capture exception with Sentry', () => {
        process.env.SENTRY_DSN = 'https://test@sentry.io/123';
        const error = new Error('Sentry test');

        errorHandler(error, req, res, next);

        expect(Sentry.captureException).toHaveBeenCalledWith(
            error,
            expect.objectContaining({
                tags: {
                    path: '/test',
                    method: 'GET',
                },
            })
        );

        delete process.env.SENTRY_DSN;
    });

    it('should include user in Sentry context when authenticated', () => {
        process.env.SENTRY_DSN = 'https://test@sentry.io/123';
        req.user = { sub: 'user-456' };
        const error = new Error('Sentry test');

        errorHandler(error, req, res, next);

        expect(Sentry.captureException).toHaveBeenCalledWith(
            error,
            expect.objectContaining({
                user: { id: 'user-456' },
            })
        );

        delete process.env.SENTRY_DSN;
    });

    it('should handle error without message', () => {
        const error = new Error();

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'Internal Server Error',
                errorId: 'test-correlation-123',
            })
        );
    });

    it('should generate errorId when correlationId is missing', () => {
        delete req.correlationId;
        const error = new Error('Test');

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                errorId: expect.stringMatching(/^\d+-0\.\d+$/),
            })
        );
    });

    it('should use originalUrl in logs when available', () => {
        req.originalUrl = '/original/test';
        const error = new Error('Test');

        errorHandler(error, req, res, next);

        expect(console.error).toHaveBeenCalledWith(
            'Request failed',
            expect.objectContaining({
                path: '/original/test',
            })
        );
    });

    it('should fall back to path when originalUrl is missing', () => {
        delete req.originalUrl;
        req.path = '/fallback/path';
        const error = new Error('Test');

        errorHandler(error, req, res, next);

        expect(console.error).toHaveBeenCalledWith(
            'Request failed',
            expect.objectContaining({
                path: '/fallback/path',
            })
        );
    });

    it('should hide error message for 5xx errors', () => {
        const error = new Error('Sensitive internal error');
        error.status = 500;

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'Internal Server Error',
            })
        );
    });

    it('should show error message for 4xx errors', () => {
        const error = new Error('Bad request details');
        error.status = 400;

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'Bad request details',
            })
        );
    });

    it('should include error details in development mode', () => {
        process.env.NODE_ENV = 'development';
        const error = new Error('Dev error');
        error.stack = 'Stack trace';

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                details: 'Dev error',
                stack: 'Stack trace',
            })
        );
    });

    it('should not include error details in production mode', () => {
        process.env.NODE_ENV = 'production';
        const error = new Error('Prod error');

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.not.objectContaining({
                details: expect.anything(),
                stack: expect.anything(),
            })
        );
    });

    it('should not send to Sentry when SENTRY_DSN is not configured', () => {
        delete process.env.SENTRY_DSN;
        const error = new Error('Test');

        errorHandler(error, req, res, next);

        expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('should include request body in Sentry when present', () => {
        process.env.SENTRY_DSN = 'https://test@sentry.io/123';
        req.body = { key: 'value' };
        const error = new Error('Test');

        errorHandler(error, req, res, next);

        expect(Sentry.captureException).toHaveBeenCalledWith(
            error,
            expect.objectContaining({
                contexts: expect.objectContaining({
                    request: expect.objectContaining({
                        body: '{"key":"value"}',
                    }),
                }),
            })
        );

        delete process.env.SENTRY_DSN;
    });

    it('should handle missing request body in Sentry', () => {
        process.env.SENTRY_DSN = 'https://test@sentry.io/123';
        delete req.body;
        const error = new Error('Test');

        errorHandler(error, req, res, next);

        expect(Sentry.captureException).toHaveBeenCalledWith(
            error,
            expect.objectContaining({
                contexts: expect.objectContaining({
                    request: expect.objectContaining({
                        body: undefined,
                    }),
                }),
            })
        );

        delete process.env.SENTRY_DSN;
    });

    it('should not include user in Sentry when not authenticated', () => {
        process.env.SENTRY_DSN = 'https://test@sentry.io/123';
        req.user = null;
        const error = new Error('Test');

        errorHandler(error, req, res, next);

        expect(Sentry.captureException).toHaveBeenCalledWith(
            error,
            expect.objectContaining({
                user: undefined,
            })
        );

        delete process.env.SENTRY_DSN;
    });

    it('should include user email in Sentry when available', () => {
        process.env.SENTRY_DSN = 'https://test@sentry.io/123';
        req.user = { sub: 'user-123', email: 'user@example.com' };
        const error = new Error('Test');

        errorHandler(error, req, res, next);

        expect(Sentry.captureException).toHaveBeenCalledWith(
            error,
            expect.objectContaining({
                user: { id: 'user-123', email: 'user@example.com' },
            })
        );

        delete process.env.SENTRY_DSN;
    });
});
