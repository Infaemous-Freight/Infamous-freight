import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isSentryApiTokenConfigured: vi.fn(() => true),
  isSentryOAuthConfigured: vi.fn(() => true),
  generatePkcePair: vi.fn(() => ({ codeVerifier: "verifier", codeChallenge: "challenge" })),
  buildSentryAuthorizationUrl: vi.fn(() => "https://sentry.io/oauth/authorize/?client_id=abc"),
  exchangeSentryToken: vi.fn(async () => ({ access_token: "acc", expires_in: 3600, token_type: "bearer", scope: "org:read" })),
  requestSentryDeviceCode: vi.fn(async () => ({
    device_code: "device",
    user_code: "ABCD-EFGH",
    verification_uri: "https://sentry.io/oauth/device/",
    expires_in: 600,
    interval: 5,
  })),
  listSentryOrganizationProjects: vi.fn(async () => [{ id: "p1" }]),
}));

vi.mock("../services/sentry-auth.service.js", () => ({
  DEVICE_GRANT_TYPE: "urn:ietf:params:oauth:grant-type:device_code",
  ...mocks,
}));

import sentryAuthRoutes from "./sentry-auth.js";

describe("sentry-auth routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/sentry", sentryAuthRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSentryApiTokenConfigured.mockReturnValue(true);
    mocks.isSentryOAuthConfigured.mockReturnValue(true);
  });

  it("returns integration status", async () => {
    const res = await request(app).get("/api/sentry/status").expect(200);
    expect(res.body.success).toBe(true);
  });

  it("returns OAuth authorization URL", async () => {
    const res = await request(app).get("/api/sentry/oauth/authorize?state=abc").expect(200);
    expect(res.body.data.authorizationUrl).toContain("sentry.io");
    expect(res.body.data.codeVerifier).toBe("verifier");
  });

  it("returns 400 for invalid token exchange payload", async () => {
    await request(app).post("/api/sentry/oauth/token").send({ grantType: "authorization_code" }).expect(400);
  });

  it("lists projects", async () => {
    const res = await request(app).get("/api/sentry/projects").expect(200);
    expect(res.body.data).toEqual([{ id: "p1" }]);
  });
});
