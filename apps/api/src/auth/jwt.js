const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function getAccessSecret() {
  return env.jwtSecret;
}

function getRefreshSecret() {
  return env.jwtRefreshSecret || env.jwtSecret;
}

function signAccessToken(payload) {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: env.jwtExpiry || "15m" });
}

function signRefreshToken(payload) {
  const jwtId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex");

  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: env.jwtRefreshExpiry || "30d",
    jwtid: jwtId,
  });
}

function signUserToken(userId) {
  return signAccessToken({ sub: userId, scopes: ["user:avatar"], role: "dispatcher", org_id: "dev-tenant" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, getAccessSecret());
  } catch {
    return null;
  }
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getRefreshSecret());
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  signUserToken,
  verifyToken,
  verifyRefreshToken,
  hashRefreshToken,
};
