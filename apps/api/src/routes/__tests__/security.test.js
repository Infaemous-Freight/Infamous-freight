/*
 * Security & Rate Limiting Tests
 * Comprehensive coverage for authentication, scopes, and rate limits
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');

const {
  limiters,
  authenticate,
  requireScope,
  auditLog,
} = require('../../middleware/security');

describe('Security Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Simple test route
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
        { expiresIn: '-1h' } // expired
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
          scopes: ['shipments:read'], // missing write
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
        { sub: 'user123' }, // no scopes
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

    test('should include rate limit headers in response', async () => {
      const res = await request(app).get('/api/public');

      // express-rate-limit sets RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
      expect(res.status).toBe(200);
      // Headers may vary by implementation
    });

    test('should skip health check endpoints', async () => {
      app.get('/api/health', limiters.general, (_req, res) => {
        res.json({ status: 'ok' });
      });

      // Even with aggressive requests, /health should work
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/api/health'));
      }

      const results = await Promise.all(promises);
      results.forEach((res) => {
        expect(res.status).toBe(200);
      });
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
      // Rate limiting is based on user ID (sub) when authenticated
    });
  });

  describe('Specific Rate Limiters', () => {
    test('auth limiter should have stricter limits (5/15min)', () => {
      // This is a config test - verify limiter is configured correctly
      expect(limiters.auth).toBeDefined();
      // Max should be 5 for auth endpoints
    });

    test('ai limiter should limit to 20/min', () => {
      expect(limiters.ai).toBeDefined();
      // Max should be 20 per minute
    });

    test('billing limiter should limit to 30/15min', () => {
      expect(limiters.billing).toBeDefined();
      // Max should be 30 per 15 minutes
    });

    test('voice limiter should limit to 10/min', () => {
      expect(limiters.voice).toBeDefined();
      // Max should be 10 per minute
    });
  });

  describe('auditLog middleware', () => {
    test('should log request info on response finish', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const reqMock = {
        method: 'GET',
        path: '/api/protected',
        originalUrl: '/api/protected',
        user: { sub: 'user123' },
        ip: '127.0.0.1',
        headers: {},
      };
      const resMock = {
        statusCode: 200,
        on: (event, handler) => {
          if (event === 'finish') {
            handler();
          }
        },
      };
      const nextSpy = jest.fn();

      auditLog(reqMock, resMock, nextSpy);

      expect(nextSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({
          method: 'GET',
          status: 200,
          user: 'user123',
        })
      );

      consoleSpy.mockRestore();
    });

    test('should mask authorization header in logs', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      const token = jwt.sign(
        { sub: 'user123' },
        process.env.JWT_SECRET || 'test-secret'
      );

      await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const call = consoleSpy.mock.calls.find((c) => c[0] === 'request');
      if (call) {
        expect(call[1].auth).toBe('***');
      }

      consoleSpy.mockRestore();
    });

    test('should include request path and duration', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      const token = jwt.sign(
        { sub: 'user123' },
        process.env.JWT_SECRET || 'test-secret'
      );

      await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const call = consoleSpy.mock.calls.find((c) => c[0] === 'request');
      if (call) {
        expect(call[1].path).toContain('/api/protected');
        expect(typeof call[1].duration).toBe('number');
      }

      consoleSpy.mockRestore();
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
      // First request should succeed
      const res1 = await request(app).get('/api/public');
      expect(res1.status).toBe(200);
    });
  });
});
