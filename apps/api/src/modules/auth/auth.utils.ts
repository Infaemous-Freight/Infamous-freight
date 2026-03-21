import crypto from "node:crypto";
import type { CookieOptions, Response } from "express";
import jwt, { type Algorithm, type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/errors.js";
import type {
  JwtAccessTokenPayload,
  JwtRefreshTokenPayload,
  SanitizedUser,
} from "./auth.types.js";

function getJwtPrivateKeyOrSecret(): Secret {
  if (env.jwtAlgorithm === "RS256") {
    if (!env.jwtPrivateKey) {
      throw new Error("JWT private key is not configured");
    }
    return env.jwtPrivateKey;
  }

  if (!env.jwtSecret) {
    throw new Error("JWT secret is not configured");
  }

  return env.jwtSecret;
}

function getJwtPublicKeyOrSecret(): Secret {
  if (env.jwtAlgorithm === "RS256") {
    if (!env.jwtPublicKey) {
      throw new Error("JWT public key is not configured");
    }
    return env.jwtPublicKey;
  }

  if (!env.jwtSecret) {
    throw new Error("JWT secret is not configured");
  }

  return env.jwtSecret;
}

function buildJwtOptions(expiresIn: string): SignOptions {
  return {
    algorithm: env.jwtAlgorithm as Algorithm,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
}

export function generateJti(): string {
  return crypto.randomUUID();
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(payload: JwtAccessTokenPayload): string {
  return jwt.sign(payload, getJwtPrivateKeyOrSecret(), buildJwtOptions(env.jwtAccessExpiresIn));
}

export function signRefreshToken(payload: JwtRefreshTokenPayload): string {
  return jwt.sign(payload, getJwtPrivateKeyOrSecret(), buildJwtOptions(env.jwtRefreshExpiresIn));
}

export function verifyAccessToken(token: string): JwtAccessTokenPayload {
  const decoded = jwt.verify(token, getJwtPublicKeyOrSecret(), {
    algorithms: [env.jwtAlgorithm as Algorithm],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

  if (typeof decoded === "string" || decoded.type !== "access") {
    throw new ApiError(401, "INVALID_ACCESS_TOKEN", "Invalid or expired access token");
  }

  return decoded as JwtAccessTokenPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshTokenPayload {
  const decoded = jwt.verify(token, getJwtPublicKeyOrSecret(), {
    algorithms: [env.jwtAlgorithm as Algorithm],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

  if (typeof decoded === "string" || decoded.type !== "refresh") {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");
  }

  return decoded as JwtRefreshTokenPayload;
}

export function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
    domain: env.authCookieDomain,
    path: env.authCookiePath,
  };
}

export function setRefreshTokenCookie(response: Response, refreshToken: string): void {
  if (!env.authCookieEnabled) {
    return;
  }

  response.cookie(env.authCookieName, refreshToken, {
    ...getRefreshCookieOptions(),
    maxAge: parseDurationToMilliseconds(env.jwtRefreshExpiresIn),
  });
}

export function clearRefreshTokenCookie(response: Response): void {
  if (!env.authCookieEnabled) {
    return;
  }

  response.clearCookie(env.authCookieName, getRefreshCookieOptions());
}

export function parseDurationToMilliseconds(duration: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration);
  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return value * multipliers[unit];
}

export function calculateExpiryDate(duration: string): Date {
  return new Date(Date.now() + parseDurationToMilliseconds(duration));
}

export function sanitizeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SanitizedUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
