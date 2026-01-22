const { logger, correlationMiddleware, performanceMiddleware, LOG_LEVEL, PERF_WARN_THRESHOLD, PERF_ERROR_THRESHOLD } = require('../../src/middleware/logger');

describe('Logger Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            method: 'GET',
            url: '/api/test',
            originalUrl: '/api/test',
            ip: '127.0.0.1',
            get: jest.fn(),
        };
        res = {
            statusCode: 200,
            on: jest.fn(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('correlationMiddleware', () => {
        it('should generate correlation ID when header not provided', () => {
            correlationMiddleware(req, res, next);

            expect(req.correlationId).toBeDefined();
            expect(req.correlationId).toMatch(/^\d+-[a-z0-9]+$/);
            expect(next).toHaveBeenCalledWith();
        });

        it('should use provided correlation ID from header', () => {
            const customId = 'custom-correlation-123';
            req.headers['x-correlation-id'] = customId;

            correlationMiddleware(req, res, next);

            expect(req.correlationId).toBe(customId);
            expect(next).toHaveBeenCalledWith();
        });

        it('should set startTime on request', () => {
            correlationMiddleware(req, res, next);

            expect(req.startTime).toBeDefined();
            expect(typeof req.startTime).toBe('number');
        });
    });

    describe('performanceMiddleware', () => {
        it('should log normal request with info level', () => {
            const loggerSpy = jest.spyOn(logger, 'info').mockImplementation();
            performanceMiddleware(req, res, next);

            // Simulate response finish
            const finishCallback = res.on.mock.calls[0][1];
            finishCallback();

            expect(loggerSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'GET',
                    status: 200,
                }),
                expect.any(String)
            );

            loggerSpy.mockRestore();
        });

        it('should log slow request with warn level', (done) => {
            const loggerSpy = jest.spyOn(logger, 'warn').mockImplementation();

            // Mock Date.now BEFORE calling middleware
            const originalNow = Date.now;
            Date.now = jest.fn()
                .mockReturnValueOnce(1000) // start time
                .mockReturnValueOnce(1000 + PERF_WARN_THRESHOLD + 100); // end time

            performanceMiddleware(req, res, next);

            // Simulate response finish after slow duration
            const finishCallback = res.on.mock.calls[0][1];
            finishCallback();

            expect(loggerSpy).toHaveBeenCalled();
            expect(loggerSpy.mock.calls[0][0]).toEqual(
                expect.objectContaining({
                    performance: 'slow',
                })
            );

            Date.now = originalNow;
            loggerSpy.mockRestore();
            done();
        });

        it('should log critical request with error level', (done) => {
            const loggerSpy = jest.spyOn(logger, 'error').mockImplementation();

            const originalNow = Date.now;
            Date.now = jest.fn()
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(1000 + PERF_ERROR_THRESHOLD + 100);

            performanceMiddleware(req, res, next);

            const finishCallback = res.on.mock.calls[0][1];
            finishCallback();

            expect(loggerSpy).toHaveBeenCalled();
            expect(loggerSpy.mock.calls[0][0]).toEqual(
                expect.objectContaining({
                    performance: 'critical',
                })
            );

            Date.now = originalNow;
            loggerSpy.mockRestore();
            done();
        });

        it('should include request context in logs', () => {
            const loggerSpy = jest.spyOn(logger, 'info').mockImplementation();
            req.user = { sub: 'user-123' };
            req.get.mockReturnValue('Mozilla/5.0');
            req.correlationId = 'test-123';

            performanceMiddleware(req, res, next);

            const finishCallback = res.on.mock.calls[0][1];
            finishCallback();

            expect(loggerSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'GET',
                    path: '/api/test',
                    status: 200,
                    correlationId: 'test-123',
                    user: 'user-123',
                    ip: '127.0.0.1',
                    userAgent: 'Mozilla/5.0',
                }),
                expect.any(String)
            );

            loggerSpy.mockRestore();
        });

        it('should call next middleware', () => {
            performanceMiddleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('should register finish listener on response', () => {
            performanceMiddleware(req, res, next);

            expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
        });

        it('should use url when originalUrl is not available', () => {
            const loggerSpy = jest.spyOn(logger, 'info').mockImplementation();
            delete req.originalUrl;
            req.url = '/fallback/url';

            performanceMiddleware(req, res, next);

            const finishCallback = res.on.mock.calls[0][1];
            finishCallback();

            expect(loggerSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    path: '/fallback/url',
                }),
                expect.any(String)
            );

            loggerSpy.mockRestore();
        });

        it('should truncate long user agent to 100 characters', () => {
            const loggerSpy = jest.spyOn(logger, 'info').mockImplementation();
            const longUserAgent = 'A'.repeat(150);
            req.get.mockReturnValue(longUserAgent);

            performanceMiddleware(req, res, next);

            const finishCallback = res.on.mock.calls[0][1];
            finishCallback();

            expect(loggerSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    userAgent: 'A'.repeat(100),
                }),
                expect.any(String)
            );

            loggerSpy.mockRestore();
        });

        it('should handle missing user agent', () => {
            const loggerSpy = jest.spyOn(logger, 'info').mockImplementation();
            req.get.mockReturnValue(undefined);

            performanceMiddleware(req, res, next);

            const finishCallback = res.on.mock.calls[0][1];
            finishCallback();

            expect(loggerSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    userAgent: undefined,
                }),
                expect.any(String)
            );

            loggerSpy.mockRestore();
        });

        it('should not add performance field for fast requests', () => {
            const loggerSpy = jest.spyOn(logger, 'info').mockImplementation();

            performanceMiddleware(req, res, next);

            const finishCallback = res.on.mock.calls[0][1];
            finishCallback();

            expect(loggerSpy.mock.calls[0][0]).not.toHaveProperty('performance');

            loggerSpy.mockRestore();
        });
    });

    describe('logger configuration', () => {
        it('should export logger instance', () => {
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.warn).toBe('function');
        });

        it('should export performance thresholds', () => {
            expect(LOG_LEVEL).toBeDefined();
            expect(PERF_WARN_THRESHOLD).toBeDefined();
            expect(PERF_ERROR_THRESHOLD).toBeDefined();
            expect(PERF_ERROR_THRESHOLD > PERF_WARN_THRESHOLD).toBe(true);
        });
    });
});
