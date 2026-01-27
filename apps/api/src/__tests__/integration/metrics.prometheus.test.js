const request = require('supertest');

const app = require('../../../src/server');

describe('Prometheus metrics endpoint', () => {
    test('GET /api/metrics returns plain text with Prometheus format', async () => {
        const res = await request(app).get('/api/metrics');
        expect(res.status).toBe(200);
        expect(res.type).toMatch(/text\/plain/);
        expect(res.text).toContain('# HELP rate_limit_hits_total');
        expect(res.text).toContain('# TYPE rate_limit_hits_total counter');
    });

    test('metrics output includes rate_limit counters', async () => {
        const res = await request(app).get('/api/metrics');
        expect(res.status).toBe(200);
        expect(res.text).toMatch(/rate_limit_hits_total\{name="general"\}/);
        expect(res.text).toMatch(/rate_limit_blocked_total\{name="general"\}/);
        expect(res.text).toMatch(/rate_limit_success_total\{name="general"\}/);
    });

    test('metrics output includes http request duration histograms', async () => {
        const res = await request(app).get('/api/metrics');
        expect(res.status).toBe(200);
        expect(res.text).toContain('# HELP http_request_duration_ms HTTP request duration');
        expect(res.text).toContain('# TYPE http_request_duration_ms histogram');
        expect(res.text).toMatch(/http_request_duration_ms_bucket/);
    });

    test('metrics output includes latency percentiles', async () => {
        const res = await request(app).get('/api/metrics');
        expect(res.status).toBe(200);
        expect(res.text).toContain('# HELP http_request_duration_p50');
        expect(res.text).toContain('# HELP http_request_duration_p95');
        expect(res.text).toContain('# HELP http_request_duration_p99');
    });

    test('metrics output includes request counts by path', async () => {
        const res = await request(app).get('/api/metrics');
        expect(res.status).toBe(200);
        expect(res.text).toContain('# HELP http_requests_total Total HTTP requests');
        expect(res.text).toMatch(/http_requests_total\{path="/);
    });

    test('metrics output includes error counts', async () => {
        const res = await request(app).get('/api/metrics');
        expect(res.status).toBe(200);
        expect(res.text).toContain('# HELP http_request_errors_total');
    });

    test('histogram bucket values are monotonically increasing', async () => {
        const res = await request(app).get('/api/metrics');
        expect(res.status).toBe(200);
        const bucketLines = res.text.split('\n').filter(l => l.includes('http_request_duration_ms_bucket'));
        if (bucketLines.length > 0) {
            const values = bucketLines.map(l => parseInt(l.split(' ')[1]));
            for (let i = 1; i < values.length; i++) {
                expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
            }
        }
    });
});
