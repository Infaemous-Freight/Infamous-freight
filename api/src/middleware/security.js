const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

// Rate limiters
const limiters = {
  general: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.sub || req.ip,
  }),
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    message: { error: "Too many authentication attempts. Try again later." },
  }),
  ai: rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.sub || req.ip,
  }),
  billing: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.sub || req.ip,
  }),
};

// Authentication via JWT
function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || req.headers.Authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }
    const token = header.replace("Bearer ", "");
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server auth misconfiguration" });
    }
    const payload = jwt.verify(token, secret);
    req.user = payload; // expected shape: { sub, email?, role?, scopes?: string[] }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Scope enforcement
function requireScope(required) {
  const requiredScopes = Array.isArray(required) ? required : [required];
  return (req, res, next) => {
    const scopes = req.user?.scopes || [];
    const hasAll = requiredScopes.every((s) => scopes.includes(s));
    if (!hasAll) {
      return res
        .status(403)
        .json({ error: "Insufficient scope", required: requiredScopes });
    }
    next();
  };
}

// Audit log (basic)
function auditLog(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const maskedAuthorization = req.headers.authorization ? "***" : undefined;
    console.info("request", {
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      duration,
      user: req.user?.sub,
      ip: req.ip,
      auth: maskedAuthorization,
    });
  });
  next();
}

module.exports = {
  limiters,
  rateLimit: limiters.general,
  authenticate,
  requireScope,
  auditLog,
};
