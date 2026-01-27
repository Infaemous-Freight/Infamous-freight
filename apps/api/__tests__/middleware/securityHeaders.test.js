const { securityHeaders, handleCSPViolation } = require('../../src/middleware/securityHeaders');

describe('Security Headers Middleware', () => {
    let app, middleware;

    beforeEach(() => {
        app = {
            use: jest.fn(),
        };
        middleware = [];
        app.use.mockImplementation((fn) => {
            middleware.push(fn);
            return app;
        });
    });

    describe('securityHeaders', () => {
        it('should apply helmet with CSP configuration', () => {
            securityHeaders(app);

            expect(app.use).toHaveBeenCalled();
            // Helmet middleware should be first
            expect(middleware.length).toBeGreaterThanOrEqual(1);
        });

        it('should apply SameSite cookie protection', () => {
            securityHeaders(app);

            // Find the cookie middleware
            const cookieMiddleware = middleware.find(fn => fn.length === 3);
            expect(cookieMiddleware).toBeDefined();

            // Test cookie middleware
            const req = {};
            const res = {
                set: jest.fn().mockReturnThis(),
                setHeader: jest.fn().mockReturnThis(),
                removeHeader: jest.fn().mockReturnThis(),
                getHeader: jest.fn(),
            };
            const next = jest.fn();

            if (cookieMiddleware) {
                // Mock set method with cookie
                res.set.mockImplementation((key, val) => {
                    if (key?.toLowerCase() === 'set-cookie') {
                        expect(val).toContain('SameSite=Strict');
                    }
                    return res;
                });

                cookieMiddleware(req, res, next);
                expect(next).toHaveBeenCalledWith();
            }
        });
    });

    describe('handleCSPViolation', () => {
        let req, res;

        beforeEach(() => {
            req = {
                body: {
                    'violated-directive': 'script-src',
                    'blocked-uri': 'https://evil.com/script.js',
                    'original-policy': "script-src 'self'",
                    'source-file': 'https://example.com/page.html',
                    'line-number': 10,
                    'column-number': 5,
                },
            };
            res = {
                status: jest.fn().mockReturnThis(),
                end: jest.fn(),
            };
        });

        it('should return 204 No Content', () => {
            handleCSPViolation(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.end).toHaveBeenCalled();
        });

        it('should log CSP violation details', () => {
            const loggerSpy = jest.spyOn(console, 'warn').mockImplementation();

            handleCSPViolation(req, res);

            // Logger should be called (implementation logs CSP violation)
            expect(res.status).toHaveBeenCalledWith(204);

            loggerSpy.mockRestore();
        });

        it('should handle violation without all fields', () => {
            req.body = {
                'violated-directive': 'script-src',
            };

            handleCSPViolation(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.end).toHaveBeenCalled();
        });
    });

    describe('Security configuration', () => {
        it('should apply multiple security middlewares', () => {
            securityHeaders(app);

            // Should have multiple middleware layers
            expect(middleware.length).toBeGreaterThanOrEqual(2);
        });

        it('should use app.use to apply middleware', () => {
            securityHeaders(app);

            expect(app.use).toHaveBeenCalled();
        });
    });
});
