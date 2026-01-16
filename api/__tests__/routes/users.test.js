const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const usersRoutes = require("../../src/routes/users");

jest.mock("../../src/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma } = require("../../src/db/prisma");

describe("Users Routes", () => {
  let app, validToken, adminToken;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api", usersRoutes);

    validToken = jwt.sign(
      {
        sub: "user-123",
        email: "test@example.com",
        role: "user",
        scopes: ["users:read", "users:write"],
      },
      process.env.JWT_SECRET,
    );

    adminToken = jwt.sign(
      {
        sub: "admin-123",
        email: "admin@example.com",
        role: "admin",
        scopes: ["users:read", "users:write", "admin"],
      },
      process.env.JWT_SECRET,
    );

    jest.clearAllMocks();
  });

  describe("GET /users/me", () => {
    it("should return current user profile", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        role: "user",
        shipments: [],
      });

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.user).toMatchObject({
        id: "user-123",
        email: "test@example.com",
        role: "user",
      });
    });

    it("should require users:read scope", async () => {
      const noScopeToken = jwt.sign(
        { sub: "user-123", scopes: [] },
        process.env.JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${noScopeToken}`);

      expect(response.status).toBe(403);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/users/me");

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /users/me", () => {
    it("should update user profile with valid data", async () => {
      prisma.user.update.mockResolvedValue({
        id: "user-123",
        name: "Updated Name",
        email: "updated@example.com",
      });

      const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          name: "Updated Name",
          email: "updated@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.user).toMatchObject({
        name: "Updated Name",
        email: "updated@example.com",
      });
    });

    it("should require users:write scope", async () => {
      const readOnlyToken = jwt.sign(
        { sub: "user-123", scopes: ["users:read"] },
        process.env.JWT_SECRET,
      );

      const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${readOnlyToken}`)
        .send({ name: "Test" });

      expect(response.status).toBe(403);
    });

    it("should validate email format when provided", async () => {
      const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ email: "invalid-email" });

      expect(response.status).toBe(400);
    });

    it("should allow updating name only", async () => {
      prisma.user.update.mockResolvedValue({
        id: "user-123",
        name: "Just Name",
        email: "test@example.com",
      });

      const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ name: "Just Name" });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe("Just Name");
    });
  });

  describe("GET /users", () => {
    it("should return users list for admin", async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: "user-1", email: "user1@example.com", role: "user" },
        { id: "user-2", email: "user2@example.com", role: "user" },
      ]);

      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it("should reject non-admin users", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(403);
    });

    it("should require admin scope", async () => {
      const noAdminToken = jwt.sign(
        { sub: "user-123", scopes: ["users:read"] },
        process.env.JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${noAdminToken}`);

      expect(response.status).toBe(403);
    });
  });
});
