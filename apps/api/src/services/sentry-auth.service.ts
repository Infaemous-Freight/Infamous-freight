import crypto from "node:crypto";

import { env } from "../config/env.js";

const SENTRY_BASE_URL = "https://sentry.io";
const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface SentryTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at?: string;
  token_type: string;
  scope: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface SentryDeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

interface TokenExchangeParams {
  grantType: "authorization_code" | "refresh_token" | typeof DEVICE_GRANT_TYPE;
  code?: string;
  codeVerifier?: string;
  refreshToken?: string;
  deviceCode?: string;
}

function getOAuthClientId(): string {
  const clientId = env.sentryOAuthClientId;
  if (!clientId) {
    throw new Error("Missing SENTRY_OAUTH_CLIENT_ID configuration");
  }
  return clientId;
}

function buildFormBody(values: Record<string, string | undefined>): URLSearchParams {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string" && value.length > 0) {
      body.set(key, value);
    }
  }
  return body;
}

async function sentryRequest<T>(path: string, init: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${SENTRY_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const rawBody = await response.text();
  const parsed = rawBody.length > 0 ? (JSON.parse(rawBody) as JsonValue) : null;

  if (!response.ok) {
    const errorMessage =
      typeof parsed === "object" &&
      parsed !== null &&
      "detail" in parsed &&
      typeof parsed.detail === "string"
        ? parsed.detail
        : `Sentry request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return parsed as T;
}

export function isSentryApiTokenConfigured(): boolean {
  return Boolean(env.sentryAuthToken);
}

export function isSentryOAuthConfigured(): boolean {
  return Boolean(env.sentryOAuthClientId);
}

export function generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(64).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function buildSentryAuthorizationUrl(options?: {
  scopes?: string[];
  redirectUri?: string;
  state?: string;
  codeChallenge?: string;
}): string {
  const scopes = options?.scopes?.length ? options.scopes : ["org:read", "project:read"];
  const redirectUri = options?.redirectUri ?? env.sentryOAuthRedirectUri;
  const query = new URLSearchParams({
    client_id: getOAuthClientId(),
    response_type: "code",
    scope: scopes.join(" "),
  });

  if (redirectUri) {
    query.set("redirect_uri", redirectUri);
  }

  if (options?.state) {
    query.set("state", options.state);
  }

  if (options?.codeChallenge) {
    query.set("code_challenge", options.codeChallenge);
    query.set("code_challenge_method", "S256");
  }

  return `${SENTRY_BASE_URL}/oauth/authorize/?${query.toString()}`;
}

export async function exchangeSentryToken(params: TokenExchangeParams): Promise<SentryTokenResponse> {
  const body = buildFormBody({
    client_id: getOAuthClientId(),
    client_secret: env.sentryOAuthClientSecret,
    grant_type: params.grantType,
    code: params.code,
    code_verifier: params.codeVerifier,
    refresh_token: params.refreshToken,
    device_code: params.deviceCode,
  });

  return sentryRequest<SentryTokenResponse>("/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

export async function requestSentryDeviceCode(scopes?: string[]): Promise<SentryDeviceCodeResponse> {
  const body = buildFormBody({
    client_id: getOAuthClientId(),
    scope: scopes?.length ? scopes.join(" ") : "org:read project:read",
  });

  return sentryRequest<SentryDeviceCodeResponse>("/oauth/device/code/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

export async function listSentryOrganizationProjects(organizationSlug?: string): Promise<JsonValue> {
  const authToken = env.sentryAuthToken;
  const orgSlug = organizationSlug ?? env.sentryOrgSlug;

  if (!authToken) {
    throw new Error("Missing SENTRY_AUTH_TOKEN configuration");
  }

  if (!orgSlug) {
    throw new Error("Missing SENTRY_ORG_SLUG configuration");
  }

  return sentryRequest<JsonValue>(`/api/0/organizations/${orgSlug}/projects/`, {
    method: "GET",
  }, authToken);
}

export { DEVICE_GRANT_TYPE };
