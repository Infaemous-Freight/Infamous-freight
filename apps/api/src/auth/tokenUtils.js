/**
 * Shared token utilities for the auth module.
 * CommonJS module – importable by both JS route handlers and TS modules.
 *
 * This file is a thin wrapper around the canonical implementations in
 * `loginAuth` to avoid duplicating token primitives (hash/generate/issue).
 */

const {
  hashRefreshToken,
  generateRefreshToken,
  issueAccessToken,
} = require("./loginAuth");
module.exports = { hashRefreshToken, generateRefreshToken, issueAccessToken };
