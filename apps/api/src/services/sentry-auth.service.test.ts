import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

vi.mock("../config/env.js", () => ({
  env: {
    sentryAuthToken: "token-123",
    sentryOrgSlug: "infamous",
    sentryOAuthClientId: "client-123",
    sentryOAuthClientSecret: "secret-123",
    sentryOAuthRedirectUri: "https://api.infamousfreight.com/api/sentry/oauth/callback",
  },
}));

import {
  buildSentryAuthorizationUrl,
  DEVICE_GRANT_TYPE,
  exchangeSentryToken,
  generatePkcePair,
  listSentryOrganizationProjects,
  requestSentryDeviceCode,
} from "./sentry-auth.service.js";

describe("sentry-auth.service", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("builds OAuth authorization URL with PKCE parameters", () => {
    const url = buildSentryAuthorizationUrl({
      scopes: ["org:read", "project:read"],
      state: "abc",
      codeChallenge: "challenge",
    });

    expect(url).toContain("https://sentry.io/oauth/authorize/");
    expect(url).toContain("client_id=client-123");
    expect(url).toContain("scope=org%3Aread+project%3Aread");
    expect(url).toContain("code_challenge=challenge");
    expect(url).toContain("code_challenge_method=S256");
  });

  it("generates PKCE values", () => {
    const pair = generatePkcePair();
    expect(pair.codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(pair.codeVerifier.length).toBeLessThanOrEqual(128);
    expect(pair.codeChallenge.length).toBeGreaterThan(20);
  });

  it("exchanges OAuth authorization code for tokens", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ access_token: "acc", expires_in: 3600, token_type: "bearer", scope: "org:read" }),
    });

    const token = await exchangeSentryToken({
      grantType: "authorization_code",
      code: "auth-code",
      codeVerifier: "verifier-value-with-sufficient-length-1234567890123",
    });

    expect(token.access_token).toBe("acc");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sentry.io/oauth/token/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("requests device code", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          device_code: "device",
          user_code: "ABCD-EFGH",
          verification_uri: "https://sentry.io/oauth/device/",
          expires_in: 600,
          interval: 5,
        }),
    });

    const response = await requestSentryDeviceCode(["org:read", "project:read"]);
    expect(response.device_code).toBe("device");
  });

  it("polls token endpoint using device grant type", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ access_token: "acc", expires_in: 3600, token_type: "bearer", scope: "org:read" }),
    });

    await exchangeSentryToken({
      grantType: DEVICE_GRANT_TYPE,
      deviceCode: "device-code",
    });

    const call = fetchMock.mock.calls[0];
    const init = call[1] as RequestInit;
    const body = init.body as URLSearchParams;

    expect(body.get("grant_type")).toBe(DEVICE_GRANT_TYPE);
    expect(body.get("device_code")).toBe("device-code");
  });

  it("lists organization projects using API bearer token", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify([{ id: "1", slug: "api" }]),
    });

    const response = await listSentryOrganizationProjects();
    expect(Array.isArray(response)).toBe(true);

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-123");
  });
});
