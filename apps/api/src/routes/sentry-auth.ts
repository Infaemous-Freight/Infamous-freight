import { Router } from "express";
import { z } from "zod";

import {
  buildSentryAuthorizationUrl,
  DEVICE_GRANT_TYPE,
  exchangeSentryToken,
  generatePkcePair,
  isSentryApiTokenConfigured,
  isSentryOAuthConfigured,
  listSentryOrganizationProjects,
  requestSentryDeviceCode,
} from "../services/sentry-auth.service.js";

const sentryAuthRoutes: Router = Router();

const scopesSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.split(/[\s,]+/).filter(Boolean))
  .optional();

const oauthAuthorizeSchema = z.object({
  scopes: scopesSchema,
  state: z.string().trim().min(1).max(512).optional(),
  redirectUri: z.string().url().optional(),
  usePkce: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
});

const oauthTokenSchema = z
  .object({
    grantType: z.enum(["authorization_code", "refresh_token", DEVICE_GRANT_TYPE]),
    code: z.string().trim().min(1).optional(),
    codeVerifier: z.string().trim().min(43).max(128).optional(),
    refreshToken: z.string().trim().min(1).optional(),
    deviceCode: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.grantType === "authorization_code" && !value.code) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["code"], message: "code is required" });
    }

    if (value.grantType === "refresh_token" && !value.refreshToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["refreshToken"],
        message: "refreshToken is required",
      });
    }

    if (value.grantType === DEVICE_GRANT_TYPE && !value.deviceCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deviceCode"],
        message: "deviceCode is required",
      });
    }
  });

const deviceCodeSchema = z.object({
  scopes: scopesSchema,
});

sentryAuthRoutes.get("/status", (_req, res) => {
  res.json({
    success: true,
    data: {
      sentryApiTokenConfigured: isSentryApiTokenConfigured(),
      sentryOAuthConfigured: isSentryOAuthConfigured(),
    },
  });
});

sentryAuthRoutes.get("/oauth/authorize", (req, res) => {
  const parsed = oauthAuthorizeSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() });
  }

  if (!isSentryOAuthConfigured()) {
    return res.status(503).json({
      success: false,
      error: "Sentry OAuth is disabled: SENTRY_OAUTH_CLIENT_ID is not configured",
    });
  }

  const { scopes, state, redirectUri, usePkce } = parsed.data;
  const pkce = usePkce ? generatePkcePair() : undefined;
  const authorizationUrl = buildSentryAuthorizationUrl({
    scopes,
    state,
    redirectUri,
    codeChallenge: pkce?.codeChallenge,
  });

  return res.json({
    success: true,
    data: {
      authorizationUrl,
      codeVerifier: pkce?.codeVerifier,
      codeChallenge: pkce?.codeChallenge,
      codeChallengeMethod: pkce ? "S256" : undefined,
      scopes: scopes ?? ["org:read", "project:read"],
    },
  });
});


sentryAuthRoutes.get("/oauth/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : undefined;
  const codeVerifier =
    typeof req.query.codeVerifier === "string" ? req.query.codeVerifier : undefined;

  if (!isSentryOAuthConfigured()) {
    return res.status(503).json({
      success: false,
      error: "Sentry OAuth is disabled: SENTRY_OAUTH_CLIENT_ID is not configured",
    });
  }

  if (!code) {
    return res.status(400).json({ success: false, error: "Missing code query parameter" });
  }

  try {
    const token = await exchangeSentryToken({ grantType: "authorization_code", code, codeVerifier });
    return res.json({ success: true, data: token });
  } catch (error) {
    return res.status(502).json({ success: false, error: (error as Error).message });
  }
});

sentryAuthRoutes.post("/oauth/token", async (req, res) => {
  const parsed = oauthTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() });
  }

  if (!isSentryOAuthConfigured()) {
    return res.status(503).json({
      success: false,
      error: "Sentry OAuth is disabled: SENTRY_OAUTH_CLIENT_ID is not configured",
    });
  }

  try {
    const token = await exchangeSentryToken(parsed.data);
    return res.json({ success: true, data: token });
  } catch (error) {
    return res.status(502).json({ success: false, error: (error as Error).message });
  }
});

sentryAuthRoutes.post("/oauth/device/code", async (req, res) => {
  const parsed = deviceCodeSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() });
  }

  if (!isSentryOAuthConfigured()) {
    return res.status(503).json({
      success: false,
      error: "Sentry OAuth is disabled: SENTRY_OAUTH_CLIENT_ID is not configured",
    });
  }

  try {
    const payload = await requestSentryDeviceCode(parsed.data.scopes);
    return res.json({ success: true, data: payload });
  } catch (error) {
    return res.status(502).json({ success: false, error: (error as Error).message });
  }
});

sentryAuthRoutes.get("/projects", async (req, res) => {
  const orgSlug = typeof req.query.organizationSlug === "string" ? req.query.organizationSlug : undefined;

  if (!isSentryApiTokenConfigured()) {
    return res.status(503).json({
      success: false,
      error: "Sentry API token auth is disabled: SENTRY_AUTH_TOKEN is not configured",
    });
  }

  try {
    const projects = await listSentryOrganizationProjects(orgSlug);
    return res.json({ success: true, data: projects });
  } catch (error) {
    return res.status(502).json({ success: false, error: (error as Error).message });
  }
});

export default sentryAuthRoutes;
