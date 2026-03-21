import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    tenant: {
      create: vi.fn(),
    },
    authSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../db/prisma.js", () => ({ prisma: mockPrisma }));

const { mockBcrypt } = vi.hoisted(() => ({
  mockBcrypt: {
    hash: vi.fn(async () => "hashed-password"),
    compare: vi.fn(
      async (plain: string, hash: string) =>
        plain === "supersecret123" && hash === "hashed-password",
    ),
  },
}));

vi.mock("bcryptjs", () => ({
  default: mockBcrypt,
}));

vi.mock("../../middleware/rateLimit.js", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../env.js", () => ({
  ENV: {
    JWT_SECRET: "test-secret",
    CORS_ORIGIN: "http://localhost:3000",
  },
}));

import express from "express";
import authRoutes from "./routes.js";
import { errorHandler, notFound } from "../../middleware/error-handler.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

describe("auth module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        tenant: { create: mockPrisma.tenant.create },
        user: { create: mockPrisma.user.create },
      }),
    );
  });

  it("registers a user without returning the password hash", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.tenant.create.mockResolvedValue({ id: "tenant_1", name: "Acme" });
    mockPrisma.user.create.mockResolvedValue({
      id: "user_1",
      tenantId: "tenant_1",
      email: "founder@acme.com",
      role: "admin",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    mockPrisma.authSession.create.mockResolvedValue({ id: "session_1" });

    const app = createTestApp();
    const response = await request(app).post("/api/auth/register").send({
      email: "Founder@Acme.com",
      password: "supersecret123",
      tenantName: "Acme",
      role: "admin",
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe("founder@acme.com");
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.tokens.accessToken).toBeTypeOf("string");
    expect(response.body.data.tokens.refreshToken).toBeTypeOf("string");
  });

  it("rejects bad credentials", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const app = createTestApp();

    const response = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "wrong",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/Invalid credentials/);
  });

  it("returns current user for a valid access token", async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({
        id: "user_1",
        tenantId: "tenant_1",
        email: "founder@acme.com",
        role: "admin",
        passwordHash: "hashed-password",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      })
      .mockResolvedValueOnce({
        id: "user_1",
        tenantId: "tenant_1",
        email: "founder@acme.com",
        role: "admin",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      });
    mockPrisma.authSession.create.mockResolvedValue({ id: "session_1" });

    const app = createTestApp();
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "founder@acme.com",
      password: "supersecret123",
    });

    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.data.tokens.accessToken}`);

    expect(loginResponse.status).toBe(200);
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.email).toBe("founder@acme.com");
    expect(meResponse.body.data.passwordHash).toBeUndefined();
  });

  it("rotates refresh tokens and logout revokes sessions", async () => {
    mockPrisma.authSession.findUnique.mockResolvedValue({
      id: "session_1",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user: {
        id: "user_1",
        tenantId: "tenant_1",
        email: "founder@acme.com",
        role: "admin",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    mockPrisma.authSession.update.mockResolvedValue({});
    mockPrisma.authSession.create.mockResolvedValue({ id: "session_2" });

    const app = createTestApp();
    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: "a".repeat(64),
      });

    expect(refreshResponse.status).toBe(200);
    expect(mockPrisma.authSession.update).toHaveBeenCalled();

    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .send({
        refreshToken: "a".repeat(64),
      });

    expect(logoutResponse.status).toBe(204);
  });
});
