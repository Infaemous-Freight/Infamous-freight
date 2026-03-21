/**
 * Auth Routes Tests – Login, Refresh & Logout
 *
 * Routes tested:
 * - POST /api/auth/login
 * - POST /api/auth/refresh
 * - POST /api/auth/logout
 */

const request = require("supertest");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-jwt-secret";

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
};

jest.mock("../../db/prisma", () => ({
  prisma: mockPrisma,
  getPrisma: () => mockPrisma,
}));

jest.mock("../../services/encryption", () => ({
  hashPassword: jest.fn((p) => `hashed_${p}`),
  decrypt: jest.fn(),
}));

jest.mock("../../services/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../middleware/security", () => ({
  limiters: {
    auth: (req, res, next) => next(),
    general: (req, res, next) => next(),
  },
  authenticate: (req, res, next) => {
    const auth = req.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing bearer token" });
    }
    try {
      const decoded = jwt.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  },
  auditLog: (req, res, next) => next(),
}));

jest.mock("../../middleware/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("../../config/env", () => ({
  env: { JWT_SECRET: "test-jwt-secret" },
}));

jest.mock("../../auth/tokenUtils", () => {
  const crypto = require("crypto");
  const jwt = require("jsonwebtoken");
  return {
    hashRefreshToken: (raw) => crypto.createHash("sha256").update(raw).digest("hex"),
    generateRefreshToken: () => crypto.randomBytes(40).toString("hex"),
    issueAccessToken: (user, secret) =>
      jwt.sign(
        { sub: user.id, email: user.email, role: user.role, tenant_id: user.tenantId, scopes: [] },
        secret,
        { expiresIn: "15m" },
      ),
  };
});

// ──────────────────────────────────────────────
// App factory
// ──────────────────────────────────────────────

const authRouter = require("../auth");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  app.use((err, req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  return app;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const HASH = bcrypt.hashSync("ValidPass123!", 1);

const mockUser = {
  id: "user-001",
  tenantId: "tenant-001",
  email: "driver@example.com",
  role: "dispatcher",
  passwordHash: HASH,
};

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 1000);

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe("Auth Routes – Login / Refresh / Logout", () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────
  describe("POST /api/auth/login", () => {
    it("returns accessToken + refreshToken on valid credentials", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "driver@example.com", password: "ValidPass123!" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(typeof res.body.accessToken).toBe("string");
      expect(typeof res.body.refreshToken).toBe("string");

      // Access token must be a valid JWT
      const decoded = jwt.verify(res.body.accessToken, "test-jwt-secret");
      expect(decoded.sub).toBe("user-001");
      expect(decoded.role).toBe("dispatcher");
      expect(decoded.tenant_id).toBe("tenant-001");
    });

    it("rejects wrong password with 401", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "driver@example.com", password: "WrongPass!" });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid credentials/i);
    });

    it("rejects unknown email with 401", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@example.com", password: "AnyPass123!" });

      expect(res.status).toBe(401);
    });

    it("rejects missing email with 400", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "ValidPass123!" });

      expect([400, 422]).toContain(res.status);
    });

    it("rejects invalid email format with 400", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "not-an-email", password: "ValidPass123!" });

      expect([400, 422]).toContain(res.status);
    });

    it("rejects missing password with 400", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "driver@example.com" });

      expect([400, 422]).toContain(res.status);
    });

    it("returns 503 when database is unavailable", async () => {
      // Temporarily override the mock to simulate no DB
      jest.resetModules();

      const express2 = require("express");
      jest.mock("../../db/prisma", () => ({
        prisma: null,
        getPrisma: () => null,
      }));
      const router2 = require("../auth");
      const app2 = express2();
      app2.use(express2.json());
      app2.use("/api/auth", router2);
      app2.use((err, req, res, _next) => res.status(500).json({ error: err.message }));

      const res = await request(app2)
        .post("/api/auth/login")
        .send({ email: "driver@example.com", password: "ValidPass123!" });

      expect(res.status).toBe(503);

      // Restore mocks for subsequent tests
      jest.resetModules();
      jest.mock("../../db/prisma", () => ({
        prisma: mockPrisma,
        getPrisma: () => mockPrisma,
      }));
    });
  });

  // ──────────────────────────────────────────
  describe("POST /api/auth/refresh", () => {
    it("issues a new accessToken for a valid refresh token", async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-001",
        tokenHash: "hash-of-token",
        revoked: false,
        expiresAt: FUTURE,
        user: { id: "user-001", tenantId: "tenant-001", email: "driver@example.com", role: "dispatcher" },
      });

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "some-opaque-token" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(typeof res.body.accessToken).toBe("string");

      const decoded = jwt.verify(res.body.accessToken, "test-jwt-secret");
      expect(decoded.sub).toBe("user-001");
    });

    it("rejects a revoked refresh token with 401", async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-002",
        tokenHash: "hash",
        revoked: true,
        expiresAt: FUTURE,
        user: mockUser,
      });

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "revoked-token" });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid or expired/i);
    });

    it("rejects an expired refresh token with 401", async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-003",
        tokenHash: "hash",
        revoked: false,
        expiresAt: PAST,
        user: mockUser,
      });

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "expired-token" });

      expect(res.status).toBe(401);
    });

    it("rejects when token not found with 401", async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "unknown-token" });

      expect(res.status).toBe(401);
    });

    it("rejects missing refreshToken field with 400", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({});

      expect([400, 422]).toContain(res.status);
    });
  });

  // ──────────────────────────────────────────
  describe("POST /api/auth/logout", () => {
    it("revokes the refresh token and returns ok", async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .post("/api/auth/logout")
        .send({ refreshToken: "some-token" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toMatch(/Logged out/i);
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { revoked: true } }),
      );
    });

    it("returns ok even when token was not found (idempotent)", async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      const res = await request(app)
        .post("/api/auth/logout")
        .send({ refreshToken: "nonexistent-token" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("rejects missing refreshToken field with 400", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .send({});

      expect([400, 422]).toContain(res.status);
    });
  });
});
