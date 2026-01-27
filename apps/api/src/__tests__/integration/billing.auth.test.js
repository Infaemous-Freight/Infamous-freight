const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../../../src/server');

function signToken(payload = {}) {
    const base = { sub: 'user-1', email: 'u1@example.com', ...payload };
    return jwt.sign(base, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Billing route auth/org/scope enforcement', () => {
    test('401 when org_id missing', async () => {
        const token = signToken({ scopes: ['billing:read'] });
        const res = await request(app)
            .get('/api/billing/revenue')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(401);
        expect(res.body.error || res.body.message).toMatch(/No organization/i);
    });

    test('403 when scope missing', async () => {
        const token = signToken({ org_id: 'org-1', scopes: [] });
        const res = await request(app)
            .get('/api/billing/revenue')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/Insufficient scope/i);
    });
});
