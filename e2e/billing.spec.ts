/*
 * Billing E2E Tests
 * Test complete billing flow: payment intent → webhook → confirmation
 */

import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL || "http://localhost:4000";
const WEB_BASE = process.env.WEB_BASE_URL || "http://localhost:3000";

test.describe("Billing Workflow - End-to-End", () => {
  let authToken = "";
  let paymentIntentId = "";
  let subscriptionId = "";

  test.beforeAll(async () => {
    // Setup: Create test user and get auth token
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: "Test@1234",
      }),
    });

    const loginData = await loginRes.json();
    authToken = loginData.token;
  });

  test("should create payment intent successfully", async () => {
    const res = await fetch(`${API_BASE}/api/billing/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        amount: "99.99",
        currency: "usd",
        description: "Test Payment",
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.clientSecret).toBeDefined();
    expect(data.paymentIntentId).toBeDefined();

    paymentIntentId = data.paymentIntentId;
  });

  test("should confirm payment processing", async () => {
    // Simulate Stripe webhook confirmation
    const webhookRes = await fetch(`${API_BASE}/api/billing/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: paymentIntentId,
            status: "succeeded",
          },
        },
      }),
    });

    expect(webhookRes.status).toBe(200);
    const data = await webhookRes.json();
    expect(data.received).toBe(true);
  });

  test("should create subscription successfully", async () => {
    const res = await fetch(`${API_BASE}/api/billing/create-subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        priceId: "price_test_123",
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.subscriptionId).toBeDefined();
    expect(data.status).toBe("active");

    subscriptionId = data.subscriptionId;
  });

  test("should retrieve user subscriptions", async () => {
    const res = await fetch(`${API_BASE}/api/billing/subscriptions`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.subscriptions)).toBe(true);
    expect(data.count).toBeGreaterThanOrEqual(0);
  });

  test("should get revenue statistics", async () => {
    const res = await fetch(`${API_BASE}/api/billing/revenue`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.revenue.totalOneTime).toBeDefined();
    expect(data.revenue.totalTransactions).toBeDefined();
    expect(data.revenue.activeSubscriptions).toBeDefined();
  });

  test("should cancel subscription", async () => {
    const res = await fetch(`${API_BASE}/api/billing/cancel-subscription/${subscriptionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain("cancelled");
  });

  test("should reject unauthorized billing requests", async () => {
    const res = await fetch(`${API_BASE}/api/billing/subscriptions`, {
      // No auth header
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test("should enforce rate limiting on billing endpoints", async () => {
    const requests = [];
    // Make 40 rapid requests (limit is 30/15min)
    for (let i = 0; i < 40; i++) {
      requests.push(
        fetch(`${API_BASE}/api/billing/subscriptions`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter((r) => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
    console.log(`Rate limited ${rateLimited.length}/40 requests as expected`);
  });

  test("should require proper scope for billing operations", async () => {
    // Create token without billing:write scope
    const noScopeToken = "token_without_billing_scope";

    const res = await fetch(`${API_BASE}/api/billing/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${noScopeToken}`,
      },
      body: JSON.stringify({
        amount: "50.00",
        currency: "usd",
      }),
    });

    expect([401, 403]).toContain(res.status);
  });
});

test.describe("Payment Processing Flow", () => {
  let paymentIntentId = "";

  test("should process payment with webhook confirmation", async ({ page }) => {
    // Navigate to payment page
    await page.goto(`${WEB_BASE}/billing`);

    // Fill payment form
    await page.fill("[data-testid=amount]", "99.99");
    await page.fill("[data-testid=description]", "Test Payment");

    // Click submit
    await page.click("[data-testid=submit-payment]");

    // Wait for payment intent creation
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/billing/create-payment-intent") && response.status() === 201,
    );

    // Verify success message
    await expect(page.locator("[data-testid=success-message]")).toBeVisible();
  });

  test("should display subscription management UI", async ({ page }) => {
    await page.goto(`${WEB_BASE}/subscriptions`);

    // Wait for subscriptions to load
    await page.waitForSelector("[data-testid=subscriptions-list]", { timeout: 5000 });

    // Verify list is rendered
    const list = page.locator("[data-testid=subscriptions-list]");
    await expect(list).toBeVisible();
  });
});
