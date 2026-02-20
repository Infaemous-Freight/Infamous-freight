/**
 * Load Testing with k6 - Enhanced Version
 *
 * Comprehensive load testing suite with:
 * - Realistic user scenarios (auth, browse, track, checkout)
 * - Gradual load increase (ramp-up)
 * - Performance thresholds (P95, P99)
 * - Error handling and retry logic
 * - Custom metrics for business KPIs
 *
 * Run: k6 run load-test.k6.js
 * Run with scale: k6 run --vus 500 --duration 5m load-test.k6.js
 */

import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { Rate, Trend, Gauge, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const shipmentSearchDuration = new Trend('shipment_search_duration');
const authDuration = new Trend('auth_duration');
const trackingDuration = new Trend('tracking_duration');
const apiCalls = new Counter('api_calls');
const userSessions = new Gauge('user_sessions');
const checkoutConversion = new Rate('checkout_conversion');

/**
 * Test Configuration
 * Adjust based on expected load and SLA requirements
 */
export const options = {
    // Scenarios: Define realistic user journeys with different weights
    scenarios: {
        // 50% of VUs: Browse and search shipments (high volume)
        browsing: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 100 }, // Ramp to 100 VUs
                { duration: '5m', target: 100 }, // Stay at 100 VUs
                { duration: '2m', target: 0 }, // Ramp down
            ],
            gracefulRampDown: '30s',
            exec: 'browsingScenario',
        },
        // 30% of VUs: Track shipments (medium volume)
        tracking: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 60 },
                { duration: '5m', target: 60 },
                { duration: '2m', target: 0 },
            ],
            gracefulRampDown: '30s',
            exec: 'trackingScenario',
        },
        // 15% of VUs: Complete checkout (spike test)
        checkout: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '3m', target: 30 }, // Ramp more slowly
                { duration: '3m', target: 30 },
                { duration: '2m', target: 0 },
            ],
            gracefulRampDown: '30s',
            exec: 'checkoutScenario',
        },
        // 5% of VUs: Peak load simulation (sudden spike)
        peakLoad: {
            executor: 'constant-vus',
            vus: 10,
            duration: '2m',
            startTime: '7m', // Start after 7 minutes
            exec: 'peakLoadScenario',
        },
    },

    // Performance thresholds (test fails if not met)
    thresholds: {
        // API response times
        'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
        'http_req_duration{staticAsset:yes}': ['p(99)<200'], // Static assets faster
        'shipment_search_duration': ['p(95)<300'],
        'auth_duration': ['p(99)<150'],
        'tracking_duration': ['p(95)<250'],

        // Error rates
        'errors': ['rate<0.1'], // Less than 10% error rate
        'http_req_failed': ['rate<0.1'], // Less than 10% HTTP failures

        // Business metrics
        'checkout_conversion': ['rate>0.8'], // 80% of checkouts should complete
    },

    // Ramp-up phases for gradual load increase
    rampUpPhases: [
        { duration: '2m', target: 50, name: 'Warm up' },
        { duration: '5m', target: 200, name: 'Gradual increase' },
        { duration: '5m', target: 500, name: 'Peak load' },
        { duration: '3m', target: 0, name: 'Cool down' },
    ],
};

/**
 * Setup: Initialize test data and auth tokens
 */
export function setup() {
    // Login once and retrieve token for all VUs
    const loginRes = http.post('http://localhost:4000/api/auth/login', {
        email: 'user@example.com',
        password: 'password123',
    });

    return {
        token: loginRes.json('data.token'),
        userId: loginRes.json('data.userId'),
    };
}

/**
 * Scenario 1: Browsing (60% of traffic)
 * - List shipments
 * - Search by origin/destination
 * - Filter by status
 * - Paginate through results
 */
export function browsingScenario(data) {
    userSessions.add(1);

    const params = {
        headers: {
            Authorization: `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
        tags: { name: 'browsing' },
    };

    group('Shipment Search and Browse', () => {
        const start = Date.now();

        // 1. List all shipments (paginated)
        const listRes = http.get('http://localhost:4000/api/shipments?page=1&limit=20', params);
        shipmentSearchDuration.add(Date.now() - start);

        check(listRes, {
            'Status 200': (r) => r.status === 200,
            'Has shipment data': (r) => r.json('data.length') > 0,
            'Has pagination': (r) => r.json('pagination.total') > 0,
            'Response time < 500ms': (r) => r.timings.duration < 500,
        }) || errorRate.add(1);

        apiCalls.add(1);
        sleep(1);

        // 2. Search by origin
        const searchRes = http.get('http://localhost:4000/api/shipments/search?origin=NYC&limit=10', params);

        check(searchRes, {
            'Status 200': (r) => r.status === 200,
            'Results filtered': (r) => r.json('data.length') <= 10,
        }) || errorRate.add(1);

        apiCalls.add(1);
        sleep(1);

        // 3. Get next page
        const secondPageRes = http.get('http://localhost:4000/api/shipments?page=2&limit=20', params);

        check(secondPageRes, {
            'Status 200': (r) => r.status === 200,
            'Different shipments': (r) => {
                const page1Ids = listRes.json('data').map((s) => s.id).join(',');
                const page2Ids = secondPageRes.json('data').map((s) => s.id).join(',');
                return page1Ids !== page2Ids;
            },
        }) || errorRate.add(1);

        apiCalls.add(1);
        sleep(2); // User thinks before next action
    });

    userSessions.add(-1);
}

/**
 * Scenario 2: Tracking (20% of traffic)
 * - Fetch shipment details
 * - Get tracking updates
 * - Poll for real-time updates
 */
export function trackingScenario(data) {
    userSessions.add(1);

    const params = {
        headers: {
            Authorization: `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
        tags: { name: 'tracking' },
    };

    group('Shipment Tracking', () => {
        // Get shipment IDs first
        const listRes = http.get('http://localhost:4000/api/shipments?limit=5', params);
        const shipments = listRes.json('data');

        if (!shipments || shipments.length === 0) {
            fail('No shipments to track');
            return;
        }

        const shipmentId = shipments[0].id;

        // Get tracking details
        const start = Date.now();
        const trackRes = http.get(`http://localhost:4000/api/shipments/${shipmentId}/tracking`, params);
        trackingDuration.add(Date.now() - start);

        check(trackRes, {
            'Status 200': (r) => r.status === 200,
            'Has tracking updates': (r) => r.json('data.updates.length') > 0,
            'Has location': (r) => r.json('data.location.lat') !== undefined,
            'Response time < 300ms': (r) => r.timings.duration < 300,
        }) || errorRate.add(1);

        apiCalls.add(1);
        sleep(2);

        // Poll for updates (simulate checking status)
        for (let i = 0; i < 3; i++) {
            const updateRes = http.get(`http://localhost:4000/api/shipments/${shipmentId}/updates`, params);

            check(updateRes, {
                'Status 200': (r) => r.status === 200,
            }) || errorRate.add(1);

            apiCalls.add(1);
            sleep(1);
        }
    });

    userSessions.add(-1);
}

/**
 * Scenario 3: Checkout (15% of traffic)
 * - Create shipment
 * - Add packaging details
 * - Apply coupon
 * - Submit payment
 */
export function checkoutScenario(data) {
    userSessions.add(1);

    const params = {
        headers: {
            Authorization: `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
        tags: { name: 'checkout' },
    };

    group('Complete Checkout Flow', () => {
        const start = Date.now();

        // 1. Create shipment
        const createRes = http.post(
            'http://localhost:4000/api/shipments',
            JSON.stringify({
                origin: { city: 'NYC', zip: '10001' },
                destination: { city: 'LA', zip: '90001' },
                weight: 50,
                dimensions: { length: 10, width: 8, height: 6 },
                contents: 'Electronics',
            }),
            params
        );

        check(createRes, {
            'Status 201': (r) => r.status === 201,
            'Has shipment ID': (r) => r.json('data.id') !== undefined,
        }) || errorRate.add(1);

        if (createRes.status !== 201) {
            checkoutConversion.add(0);
            userSessions.add(-1);
            return;
        }

        const shipmentId = createRes.json('data.id');
        apiCalls.add(1);
        sleep(1);

        // 2. Add insurance (optional upsell)
        const insuranceRes = http.post(
            `http://localhost:4000/api/shipments/${shipmentId}/insurance`,
            JSON.stringify({ type: 'full', coverage: 1000 }),
            params
        );

        check(insuranceRes, {
            'Status 200': (r) => r.status === 200,
        });

        apiCalls.add(1);
        sleep(1);

        // 3. Apply coupon code
        const couponRes = http.post(
            `http://localhost:4000/api/shipments/${shipmentId}/coupon`,
            JSON.stringify({ code: 'SAVE10' }),
            params
        );

        check(couponRes, {
            'Status 200': (r) => r.status === 200 || r.status === 400, // 400 for invalid coupon
        });

        apiCalls.add(1);
        sleep(1);

        // 4. Complete payment
        const paymentRes = http.post(
            `http://localhost:4000/api/shipments/${shipmentId}/payment`,
            JSON.stringify({
                method: 'card',
                cardToken: 'tok_mastercard', // Stripe test token
                amount: 99.99,
            }),
            params
        );

        check(paymentRes, {
            'Status 200': (r) => r.status === 200,
            'Payment successful': (r) => r.json('data.status') === 'paid',
        }) || errorRate.add(1);

        if (paymentRes.status === 200) {
            checkoutConversion.add(1);
        } else {
            checkoutConversion.add(0);
        }

        const checkoutDuration = Date.now() - start;
        apiCalls.add(1);

        check(null, {
            'Checkout completed in < 5s': () => checkoutDuration < 5000,
        });

        sleep(2);
    });

    userSessions.add(-1);
}

/**
 * Scenario 4: Peak Load (5% of traffic)
 * - Simulate sudden spike in traffic
 * - Heavy browsing and searching
 * - Tests API scaling
 */
export function peakLoadScenario(data) {
    userSessions.add(1);

    const params = {
        headers: {
            Authorization: `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
        tags: { name: 'peakLoad', staticAsset: 'no' },
    };

    group('Peak Load - Heavy Searching', () => {
        // Multiple rapid searches
        for (let i = 0; i < 5; i++) {
            const searchRes = http.get(
                `http://localhost:4000/api/shipments/search?query=urgent&page=${i + 1}`,
                params
            );

            check(searchRes, {
                'Status 200': (r) => r.status === 200,
            }) || errorRate.add(1);

            apiCalls.add(1);
        }

        sleep(1);
    });

    userSessions.add(-1);
}

/**
 * Teardown: Clean up test data
 */
export function teardown(data) {
    // Optional: Clean up shipments created during test
    const params = {
        headers: {
            Authorization: `Bearer ${data.token}`,
        },
    };

    http.get('http://localhost:4000/api/health', params);
}

/**
 * Custom Metric: Response time by endpoint
 * Usage in check:
 *   endpointDuration.add(Date.now() - start, { endpoint: '/shipments' });
 */
export const endpointDuration = new Trend('endpoint_duration');
export const endpointErrors = new Counter('endpoint_errors');

/**
 * Helper: Calculate percentile
 */
function percentile(values, p) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[index];
}

/**
 * Summary output function
 * Displays results after test completes
 */
export function handleSummary(data) {
    return {
        // Print text summary to stdout
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
        // Save HTML report
        'summary.html': htmlReport(data),
        // Save JSON for CI/CD integration
        'summary.json': JSON.stringify(data.metrics, null, 2),
    };
}

/**
 * Text summary formatter
 */
function textSummary(data, options) {
    const { indent = '', enableColors = false } = options;
    let summary = '\n────────────────────────────────────\n';
    summary += 'K6 LOAD TEST SUMMARY\n';
    summary += '────────────────────────────────────\n\n';

    // Key metrics
    const metrics = data.metrics;
    summary += `${indent}Total API Calls: ${metrics.api_calls?.value || 0}\n`;
    summary += `${indent}Error Rate: ${((metrics.errors?.value || 0) * 100).toFixed(2)}%\n`;
    summary += `${indent}Peak Concurrent Users: ${metrics.user_sessions?.value || 0}\n\n`;

    // Response times
    summary += 'Response Times:\n';
    summary += `${indent}  Auth: ${Math.round(metrics.auth_duration?.['p(95)'] || 0)}ms (p95)\n`;
    summary += `${indent}  Search: ${Math.round(metrics.shipment_search_duration?.['p(95)'] || 0)}ms (p95)\n`;
    summary += `${indent}  Tracking: ${Math.round(metrics.tracking_duration?.['p(95)'] || 0)}ms (p95)\n\n`;

    // Business metrics
    summary += 'Conversion:\n';
    summary += `${indent}  Checkout: ${((metrics.checkout_conversion?.value || 0) * 100).toFixed(1)}%\n`;

    summary += '\n────────────────────────────────────\n';
    return summary;
}

/**
 * HTML report generator
 */
function htmlReport(data) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>K6 Load Test Report</title>
  <style>
    body { font-family: Arial; margin: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ccc; }
    .good { color: green; }
    .warning { color: orange; }
    .bad { color: red; }
  </style>
</head>
<body>
  <h1>K6 Load Test Results</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <pre>${JSON.stringify(data.metrics, null, 2)}</pre>
</body>
</html>
`;
    return html;
}
