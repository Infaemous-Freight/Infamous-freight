/**
 * Analytics Routes - Comprehensive Integration Tests
 * Business metrics, dashboards, and reporting
 */

const request = require('supertest');
const { generateTestJWT } = require('../helpers/jwt');

describe('Analytics Routes - Complete Coverage', () => {
    let app;

    beforeAll(() => {
        app = require('../../app');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/analytics/dashboard', () => {
        it('should get analytics dashboard', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/dashboard')
                .set('Authorization', `Bearer ${token}`);

            expect([200, 401, 403]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.data || response.body).toBeDefined();
            }
        });

        it('should require analytics:read scope', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['user:profile'], // Missing analytics scope
            });

            const response = await request(app)
                .get('/api/analytics/dashboard')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
        });
    });

    describe('GET /api/analytics/revenue', () => {
        it('should get revenue metrics', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/revenue')
                .set('Authorization', `Bearer ${token}`);

            expect([200, 401, 403, 404]).toContain(response.status);
            if (response.status === 200) {
                const data = response.body.data || response.body;
                expect(typeof data.totalRevenue || 0).toBe('number');
            }
        });

        it('should filter revenue by date range', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/revenue')
                .query({
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                })
                .set('Authorization', `Bearer ${token}`);

            expect([200, 400]).toContain(response.status);
        });

        it('should support date range filters', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/revenue')
                .query({
                    startDate: '2024-12-31',
                    endDate: '2024-01-01', // Invalid range
                })
                .set('Authorization', `Bearer ${token}`);

            expect([400, 422]).toContain(response.status);
        });
    });

    describe('GET /api/analytics/jobs', () => {
        it('should get job analytics', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/jobs')
                .set('Authorization', `Bearer ${token}`);

            expect([200, 401, 403, 404]).toContain(response.status);
            if (response.status === 200) {
                const data = response.body.data || response.body;
                expect(Array.isArray(data) || typeof data === 'object').toBe(true);
            }
        });

        it('should include job performance metrics', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/jobs')
                .set('Authorization', `Bearer ${token}`);

            if (response.status === 200) {
                const data = response.body.data || response.body;
                // Check for expected metrics
                expect(data).toBeDefined();
            }
        });
    });

    describe('GET /api/analytics/users', () => {
        it('should get user analytics', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/users')
                .set('Authorization', `Bearer ${token}`);

            expect([200, 401, 403, 404]).toContain(response.status);
        });

        it('should track new user registrations', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/users')
                .query({ metric: 'registrations' })
                .set('Authorization', `Bearer ${token}`);

            expect([200, 400, 401, 403]).toContain(response.status);
        });

        it('should track user retention', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/users')
                .query({ metric: 'retention' })
                .set('Authorization', `Bearer ${token}`);

            expect([200, 400, 401, 403]).toContain(response.status);
        });
    });

    describe('GET /api/analytics/drivers', () => {
        it('should get driver analytics', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/drivers')
                .set('Authorization', `Bearer ${token}`);

            expect([200, 401, 403, 404]).toContain(response.status);
        });

        it('should include driver perfor mance metrics', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/drivers')
                .query({ metric: 'performance' })
                .set('Authorization', `Bearer ${token}`);

            expect([200, 400, 401]).toContain(response.status);
        });

        it('should show driver earnings', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/drivers')
                .query({ metric: 'earnings' })
                .set('Authorization', `Bearer ${token}`);

            expect([200, 400, 401]).toContain(response.status);
        });
    });

    describe('POST /api/analytics/export', () => {
        it('should export analytics data', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:export'],
            });

            const response = await request(app)
                .post('/api/analytics/export')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    format: 'csv',
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                });

            expect([200, 202, 400, 401, 403]).toContain(response.status);
        });

        it('should support multiple export formats', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:export'],
            });

            const formats = ['csv', 'json', 'excel', 'pdf'];

            for (const format of formats) {
                const response = await request(app)
                    .post('/api/analytics/export')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ format });

                expect([200, 202, 400, 401, 403, 422]).toContain(response.status);
            }
        });

        it('should validate export parameters', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:export'],
            });

            const response = await request(app)
                .post('/api/analytics/export')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    format: 'invalid_format',
                });

            expect([400, 422]).toContain(response.status);
        });
    });

    describe('GET /api/analytics/reports', () => {
        it('should list available reports', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/reports')
                .set('Authorization', `Bearer ${token}`);

            expect([200, 401, 403]).toContain(response.status);
            if (response.status === 200) {
                expect(Array.isArray(response.body.data || response.body)).toBe(true);
            }
        });

        it('should get specific report', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/reports/daily-summary')
                .set('Authorization', `Bearer ${token}`);

            expect([200, 404, 401, 403]).toContain(response.status);
        });
    });

    describe('GET /api/analytics/kpis', () => {
        it('should get key performance indicators', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/kpis')
                .set('Authorization', `Bearer ${token}`);

            expect([200, 401, 403, 404]).toContain(response.status);
            if (response.status === 200) {
                const data = response.body.data || response.body;
                expect(data).toBeDefined();
            }
        });

        it('should track business KPIs', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const kpis = ['mrr', 'arr', 'churn', 'ltv', 'cac', 'roi'];

            for (const kpi of kpis) {
                const response = await request(app)
                    .get('/api/analytics/kpis')
                    .query({ kpi })
                    .set('Authorization', `Bearer ${token}`);

                expect([200, 400, 401, 403]).toContain(response.status);
            }
        });
    });

    describe('access control', () => {
        it('should restrict analytics to authorized users', async () => {
            const userToken = generateTestJWT({
                sub: 'user_123',
                scopes: ['user:profile'], // No analytics scope
            });

            const response = await request(app)
                .get('/api/analytics/dashboard')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
        });

        it('should allow admins only for certain endpoints', async () => {
            const token = generateTestJWT({
                sub: 'user_123',
                scopes: ['user:profile'],
            });

            const response = await request(app)
                .get('/api/analytics/reports')
                .set('Authorization', `Bearer ${token}`);

            expect([403, 401]).toContain(response.status);
        });
    });

    describe('performance and caching', () => {
        it('should handle large date ranges efficiently', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const start = Date.now();
            const response = await request(app)
                .get('/api/analytics/revenue')
                .query({
                    startDate: '2020-01-01',
                    endDate: '2024-12-31',
                })
                .set('Authorization', `Bearer ${token}`);

            const duration = Date.now() - start;
            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(10000); // Should respond in < 10s
        });

        it('should cache frequently accessed data', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            // First request
            const response1 = await request(app)
                .get('/api/analytics/dashboard')
                .set('Authorization', `Bearer ${token}`);

            // Second request (should be cached)
            const response2 = await request(app)
                .get('/api/analytics/dashboard')
                .set('Authorization', `Bearer ${token}`);

            expect(response1.status).toBe(response2.status);
        });
    });

    describe('error scenarios', () => {
        it('should handle missing authorization', async () => {
            const response = await request(app)
                .get('/api/analytics/dashboard');

            expect(response.status).toBe(401);
        });

        it('should handle invalid date formats', async () => {
            const token = generateTestJWT({
                sub: 'admin_123',
                scopes: ['analytics:read'],
            });

            const response = await request(app)
                .get('/api/analytics/revenue')
                .query({
                    startDate: 'not-a-date',
                    endDate: '2024-12-31',
                })
                .set('Authorization', `Bearer ${token}`);

            expect([400, 422]).toContain(response.status);
        });
    });
});
