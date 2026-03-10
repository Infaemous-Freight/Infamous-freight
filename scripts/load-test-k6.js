/* eslint-env es6 */
/* global __ENV */
// NOTE: This file must remain .js (not .mjs) because it is executed by the k6
// load-testing binary, which uses its own module system and does not support
// Node.js ESM resolution.  The `import` statements here are k6-specific ESM,
// not standard Node.js ESM.

import http from "k6/http";
import { check, sleep, group } from "k6";

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp-up to 10 concurrent users
    { duration: "1m", target: 50 }, // Ramp-up to 50 concurrent users
    { duration: "2m", target: 50 }, // Stay at 50 users
    { duration: "30s", target: 0 }, // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"], // 95% under 500ms, 99% under 1s
    http_req_failed: ["rate<0.1"], // Error rate < 10%
    checks: ["rate>0.95"], // 95%+ checks passing
  },
};

const BASE_URL = "http://localhost:4000";
const JWT_TOKEN = __ENV.JWT_TOKEN || "";

// Helper to make authenticated requests
function makeRequest(method, url, payload = null) {
  const params = {
    headers: {
      "Content-Type": "application/json",
      ...(JWT_TOKEN && { Authorization: `Bearer ${JWT_TOKEN}` }),
    },
  };

  if (method === "GET") {
    return http.get(url, params);
  } else if (method === "POST") {
    return http.post(url, JSON.stringify(payload), params);
  } else if (method === "PUT") {
    return http.put(url, JSON.stringify(payload), params);
  } else if (method === "DELETE") {
    return http.del(url, params);
  }
}

export default function () {
  // Test group: Health checks
  group("Health Checks", () => {
    const res = makeRequest("GET", `${BASE_URL}/api/health`);
    check(res, {
      "health check status is 200": (r) => r.status === 200,
      "health response contains status": (r) => r.body.includes("ok"),
    });
    sleep(1);
  });

  // Test group: Metrics endpoints
  group("Metrics", () => {
    // Prometheus metrics
    const metricsRes = makeRequest("GET", `${BASE_URL}/api/metrics`);
    check(metricsRes, {
      "metrics endpoint status is 200": (r) => r.status === 200,
      "metrics response is text format": (r) => r.headers["Content-Type"]?.includes("text/plain"),
    });

    // Performance metrics
    const perfRes = makeRequest("GET", `${BASE_URL}/api/metrics/performance`);
    check(perfRes, {
      "performance metrics status is 200": (r) => r.status === 200,
      "performance metrics has uptime": (r) => r.body.includes("uptime"),
      "performance metrics has memory": (r) => r.body.includes("memory"),
    });

    // Cache metrics
    const cacheRes = makeRequest("GET", `${BASE_URL}/api/metrics/cache`);
    check(cacheRes, {
      "cache metrics status is 200": (r) => r.status === 200,
      "cache metrics has hit rate": (r) => r.body.includes("hitRate"),
    });

    // WebSocket metrics
    const wsRes = makeRequest("GET", `${BASE_URL}/api/metrics/websocket`);
    check(wsRes, {
      "websocket metrics status is 200": (r) => r.status === 200,
      "websocket metrics has connections": (r) => r.body.includes("activeConnections"),
    });

    sleep(1);
  });

  // Test group: Rate limiting
  group("Rate Limiting", () => {
    const res = makeRequest("GET", `${BASE_URL}/api/metrics/ratelimit`);
    check(res, {
      "rate limit metrics status is 200": (r) => r.status === 200,
      "rate limit metrics has limiters": (r) => r.body.includes("limiters"),
    });
    sleep(1);
  });

  // Test group: Probes
  group("Probes", () => {
    // Liveness probe
    const aliveRes = makeRequest("GET", `${BASE_URL}/api/metrics/alive`);
    check(aliveRes, {
      "liveness probe status is 200": (r) => r.status === 200,
    });

    // Readiness probe
    const readyRes = makeRequest("GET", `${BASE_URL}/api/metrics/ready`);
    check(readyRes, {
      "readiness probe status is 200": (r) => r.status === 200,
    });

    // Health summary
    const healthRes = makeRequest("GET", `${BASE_URL}/api/metrics/health`);
    check(healthRes, {
      "health summary status is 200": (r) => r.status === 200,
      "health summary has status field": (r) => r.body.includes("status"),
    });

    sleep(1);
  });

  // Random sleep between requests
  sleep(Math.random() * 3);
}

// Custom metric definitions (for reference, not actively used in this test)
import { Trend, Counter, Gauge, Rate } from "k6/metrics";

// eslint-disable-next-line no-unused-vars
const httpDuration = new Trend("http_req_duration");
// eslint-disable-next-line no-unused-vars
const httpErrors = new Counter("http_req_failed");
// eslint-disable-next-line no-unused-vars
const activeUsers = new Gauge("active_users");
// eslint-disable-next-line no-unused-vars
const requestRate = new Rate("request_rate");

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "./load-test-results/k6-summary.json": JSON.stringify(data),
  };
}

// Text summary formatter
function textSummary(data, _options) {
  let summary = "";
  summary += "\n=== K6 Load Test Summary ===\n";
  summary += `Total Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n`;
  summary += `\nHTTP Request Duration:\n`;
  summary += `  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `  Min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
  summary += `  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
  summary += `  P95: ${data.metrics.http_req_duration.values["p(95)"]?.toFixed(2)}ms\n`;
  summary += `  P99: ${data.metrics.http_req_duration.values["p(99)"]?.toFixed(2)}ms\n`;
  summary += `\nRequest Stats:\n`;
  summary += `  Total: ${data.metrics.http_reqs.values.value}\n`;
  summary += `  Success Rate: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
  summary += `  Error Rate: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%\n`;
  return summary;
}
