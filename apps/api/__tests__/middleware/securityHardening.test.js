const {
    rateLimiters,
    createAdvancedLimiter,
    validateSQLInput,
    sanitizeSQLInput,
    protectXSS,
    sanitizeXSS,
    validateNoSQLInput,
    validateCSRFToken,
    ipFilter,
    validateRequestSignature,
    limitInputSize,
    securityHeaders,
    securityStack,
} = require('../../src/middleware/securityHardening');

jest.mock('xss', () => (input) => input);
jest.mock('sqlstring', () => ({
    escape: jest.fn(val => `'${val}'`),
    escapeId: jest.fn(id => `\`${id}\``),
    format: jest.fn((query, values) => query),
}));

describe('Security Hardening Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            body: {},
            query: {},
            params: {},
            method: 'POST',
            path: '/api/test',
            ip: '127.0.0.1',
            user: { sub: 'user123', tier: 'pro' },
            session: { csrfToken: 'token123' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
        };
        next = jest.fn();
    });

    describe('Advanced Rate Limiters', () => {
        it('should create advanced limiter with custom config', () => {
            const limiter = createAdvancedLimiter({
                freeTier: 50,
                proTier: 1000,
            });

            expect(limiter).toBeDefined();
        });

        it('should provide tier-based limiters', () => {
            expect(rateLimiters.api).toBeDefined();
            expect(rateLimiters.auth).toBeDefined();
            expect(rateLimiters.ai).toBeDefined();
            expect(rateLimiters.payment).toBeDefined();
            expect(rateLimiters.export).toBeDefined();
        });

        it('should apply different limits for AI tier', () => {
            const limiter = createAdvancedLimiter({
                windowMs: 60000,
                freeTier: 5,
                starterTier: 20,
            });

            expect(limiter).toBeDefined();
        });
    });

    describe('SQL Injection Protection', () => {
        it('should detect SQL injection patterns in OR/AND', () => {
            req.body = { name: "admin' OR '1'='1" };

            validateSQLInput(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid input detected' });
        });

        it('should detect UNION SELECT patterns', () => {
            req.body = { id: "1 UNION SELECT password FROM users" };

            validateSQLInput(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should detect INSERT INTO patterns', () => {
            req.query = { data: "1; INSERT INTO users VALUES ('hacker')" };

            validateSQLInput(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should detect DROP statement patterns', () => {
            req.params = { id: "1; DROP TABLE users" };

            validateSQLInput(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should allow clean input', () => {
            req.body = { name: 'John Doe', email: 'john@example.com' };

            validateSQLInput(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should sanitize SQL input', () => {
            const result = sanitizeSQLInput("test'; DROP TABLE--");
            expect(typeof result).toBe('string');
        });

        it('should pass through non-string input', () => {
            const num = 123;
            const result = sanitizeSQLInput(num);
            expect(result).toBe(123);
        });
    });

    describe('XSS Protection', () => {
        it('should sanitize XSS in strings', () => {
            const dirty = '<img src=x onerror="alert(1)">';
            const clean = sanitizeXSS(dirty);
            expect(clean).not.toContain('onerror');
        });

        it('should allow clean text', () => {
            const result = sanitizeXSS('Clean Text Here');
            expect(result).toBeDefined();
        });

        it('should protect request body from XSS', () => {
            req.body = {
                name: '<script>alert("xss")</script>',
                description: 'Normal text',
            };

            protectXSS(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should pass through non-string values', () => {
            const obj = { value: 123, nested: { count: 5 } };
            const result = sanitizeXSS(obj);
            expect(result).toBe(obj);
        });
    });

    describe('NoSQL Injection Protection', () => {
        it('should detect $where operator', () => {
            req.body = { query: { $where: '1==1' } };

            validateNoSQLInput(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should detect $ne operator', () => {
            req.body = { role: { $ne: 'user' } };

            validateNoSQLInput(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should detect $regex operator', () => {
            req.query = { search: { $regex: '.*' } };

            validateNoSQLInput(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should allow clean input', () => {
            req.body = { name: 'John', age: 30 };

            validateNoSQLInput(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('CSRF Protection', () => {
        it('should skip CSRF check for GET requests', () => {
            req.method = 'GET';
            req.headers['x-csrf-token'] = undefined;

            validateCSRFToken(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should skip CSRF check for Bearer token', () => {
            req.method = 'POST';
            req.headers.authorization = 'Bearer token123';

            validateCSRFToken(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should validate CSRF token from header', () => {
            req.method = 'POST';
            req.headers['x-csrf-token'] = 'token123';

            validateCSRFToken(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should validate CSRF token from body', () => {
            req.method = 'POST';
            req.body._csrf = 'token123';

            validateCSRFToken(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should reject invalid CSRF token', () => {
            req.method = 'POST';
            req.headers['x-csrf-token'] = 'invalid';

            validateCSRFToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('IP Filter', () => {
        it('should create IP filter instance', () => {
            expect(ipFilter).toBeDefined();
            expect(typeof ipFilter.addToBlacklist).toBe('function');
            expect(typeof ipFilter.addToWhitelist).toBe('function');
        });

        it('should add IP to blacklist', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            ipFilter.addToBlacklist('192.168.1.100');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should add IP to whitelist', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            ipFilter.addToWhitelist('192.168.1.1');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should block blacklisted IPs', () => {
            ipFilter.addToBlacklist('192.168.1.100');
            req.ip = '192.168.1.100';

            const middleware = ipFilter.middleware();
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should allow whitelisted IPs when whitelist is set', () => {
            ipFilter.addToWhitelist('127.0.0.1');
            req.ip = '127.0.0.1';

            const middleware = ipFilter.middleware();
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('Request Signature Validation', () => {
        it('should skip validation without API key', () => {
            validateRequestSignature(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should reject missing signature', () => {
            req.headers['x-api-key'] = 'key123';

            validateRequestSignature(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should reject missing timestamp', () => {
            req.headers['x-api-key'] = 'key123';
            req.headers['x-signature'] = 'sig123';

            validateRequestSignature(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should reject expired requests', () => {
            req.headers['x-api-key'] = 'key123';
            req.headers['x-signature'] = 'sig123';
            req.headers['x-timestamp'] = String(Date.now() - 10 * 60 * 1000); // 10 minutes old

            validateRequestSignature(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should accept valid recent timestamp', () => {
            req.headers['x-api-key'] = 'key123';
            req.headers['x-timestamp'] = String(Date.now());

            // Mock crypto for signature validation
            const crypto = require('crypto');
            const payload = `${req.method}:${req.path}:${req.headers['x-timestamp']}`;
            const signature = crypto
                .createHmac('sha256', 'key123')
                .update(payload)
                .digest('hex');
            req.headers['x-signature'] = signature;

            validateRequestSignature(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('Input Size Limits', () => {
        it('should create size limit middleware', () => {
            const middleware = limitInputSize('100kb', 1000);
            expect(typeof middleware).toBe('function');
        });

        it('should reject fields exceeding max size', () => {
            const middleware = limitInputSize('100kb', 50);
            req.body = { name: 'a'.repeat(100) };

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should allow fields within size limit', () => {
            const middleware = limitInputSize('100kb', 1000);
            req.body = { name: 'John Doe' };

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should handle nested objects', () => {
            const middleware = limitInputSize('100kb', 50);
            req.body = {
                user: {
                    profile: {
                        bio: 'a'.repeat(100),
                    },
                },
            };

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('Security Headers', () => {
        it('should set CSP header', () => {
            securityHeaders(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith(
                'Content-Security-Policy',
                expect.any(String)
            );
        });

        it('should set X-Frame-Options header', () => {
            securityHeaders(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith(
                'X-Frame-Options',
                'DENY'
            );
        });

        it('should set X-XSS-Protection header', () => {
            securityHeaders(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith(
                'X-XSS-Protection',
                '1; mode=block'
            );
        });

        it('should set X-Content-Type-Options header', () => {
            securityHeaders(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith(
                'X-Content-Type-Options',
                'nosniff'
            );
        });

        it('should call next after setting headers', () => {
            securityHeaders(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('Security Stack', () => {
        it('should return array of middleware functions', () => {
            const stack = securityStack();

            expect(Array.isArray(stack)).toBe(true);
            expect(stack.length).toBeGreaterThan(0);
            stack.forEach(middleware => {
                expect(typeof middleware).toBe('function');
            });
        });

        it('should include all required middleware', () => {
            const stack = securityStack();
            expect(stack).toContain(securityHeaders);
            expect(stack).toContain(validateSQLInput);
            expect(stack).toContain(validateNoSQLInput);
            expect(stack).toContain(protectXSS);
        });
    });
});
