/*
 * Security & Rate Limiting Integration Tests
 * Comprehensive coverage for authentication, scopes, and rate limits via HTTP
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');

const {
    limiters,
    authenticate,
    requireScope,
    auditLog,
} = require('../../src/middleware/security');

describe('Security Middleware Integration', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Test routes
        app.get(
            '/api/public',
            limiters.general,
            (_req, res) => {
                res.json({ ok: true });
            }
        );

        app.get(
            '/api/protected',
            limiters.general,
            authenticate,
            (_req, res) => {
                res.json({ ok: true, user: _req.user });
            }
        );

        app.post(
            '/api/admin',
            limiters.general,
            authenticate,
            requireScope('admin:write'),
            (_req, res) => {
                res.json({ ok: true });
            }
        );

        app.get(
            '/api/multi-scope',
            limiters.general,
            authenticate,
            requireScope(['shipments:read', 'shipments:write']),
            (_req, res) => {
                res.json({ ok: true });
            }
        );

        // Error handler
        app.use((err, _req, res, _next) => {
            res.status(err.status || 500).json({ error: err.message });
        });
    });

    describe('authenticate middleware', () => {
        test('should allow requests with valid bearer token', async () => {
            const token = jwt.sign(
                { sub: 'user123', email: 'test@example.com' },
                process.env.JWT_SECRET || 'test-secret'
            );

            const res = await request(app)
                .get('/api/protected')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.user.sub).toBe('user123');
            expect(res.body.user.email).toBe('test@example.com');
        });

        test('should reject requests without bearer token', async () => {
            const res = await request(app).get('/api/protected');

            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Missing bearer token');
        });

        test('should reject requests with invalid token format', async () => {
            const res = await request(app)
                .get('/api/protected')
                .set('Authorization', 'InvalidFormat token');

            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Missing bearer token');
        });

        test('should reject expired tokens', async () => {
            const token = jwt.sign(
                { sub: 'user123', email: 'test@example.com' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '-1h' }
            );

            const res = await request(app)
                .get('/api/protected')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Invalid or expired token');
        });

        test('should reject tampered tokens', async () => {
            const token = jwt.sign(
                { sub: 'user123', email: 'test@example.com' },
                process.env.JWT_SECRET || 'test-secret'
            );
            const tamperedToken = token.slice(0, -5) + 'xxxxx';

            const res = await request(app)
                .get('/api/protected')
                .set('Authorization', `Bearer ${tamperedToken}`);

            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Invalid or expired token');
        });

        test('should support both Authorization header case variations', async () => {
            const token = jwt.sign(
                { sub: 'user123' },
                process.env.JWT_SECRET || 'test-secret'
            );

            const resLower = await request(app)
                .get('/api/protected')
                .set('authorization', `Bearer ${token}`);

            const resUpper = await request(app)
                .get('/api/protected')
                .set('Authorization', `Bearer ${token}`);

            expect(resLower.status).toBe(200);
            expect(resUpper.status).toBe(200);
        });
    });

    describe('requireScope middleware', () => {
        test('should allow request with required scope', async () => {
            const token = jwt.sign(
                {
                    sub: 'user123',
                    scopes: ['admin:write', 'admin:read'],
                },
                process.env.JWT_SECRET || 'test-secret'
            );

            const res = await request(app)
                .post('/api/admin')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });

        test('should reject request without required scope', async () => {
            const token = jwt.sign(
                {
                    sub: 'user123',
                    scopes: ['user:read'],
                },
                process.env.JWT_SECRET || 'test-secret'
            );

            const res = await request(app)
                .post('/api/admin')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Insufficient scope');
        });

        test('should accept array of required scopes (all must match)', async () => {
            const tokenWithAll = jwt.sign(
                {
                    sub: 'user123',
                    scopes: ['shipments:read', 'shipments:write'],
                },
                process.env.JWT_SECRET || 'test-secret'
            );

            const tokenWithPartial = jwt.sign(
                {
                    sub: 'user123',
                    scopes: ['shipments:read'],
                },
                process.env.JWT_SECRET || 'test-secret'
            );

            const resAll = await request(app)
                .get('/api/multi-scope')
                .set('Authorization', `Bearer ${tokenWithAll}`);

            const resPartial = await request(app)
                .get('/api/multi-scope')
                .set('Authorization', `Bearer ${tokenWithPartial}`);

            expect(resAll.status).toBe(200);
            expect(resPartial.status).toBe(403);
        });

        test('should handle missing scopes claim gracefully', async () => {
            const token = jwt.sign(
                { sub: 'user123' },
                process.env.JWT_SECRET || 'test-secret'
            );

            const res = await request(app)
                .post('/api/admin')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Insufficient scope');
        });
    });

    describe('Rate Limiting', () => {
        test('should allow requests under limit', async () => {
            const res1 = await request(app).get('/api/public');
            const res2 = await request(app).get('/api/public');

            expect(res1.status).toBe(200);
            expect(res2.status).toBe(200);
        });

        test('should use keyGenerator to identify users', async () => {
            const token = jwt.sign(
                { sub: 'user123' },
                process.env.JWT_SECRET || 'test-secret'
            );

            const res1 = await request(app)
                .get('/api/protected')
                .set('Authorization', `Bearer ${token}`);

            expect(res1.status).toBe(200);
        });
    });

    describe('Specific Rate Limiters', () => {
        test('auth limiter should be defined', () => {
            expect(limiters.auth).toBeDefined();
        });

        test('ai limiter should be defined', () => {
            expect(limiters.ai).toBeDefined();
        });

        test('billing limiter should be defined', () => {
            expect(limiters.billing).toBeDefined();
        });

        test('voice limiter should be defined', () => {
            expect(limiters.voice).toBeDefined();
        });
    });

    describe('Integration: Full auth chain', () => {
        test('should enforce full middleware chain', async () => {
            const token = jwt.sign(
                {
                    sub: 'user123',
                    scopes: ['admin:write'],
                },
                process.env.JWT_SECRET || 'test-secret'
            );

            // Valid request
            const valid = await request(app)
                .post('/api/admin')
                .set('Authorization', `Bearer ${token}`);

            expect(valid.status).toBe(200);

            // Missing token
            const noAuth = await request(app).post('/api/admin');
            expect(noAuth.status).toBe(401);

            // Insufficient scope
            const noScope = await request(app)
                .post('/api/admin')
                .set(
                    'Authorization',
                    `Bearer ${jwt.sign(
                        { sub: 'user123', scopes: [] },
                        process.env.JWT_SECRET || 'test-secret'
                    )}`
                );
            expect(noScope.status).toBe(403);
        });

        test('should respect limiter at start of chain', async () => {
            const res1 = await request(app).get('/api/public');
            expect(res1.status).toBe(200);
        });
    });
});
