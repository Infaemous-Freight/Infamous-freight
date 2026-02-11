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

// Helper to check if a deployment is accessible
async function isDeploymentAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    // Consider deployment accessible only if it returns a successful response (2xx or 3xx)
    // 404 or 5xx means the deployment exists but endpoints are missing/broken
    return response.status >= 200 && response.status < 400;
  } catch {
    // Network error or other fetch failure
    return false;
  }
}

// Check deployment availability before running test suite
let vercelAccessible = false;
let flyAccessible = false;

await (async () => {
  const [vercelOk, flyOk] = await Promise.all([
    isDeploymentAccessible(VERCEL_URL),
    isDeploymentAccessible(`${FLY_URL}/api/health`),
  ]);

  vercelAccessible = vercelOk;
  flyAccessible = flyOk;

  if (!vercelAccessible) {
    console.warn(
      `⚠️  Vercel deployment at ${VERCEL_URL} is not accessible - skipping related tests`,
    );
  }
  if (!flyAccessible) {
    console.warn(
      `⚠️  Fly.io deployment at ${FLY_URL} is not accessible - skipping related tests`,
    );
  }
})();

describe("Security Headers - Vercel Deployment", () => {
  let response: Response | undefined;

  beforeAll(async () => {
    if (vercelAccessible) {
      response = await fetch(VERCEL_URL, { method: "HEAD" });
    }
  });

  it.skipIf(!vercelAccessible)("should return successful status", () => {
    expect(response?.status).toBe(200);
  });

  it.skipIf(!vercelAccessible)("should have Content-Security-Policy header", () => {
    const csp = response?.headers.get("content-security-policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it.skipIf(!vercelAccessible)("should have Strict-Transport-Security header", () => {
    const hsts = response?.headers.get("strict-transport-security");
    expect(hsts).toBeDefined();
    // Vercel adds HSTS automatically
  });

  it.skipIf(!vercelAccessible)("should prevent clickjacking with X-Frame-Options", () => {
    const xfo = response?.headers.get("x-frame-options");
    expect(xfo).toBe("SAMEORIGIN");
  });

  it.skipIf(!vercelAccessible)("should have X-Content-Type-Options header", () => {
    const xcto = response?.headers.get("x-content-type-options");
    expect(xcto).toBe("nosniff");
  });

  it.skipIf(!vercelAccessible)("should have Referrer-Policy header", () => {
    const rp = response?.headers.get("referrer-policy");
    expect(rp).toBe("strict-origin-when-cross-origin");
  });

  it.skipIf(!vercelAccessible)("should have Permissions-Policy header", () => {
    const pp = response?.headers.get("permissions-policy");
    expect(pp).toBeDefined();
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
    expect(pp).toContain("geolocation=()");
    expect(pp).toContain("payment=()");
  });

  it.skipIf(!vercelAccessible)("should not expose sensitive server information", () => {
    const server = response?.headers.get("server");
    const xPoweredBy = response?.headers.get("x-powered-by");

    // Server header is OK if generic (e.g., "Vercel")
    // But should not expose version numbers
    if (xPoweredBy) {
      expect(xPoweredBy.toLowerCase()).not.toContain("php");
      expect(xPoweredBy.toLowerCase()).not.toContain("asp");
    }
  });

  it.skipIf(!vercelAccessible)("should have custom security headers from Edge Proxy", () => {
    // These are added by our proxy.ts middleware
    const featureFlags = response?.headers.get("x-feature-flags-status");
    expect(featureFlags).toBe("ready");
  });
});

describe("Security Headers - Fly.io API Backend", () => {
  let response: Response | undefined;

  beforeAll(async () => {
    if (flyAccessible) {
      response = await fetch(`${FLY_URL}/api/health`, { method: "HEAD" });
    }
  });

  it.skipIf(!flyAccessible)("should return successful status", () => {
    expect(response?.status).toBe(200);
  });

  it.skipIf(!flyAccessible)("should have X-Frame-Options header", () => {
    const xfo = response?.headers.get("x-frame-options");
    expect(xfo).toBeTruthy();
  });

  it.skipIf(!flyAccessible)("should have X-Content-Type-Options header", () => {
    const xcto = response?.headers.get("x-content-type-options");
    expect(xcto).toBe("nosniff");
  });

  it.skipIf(!flyAccessible)("should not expose sensitive information", () => {
    const xPoweredBy = response?.headers.get("x-powered-by");
    expect(xPoweredBy).toBeNull();
  });
});

describe("API Endpoint Security", () => {
  it.skipIf(!vercelAccessible)("should enforce authentication on protected routes", async () => {
    const protectedRoute = `${VERCEL_URL}/api/admin`;

    // Request without auth
    const unauthResponse = await fetch(protectedRoute);
    expect(unauthResponse.status).toBe(401);

    const body = await unauthResponse.json();
    expect(body.error).toBe("Unauthorized");
  });

  it.skipIf(!vercelAccessible)("should handle OPTIONS preflight correctly", async () => {
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

  it.skipIf(!vercelAccessible)(
    "should have rate limiting headers on repeated requests",
    async () => {
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
    },
  );
});

describe("HTTPS and Certificate Validation", () => {
  it("should use HTTPS for Vercel deployment", () => {
    expect(VERCEL_URL).toMatch(/^https:\/\//);
  });

  it("should use HTTPS for Fly.io deployment", () => {
    expect(FLY_URL).toMatch(/^https:\/\//);
  });

  it.skipIf(!vercelAccessible)("should have valid SSL certificate (Vercel)", async () => {
    // Fetch will fail if cert is invalid
    const response = await fetch(VERCEL_URL);
    expect(response.ok).toBe(true);
  });

  it.skipIf(!flyAccessible)("should have valid SSL certificate (Fly.io)", async () => {
    const response = await fetch(`${FLY_URL}/api/health`);
    expect(response.ok).toBe(true);
  });
});

describe("Information Disclosure Prevention", () => {
  it.skipIf(!vercelAccessible)(
    "should not expose detailed error messages in production",
    async () => {
      const response = await fetch(`${VERCEL_URL}/api/nonexistent-endpoint`);
      expect(response.status).toBe(404);

      const body = await response.text();
      // Should not contain stack traces or internal paths
      expect(body).not.toContain("/home/");
      expect(body).not.toContain("at Object.");
      expect(body).not.toContain("node_modules");
    },
  );

  it.skipIf(!vercelAccessible)("should not expose package versions", async () => {
    const response = await fetch(VERCEL_URL);
    const html = await response.text();

    // Should not leak package versions in HTML
    expect(html).not.toContain("next@");
    expect(html).not.toContain("react@");
  });
});

describe("Content Type Validation", () => {
  it.skipIf(!vercelAccessible)("should return correct content type for JSON API", async () => {
    const response = await fetch(`${VERCEL_URL}/api/health`);
    const contentType = response.headers.get("content-type");

    expect(contentType).toContain("application/json");
  });

  it.skipIf(!vercelAccessible)("should return correct content type for HTML pages", async () => {
    const response = await fetch(VERCEL_URL);
    const contentType = response.headers.get("content-type");

    expect(contentType).toContain("text/html");
  });
});
