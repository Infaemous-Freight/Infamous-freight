/**
 * Core JWT authentication utilities for login, token generation, and token hashing.
 * Used by the /api/auth/* route handlers.
 */
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  tenant_id: string;
  scopes: string[];
}

/**
 * Hash a raw refresh-token value with SHA-256 for safe storage.
 */
export function hashRefreshToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Generate a cryptographically-random opaque refresh token string.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

/**
 * Issue a short-lived (15 min) JWT access token.
 */
export function issueAccessToken(
  user: { id: string; email: string; role: string; tenantId: string },
  secret: string,
  scopes: string[] = [],
): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenant_id: user.tenantId,
    scopes,
  };
  return jwt.sign(payload, secret, { expiresIn: "15m" });
}

/**
 * Verify a JWT access token and return the decoded payload.
 * Throws if the token is invalid or expired.
 */
export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  return jwt.verify(token, secret) as AccessTokenPayload;
}
