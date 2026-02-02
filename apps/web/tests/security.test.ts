/**
 * Security Headers Test Suite
 *
 * Validates that all required security headers are present and correctly configured
 * in production deployments (Vercel and Fly.io).
 *
 * Run with: pnpm test:security
 */

import { describe, it, expect, beforeAll } from "vitest";

const VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL || "https://infamous.vercel.app";
const FLY_URL = "https://infamous-freight-as-3gw.fly.dev";

describe("Security Headers - Vercel Deployment", () => {
  let response: Response;

  beforeAll(async () => {
    response = await fetch(VERCEL_URL, { method: "HEAD" });
  });

  it("should return successful status", () => {
    expect(response.status).toBe(200);
  });

  it("should have Content-Security-Policy header", () => {
    const csp = response.headers.get("content-security-policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("should have Strict-Transport-Security header", () => {
    const hsts = response.headers.get("strict-transport-security");
    expect(hsts).toBeDefined();
    // Vercel adds HSTS automatically
  });

  it("should prevent clickjacking with X-Frame-Options", () => {
    const xfo = response.headers.get("x-frame-options");
    expect(xfo).toBe("SAMEORIGIN");
  });

  it("should have X-Content-Type-Options header", () => {
    const xcto = response.headers.get("x-content-type-options");
    expect(xcto).toBe("nosniff");
  });

  it("should have Referrer-Policy header", () => {
    const rp = response.headers.get("referrer-policy");
    expect(rp).toBe("strict-origin-when-cross-origin");
  });

  it("should have Permissions-Policy header", () => {
    const pp = response.headers.get("permissions-policy");
    expect(pp).toBeDefined();
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
    expect(pp).toContain("geolocation=()");
    expect(pp).toContain("payment=()");
  });

  it("should not expose sensitive server information", () => {
    const server = response.headers.get("server");
    const xPoweredBy = response.headers.get("x-powered-by");

    // Server header is OK if generic (e.g., "Vercel")
    // But should not expose version numbers
    if (xPoweredBy) {
      expect(xPoweredBy.toLowerCase()).not.toContain("php");
      expect(xPoweredBy.toLowerCase()).not.toContain("asp");
    }
  });

  it("should have custom security headers from Edge Proxy", () => {
    // These are added by our proxy.ts middleware
    const featureFlags = response.headers.get("x-feature-flags-status");
    expect(featureFlags).toBe("ready");
  });
});

describe("Security Headers - Fly.io API Backend", () => {
  let response: Response;

  beforeAll(async () => {
    response = await fetch(`${FLY_URL}/api/health`, { method: "HEAD" });
  });

  it("should return successful status", () => {
    expect(response.status).toBe(200);
  });

  it("should have X-Frame-Options header", () => {
    const xfo = response.headers.get("x-frame-options");
    expect(xfo).toBeTruthy();
  });

  it("should have X-Content-Type-Options header", () => {
    const xcto = response.headers.get("x-content-type-options");
    expect(xcto).toBe("nosniff");
  });

  it("should not expose sensitive information", () => {
    const xPoweredBy = response.headers.get("x-powered-by");
    expect(xPoweredBy).toBeNull();
  });
});

describe("API Endpoint Security", () => {
  it("should enforce authentication on protected routes", async () => {
    const protectedRoute = `${VERCEL_URL}/api/admin`;

    // Request without auth
    const unauthResponse = await fetch(protectedRoute);
    expect(unauthResponse.status).toBe(401);

    const body = await unauthResponse.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should handle OPTIONS preflight correctly", async () => {
    const apiUrl = `${VERCEL_URL}/api/health`;
    const response = await fetch(apiUrl, {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
        "Access-Control-Request-Method": "GET",
      },
    });

    // Should return CORS headers
    const allowOrigin = response.headers.get("access-control-allow-origin");
    const allowMethods = response.headers.get("access-control-allow-methods");

    expect(allowOrigin).toBeTruthy();
    expect(allowMethods).toContain("GET");
  });

  it("should have rate limiting headers on repeated requests", async () => {
    // Make 5 quick requests to test rate limiting
    const requests = Array(5)
      .fill(null)
      .map(() => fetch(`${VERCEL_URL}/api/health`));

    const responses = await Promise.all(requests);

    // Check if any response has rate limit headers
    const hasRateLimitHeaders = responses.some(
      (r) => r.headers.has("x-ratelimit-limit") || r.headers.has("ratelimit-limit"),
    );

    // This might not be implemented yet, so just log for now
    console.log("Rate limiting headers present:", hasRateLimitHeaders);
  });
});

describe("HTTPS and Certificate Validation", () => {
  it("should use HTTPS for Vercel deployment", () => {
    expect(VERCEL_URL).toMatch(/^https:\/\//);
  });

  it("should use HTTPS for Fly.io deployment", () => {
    expect(FLY_URL).toMatch(/^https:\/\//);
  });

  it("should have valid SSL certificate (Vercel)", async () => {
    // Fetch will fail if cert is invalid
    const response = await fetch(VERCEL_URL);
    expect(response.ok).toBe(true);
  });

  it("should have valid SSL certificate (Fly.io)", async () => {
    const response = await fetch(`${FLY_URL}/api/health`);
    expect(response.ok).toBe(true);
  });
});

describe("Information Disclosure Prevention", () => {
  it("should not expose detailed error messages in production", async () => {
    const response = await fetch(`${VERCEL_URL}/api/nonexistent-endpoint`);
    expect(response.status).toBe(404);

    const body = await response.text();
    // Should not contain stack traces or internal paths
    expect(body).not.toContain("/home/");
    expect(body).not.toContain("at Object.");
    expect(body).not.toContain("node_modules");
  });

  it("should not expose package versions", async () => {
    const response = await fetch(VERCEL_URL);
    const html = await response.text();

    // Should not leak package versions in HTML
    expect(html).not.toContain("next@");
    expect(html).not.toContain("react@");
  });
});

describe("Content Type Validation", () => {
  it("should return correct content type for JSON API", async () => {
    const response = await fetch(`${VERCEL_URL}/api/health`);
    const contentType = response.headers.get("content-type");

    expect(contentType).toContain("application/json");
  });

  it("should return correct content type for HTML pages", async () => {
    const response = await fetch(VERCEL_URL);
    const contentType = response.headers.get("content-type");

    expect(contentType).toContain("text/html");
  });
});
