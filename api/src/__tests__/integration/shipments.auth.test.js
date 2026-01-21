const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../../../src/server');

function signToken(payload = {}) {
    const base = { sub: 'user-1', email: 'u1@example.com', ...payload };
    return jwt.sign(base, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Shipments route auth/org/scope enforcement', () => {
    test('401 when missing bearer token', async () => {
        const res = await request(app).get('/api/shipments');
        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/Missing bearer token|Invalid or expired token/i);
    });

    test('401 when org_id missing', async () => {
        const token = signToken({ scopes: ['shipments:read'] });
        const res = await request(app)
            .get('/api/shipments')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(401);
        expect(res.body.error || res.body.message).toMatch(/No organization/i);
    });

    test('403 when scope missing', async () => {
        const token = signToken({ org_id: 'org-1', scopes: [] });
        const res = await request(app)
            .get('/api/shipments')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/Insufficient scope/i);
    });

    test('400 when invalid status enum', async () => {
        const token = signToken({ org_id: 'org-1', scopes: ['shipments:read'] });
        const res = await request(app)
            .get('/api/shipments?status=invalid_status')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Validation failed/i);
    });
});
