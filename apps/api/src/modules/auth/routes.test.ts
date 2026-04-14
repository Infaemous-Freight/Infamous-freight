import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../db/prisma.js", () => ({ prisma: mockPrisma }));

const { mockArgon2 } = vi.hoisted(() => ({
  mockArgon2: {
    hash: vi.fn(async () => "hashed-password"),
    verify: vi.fn(
      async (hash: string, plain: string) =>
        hash === "hashed-password" && plain.includes("Sup3r\$ecret!"),
    ),
    argon2id: 2,
  },
}));

vi.mock("argon2", () => ({
  default: mockArgon2,
  ...mockArgon2,
}));

vi.mock("../../middleware/rateLimit.js", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../../config/env.js", () => ({
  env: {
    nodeEnv: "test",
    jwtAlgorithm: "HS256",
    jwtSecret: "test-secret-key-that-is-at-least-32-chars-long",
    jwtAccessExpiresIn: "15m",
    jwtRefreshExpiresIn: "7d",
    jwtIssuer: "infamous-freight-test",
    jwtAudience: "infamous-freight-test",
    jwtPrivateKey: undefined,
    jwtPublicKey: undefined,
    corsOrigin: "http://localhost:3000",
    passwordPepper: "test-pepper",
    argon2: { memoryCost: 65536, timeCost: 3, parallelism: 4 },
    authCookieEnabled: false,
    authCookieName: "refreshToken",
    authCookiePath: "/api/auth",
    authCookieSecure: false,
    authCookieSameSite: "strict",
    authCookieDomain: undefined,
    cookieSecret: "test-cookie-secret-32-chars-long-x",
    rateLimitAuthMax: 100,
    rateLimitGeneralMax: 1000,
    persistenceMode: "db",
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

const STRONG_PASSWORD = "Sup3r\$ecret!";

const mockUser = {
  id: "user_1",
  email: "founder@acme.com",
  firstName: "Founder",
  lastName: "Acme",
  role: "ADMIN",
  isActive: true,
  passwordHash: "hashed-password",
  emailVerifiedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("auth module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.update.mockResolvedValue(undefined);
    mockPrisma.refreshToken.create.mockResolvedValue({
      id: "rt_1",
      jti: "test-jti",
      userId: "user_1",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      createdAt: new Date(),
    });
  });

  it("registers a user and returns accessToken without passwordHash", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(mockUser);

    const app = createTestApp();
    const response = await request(app).post("/api/auth/register").send({
      firstName: "Founder",
      lastName: "Acme",
      email: "Founder@Acme.com",
      password: STRONG_PASSWORD,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe("founder@acme.com");
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.accessToken).toBeTypeOf("string");
  });

  it("rejects register with a weak password", async () => {
    const app = createTestApp();
    const response = await request(app).post("/api/auth/register").send({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 for unknown credentials on login", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const app = createTestApp();

    const response = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "anypassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toMatch(/Invalid email or password/i);
  });

  it("returns current user for a valid access token", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockUser);

    const app = createTestApp();
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "founder@acme.com",
      password: STRONG_PASSWORD,
    });

    expect(loginResponse.status).toBe(200);
    const accessToken = loginResponse.body.data?.accessToken;
    expect(accessToken).toBeTypeOf("string");

    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.email).toBe("founder@acme.com");
    expect(meResponse.body.data.passwordHash).toBeUndefined();
  });

  it("returns 401 for /me without a token", async () => {
    const app = createTestApp();
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });
});
