/**
 * Shared token utilities for the auth module.
 * CommonJS module – importable by both JS route handlers and TS modules.
 */

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/**
 * Hash a raw refresh-token string with SHA-256 for safe DB storage.
 * @param {string} raw - Raw token string
 * @returns {string} Hex-encoded SHA-256 hash
 */
function hashRefreshToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Generate a cryptographically-random opaque refresh token string.
 * @returns {string} 80-character hex string
 */
function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

/**
 * Issue a short-lived JWT access token (15 min).
 * @param {{ id: string, email: string, role: string, tenantId: string }} user
 * @param {string} secret - JWT signing secret
 * @returns {string} Signed JWT
 */
function issueAccessToken(user, secret) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenantId,
      scopes: [],
    },
    secret,
    { expiresIn: "15m" },
  );
}

module.exports = { hashRefreshToken, generateRefreshToken, issueAccessToken };
