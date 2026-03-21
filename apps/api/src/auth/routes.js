const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashRefreshToken } = require("./jwt");
const { getUserId } = require("./user");
const { env } = require("../config/env");
const { getPrisma } = require("../db/prisma");

const router = express.Router();

const roleScopes = {
  admin: ["admin", "users:read", "users:write", "shipments:read", "shipments:write", "organization:read", "organization:write"],
  dispatcher: ["shipments:read", "shipments:write", "loads:read", "loads:write", "dispatch:read", "dispatch:write", "users:read"],
  driver: ["shipments:read", "loads:read", "dispatch:read"],
  viewer: ["shipments:read", "loads:read", "users:read"],
};

function normalizeRole(role) {
  return String(role || "dispatcher").trim().toLowerCase();
}

function getScopesForRole(role) {
  return roleScopes[normalizeRole(role)] || roleScopes.dispatcher;
}

function serializeAuthUser(user) {
  return {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: normalizeRole(user.role),
    scopes: getScopesForRole(user.role),
  };
}

async function persistRefreshToken(prisma, payload, refreshToken) {
  if (!prisma?.refreshToken) {
    return null;
  }

  const decoded = verifyRefreshToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      userId: payload.sub,
      tenantId: payload.org_id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
    },
  });

  return decoded;
}

async function rotateRefreshToken(prisma, refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);

  if (!prisma?.refreshToken) {
    return decoded;
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!stored) {
    const error = new Error("Refresh token revoked or expired");
    error.statusCode = 401;
    throw error;
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return decoded;
}

// POST /v1/auth/dev-token -> issue a JWT for a given userId (dev helper)
router.post("/dev-token", express.json(), (req, res) => {
  try {
    const Schema = z.object({ userId: z.string().min(1).max(120) });
    const body = Schema.parse(req.body);

    if (env.nodeEnv === "production") {
      return res.status(403).json({ ok: false, error: "dev-token disabled" });
    }

    const accessToken = signAccessToken({
      sub: body.userId,
      email: undefined,
      role: "dispatcher",
      org_id: req.headers["x-org-id"] || "dev-tenant",
      scopes: roleScopes.dispatcher,
    });
    res.json({ ok: true, token: accessToken, accessToken });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message || "invalid request" });
  }
});

router.post("/login", express.json(), async (req, res) => {
  try {
    const schema = z.object({
      email: z.email(),
      password: z.string().min(8),
      tenantId: z.string().min(1).max(191),
    });
    const body = schema.parse(req.body);

    const prisma = getPrisma();
    if (!prisma?.user) {
      return res.status(503).json({ ok: false, error: "Database unavailable" });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: body.email.toLowerCase(),
        tenantId: body.tenantId,
      },
    });

    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(body.password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const authUser = serializeAuthUser(user);
    const tokenPayload = {
      sub: authUser.id,
      email: authUser.email,
      role: authUser.role,
      org_id: authUser.tenantId,
      scopes: authUser.scopes,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    await persistRefreshToken(prisma, tokenPayload, refreshToken);

    return res.json({
      ok: true,
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: env.jwtExpiry,
      refreshExpiresIn: env.jwtRefreshExpiry,
      user: authUser,
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.name === "ZodError" ? 400 : 500);
    return res.status(statusCode).json({ ok: false, error: err.message || "Authentication failed" });
  }
});

router.post("/refresh", express.json(), async (req, res) => {
  try {
    const schema = z.object({ refreshToken: z.string().min(1) });
    const { refreshToken } = schema.parse(req.body);
    const prisma = getPrisma();

    const { accessToken, nextRefreshToken } = await prisma.$transaction(async (tx) => {
      const decoded = await rotateRefreshToken(tx, refreshToken);

      const payload = {
        sub: decoded.sub,
        email: decoded.email,
        role: normalizeRole(decoded.role),
        org_id: decoded.org_id,
        scopes: Array.isArray(decoded.scopes) ? decoded.scopes : getScopesForRole(decoded.role),
      };

      const accessToken = signAccessToken(payload);
      const nextRefreshToken = signRefreshToken(payload);
      await persistRefreshToken(tx, payload, nextRefreshToken);

      return { accessToken, nextRefreshToken };
    });
    return res.json({
      ok: true,
      accessToken,
      refreshToken: nextRefreshToken,
      tokenType: "Bearer",
      expiresIn: env.jwtExpiry,
      refreshExpiresIn: env.jwtRefreshExpiry,
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.name === "ZodError" ? 400 : 500);
    return res.status(statusCode).json({ ok: false, error: err.message || "Unable to refresh token" });
  }
});

router.post("/logout", express.json(), async (req, res) => {
  try {
    const schema = z.object({ refreshToken: z.string().min(1) });
    const { refreshToken } = schema.parse(req.body);
    const prisma = getPrisma();

    if (prisma?.refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: hashRefreshToken(refreshToken),
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    const statusCode = err.name === "ZodError" ? 400 : 500;
    return res.status(statusCode).json({ ok: false, error: err.message || "Unable to logout" });
  }
});

// GET /v1/auth/me -> return current user id
router.get("/me", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ ok: false, error: "unauthorized" });

  const auth = req.auth || req.user || {};
  res.json({
    ok: true,
    userId,
    nodeEnv: env.nodeEnv,
    tenantId: auth.organizationId || auth.org_id,
    role: auth.role,
    scopes: auth.scopes || [],
  });
});

module.exports = router;
module.exports.authRouter = router;
