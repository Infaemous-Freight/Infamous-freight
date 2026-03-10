// tools/load-tests/phase9-load-test.js
// NOTE: This file must remain .js (not .mjs) because it is executed by the k6
// load-testing binary, which uses its own module system and does not support
// Node.js ESM resolution.  The `import` statements here are k6-specific ESM,
// not standard Node.js ESM.

import http from "k6/http";
import { check, group, sleep } from "k6";

/**
 * Phase 9 Load Testing Script
 * Run with: k6 run phase9-load-test.js
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const TEST_JWT = __ENV.TEST_JWT || "Bearer test-token";

export const options = {
  scenarios: {
    // Payments load test
    payments: {
      executor: "rampingVUs",
      startVUs: 10,
      stages: [
        { duration: "30s", target: 50 }, // Ramp up
        { duration: "60s", target: 100 }, // Spike
        { duration: "30s", target: 10 }, // Ramp down
      ],
      gracefulRampDown: "10s",
    },
    // Search load test
    search: {
      executor: "constantVUs",
      vus: 50,
      duration: "120s",
      startTime: "60s",
    },
    // Notifications load test
    notifications: {
      executor: "ramping-arrival-rate",
      startRate: 100,
      stages: [
        { duration: "30s", target: 500 },
        { duration: "60s", target: 1000 },
        { duration: "30s", target: 100 },
      ],
      preAllocatedVUs: 50,
      maxVUs: 500,
      startTime: "120s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<3000"],
    http_req_failed: ["rate<0.1"],
  },
};

// Crypto payment load test
export function payments() {
  group("Crypto Payments", () => {
    const response = http.post(
      `${BASE_URL}/api/payments/crypto`,
      JSON.stringify({
        amount: Math.random() * 1000,
        currency: ["BTC", "ETH", "USDC", "USDT"][Math.floor(Math.random() * 4)],
        walletAddress: "1A1z7agoat7j2PejVQ6YDfdyMEFjkhrAyV",
        invoiceId: `INV-${Date.now()}-${Math.random()}`,
      }),
      {
        headers: {
          Authorization: TEST_JWT,
          "Content-Type": "application/json",
        },
      },
    );

    check(response, {
      "Crypto payment status 200": (r) => r.status === 200,
      "Response has transactionId": (r) => r.body.includes("transactionId"),
      "Response has correct status": (r) => r.body.includes("pending_confirmation"),
      "Response time < 2s": (r) => r.timings.duration < 2000,
    });
  });

  sleep(1);
}

// Search load test
export function search() {
  group("Advanced Search", () => {
    const queries = [
      "New York",
      "San Francisco",
      "Los Angeles",
      "Chicago",
      "urgent",
      "express",
      "overnight",
    ];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const response = http.get(
      `${BASE_URL}/api/search/shipments?q=${encodeURIComponent(query)}&limit=20`,
      {
        headers: {
          Authorization: TEST_JWT,
        },
      },
    );

    check(response, {
      "Search status 200": (r) => r.status === 200,
      "Search has results": (r) => r.body.includes("results"),
      "Response time < 500ms": (r) => r.timings.duration < 500,
    });
  });

  sleep(0.5);
}

// Notifications load test
export function notifications() {
  group("Push Notifications", () => {
    const response = http.post(
      `${BASE_URL}/api/notifications/push`,
      JSON.stringify({
        title: "Shipment Update",
        message: "Your shipment status has changed",
        category: "shipment",
      }),
      {
        headers: {
          Authorization: TEST_JWT,
          "Content-Type": "application/json",
        },
      },
    );

    check(response, {
      "Notification status 200": (r) => r.status === 200,
      "Notification has ID": (r) => r.body.includes("notificationId"),
      "Response time < 100ms": (r) => r.timings.duration < 100,
    });
  });

  sleep(0.1);
}

// Spike test
export function spike() {
  group("Spike Test - Payment Endpoint", () => {
    for (let i = 0; i < 100; i++) {
      http.post(
        `${BASE_URL}/api/payments/crypto`,
        JSON.stringify({
          amount: 100,
          currency: "BTC",
          walletAddress: "1A1z7agoat7j2PejVQ6YDfdyMEFjkhrAyV",
          invoiceId: `INV-SPIKE-${Date.now()}-${i}`,
        }),
        {
          headers: {
            Authorization: TEST_JWT,
            "Content-Type": "application/json",
          },
        },
      );
    }
  });
}

export function handleSummary(data) {
  return {
    "load-test-summary.json": JSON.stringify(data),
  };
}
