import { describe, expect, it, vi } from "vitest";

describe("runStartupChecks", () => {
  it("fails in production when cookie auth is enabled without COOKIE_SECRET", async () => {
    vi.resetModules();
    vi.doMock("./env.js", () => ({
      env: {
        nodeEnv: "production",
        authCookieEnabled: true,
        cookieSecret: undefined,
        jwtAlgorithm: "HS256",
        jwtSecret: "x".repeat(32),
        jwtPrivateKey: undefined,
        jwtPublicKey: undefined,
        googleClientId: undefined,
        googleClientSecret: undefined,
      },
    }));

    const { runStartupChecks } = await import("./startup-checks.js");
    expect(() => runStartupChecks()).toThrow(/COOKIE_SECRET/);
  });

  it("passes in non-production", async () => {
    vi.resetModules();
    vi.doMock("./env.js", () => ({
      env: {
        nodeEnv: "development",
      },
    }));

    const { runStartupChecks } = await import("./startup-checks.js");
    expect(() => runStartupChecks()).not.toThrow();
  });
});
