const jwt = require('jsonwebtoken');
const { authenticate, requireScope, auditLog } = require('../../src/middleware/security');
const { env } = require('../../src/config/env');

describe('Security Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            ip: '127.0.0.1',
            method: 'GET',
            path: '/test',
            originalUrl: '/test',
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            on: jest.fn(),
            statusCode: 200,
        };
        next = jest.fn();
    });

    describe('authenticate', () => {
        it('should authenticate valid JWT token', () => {
            const token = jwt.sign(
                { sub: 'user-123', email: 'test@example.com', scopes: ['test:read'] },
                process.env.JWT_SECRET
            );
            req.headers.authorization = `Bearer ${token}`;

            authenticate(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(req.user).toBeDefined();
            expect(req.user.sub).toBe('user-123');
            expect(req.user.email).toBe('test@example.com');
        });

        it('should reject request without authorization header', () => {
            authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Missing bearer token' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject malformed authorization header', () => {
            req.headers.authorization = 'InvalidFormat token';

            authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Missing bearer token' });
        });

        it('should reject invalid JWT token', () => {
            req.headers.authorization = 'Bearer invalid-token';

            authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        });

        it('should reject expired JWT token', () => {
            const token = jwt.sign(
                { sub: 'user-123', exp: Math.floor(Date.now() / 1000) - 3600 },
                process.env.JWT_SECRET
            );
            req.headers.authorization = `Bearer ${token}`;

            authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        });

        it('should authenticate with capital Authorization header', () => {
            const token = jwt.sign(
                { sub: 'user-456', scopes: ['test:read'] },
                process.env.JWT_SECRET
            );
            req.headers.Authorization = `Bearer ${token}`;

            authenticate(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(req.user).toBeDefined();
            expect(req.user.sub).toBe('user-456');
        });

        it('should return 500 when JWT_SECRET is not configured', () => {
            const originalSecret = process.env.JWT_SECRET;
            const originalEnvSecret = env.jwtSecret;
            delete process.env.JWT_SECRET;
            env.jwtSecret = undefined;

            req.headers.authorization = 'Bearer sometoken';

            authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Server auth misconfiguration' });
            expect(next).not.toHaveBeenCalled();

            process.env.JWT_SECRET = originalSecret;
            env.jwtSecret = originalEnvSecret;
        });
    });

    describe('requireScope', () => {
        beforeEach(() => {
            req.user = {
                sub: 'user-123',
                scopes: ['test:read', 'test:write', 'admin'],
            };
        });

        it('should allow request with required single scope', () => {
            const middleware = requireScope('test:read');
            middleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow request with all required scopes', () => {
            const middleware = requireScope(['test:read', 'admin']);
            middleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('should reject request without required scope', () => {
            const middleware = requireScope('test:delete');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Insufficient scope',
                required: ['test:delete'],
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request missing one of multiple scopes', () => {
            const middleware = requireScope(['test:read', 'missing:scope']);
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Insufficient scope',
                required: ['test:read', 'missing:scope'],
            });
        });

        it('should reject request when user has no scopes', () => {
            req.user = { sub: 'user-123' };
            const middleware = requireScope('test:read');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('auditLog', () => {
        it('should log request metadata on response finish', () => {
            const finishCallback = jest.fn();
            res.on = jest.fn((event, callback) => {
                if (event === 'finish') finishCallback.mockImplementation(callback);
            });

            auditLog(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

            // Simulate response finish
            res.statusCode = 200;
            finishCallback();

            expect(console.info).toHaveBeenCalledWith(
                'request',
                expect.objectContaining({
                    method: 'GET',
                    path: '/test',
                    status: 200,
                })
            );
        });

        it('should include user info when authenticated', () => {
            req.user = { sub: 'user-123' };
            const finishCallback = jest.fn();
            res.on = jest.fn((event, callback) => {
                if (event === 'finish') finishCallback.mockImplementation(callback);
            });

            auditLog(req, res, next);
            finishCallback();

            expect(console.info).toHaveBeenCalledWith(
                'request',
                expect.objectContaining({
                    user: 'user-123',
                })
            );
        });

        it('should mask authorization header', () => {
            req.headers.authorization = 'Bearer secret-token';
            const finishCallback = jest.fn();
            res.on = jest.fn((event, callback) => {
                if (event === 'finish') finishCallback.mockImplementation(callback);
            });

            auditLog(req, res, next);
            finishCallback();

            expect(console.info).toHaveBeenCalledWith(
                'request',
                expect.objectContaining({
                    auth: '***',
                })
            );
        });

        it('should use path when originalUrl is missing', () => {
            delete req.originalUrl;
            req.path = '/fallback-path';
            const finishCallback = jest.fn();
            res.on = jest.fn((event, callback) => {
                if (event === 'finish') finishCallback.mockImplementation(callback);
            });

            auditLog(req, res, next);
            finishCallback();

            expect(console.info).toHaveBeenCalledWith(
                'request',
                expect.objectContaining({
                    path: '/fallback-path',
                })
            );
        });

        it('should not include auth field when no authorization header', () => {
            const finishCallback = jest.fn();
            res.on = jest.fn((event, callback) => {
                if (event === 'finish') finishCallback.mockImplementation(callback);
            });

            auditLog(req, res, next);
            finishCallback();

            expect(console.info).toHaveBeenCalledWith(
                'request',
                expect.objectContaining({
                    method: 'GET',
                    auth: undefined,
                })
            );
        });
    });
});
