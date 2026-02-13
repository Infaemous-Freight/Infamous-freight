/**
 * Users Routes Tests
 * Tests for user management endpoints
 *
 * Routes tested:
 * - GET /api/users/me - Get current user profile
 * - PATCH /api/users/me - Update current user profile
 * - GET /api/users - List all users (admin only)
 */

const request = require("supertest");
const express = require("express");
const { generateTestJWT } = require("../../__tests__/helpers/jwt");

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock("../../db/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock middleware
jest.mock("../../middleware/cache", () => ({
  cacheMiddleware: () => (req, res, next) => next(),
  invalidateCache: jest.fn(),
}));

jest.mock("../../middleware/security", () => ({
  limiters: {
    general: (req, res, next) => next(),
  },
  authenticate: (req, res, next) => {
    const auth = req.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const jwt = require("jsonwebtoken");
      req.user = jwt.decode(auth.replace("Bearer ", ""));
      if (!req.user) throw new Error("Invalid token");
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  },
  requireScope: (scope) => (req, res, next) => {
    if (!req.user || !req.user.scopes || !req.user.scopes.includes(scope)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
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

// Import after mocks
const usersRouter = require("../users");

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", usersRouter);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
}

// Test suite
describe("Users Routes", () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/users/me", () => {
    it("should get current user profile", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["users:read"],
      });

      const mockUser = {
        id: "user_123",
        email: "user@test.com",
        name: "Test User",
        role: "customer",
        createdAt: new Date(),
        shipments: [
          { id: "shipment_1", status: "delivered" },
          { id: "shipment_2", status: "in_transit" },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.user.id).toBe("user_123");
      expect(response.body.user.email).toBe("user@test.com");
      expect(response.body.user.shipments.length).toBe(2);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user_123" },
        include: {
          shipments: {
            select: { id: true, status: true },
            take: 5,
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });

    it("should return 404 when user not found", async () => {
      const authToken = generateTestJWT({
        sub: "nonexistent_user",
        email: "user@test.com",
        scopes: ["users:read"],
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe("User not found");
    });

    it("should reject without authentication", async () => {
      const response = await request(app).get("/api/users/me");

      expect(response.status).toBe(401);
    });

    it("should reject without required scope", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["other:scope"],
      });

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });

    it("should include recent shipments", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["users:read"],
      });

      const mockUser = {
        id: "user_123",
        email: "user@test.com",
        shipments: [
          { id: "ship_1", status: "delivered" },
          { id: "ship_2", status: "in_transit" },
          { id: "ship_3", status: "pending" },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.shipments).toHaveLength(3);
    });
  });

  describe("PATCH /api/users/me", () => {
    it("should update user profile", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["users:write"],
      });

      const updatedUser = {
        id: "user_123",
        email: "newemail@test.com",
        name: "Updated Name",
        role: "customer",
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name",
          email: "newemail@test.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.user.name).toBe("Updated Name");
      expect(response.body.user.email).toBe("newemail@test.com");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user_123" },
        data: { name: "Updated Name", email: "newemail@test.com" },
      });
    });

    it("should update only name", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["users:write"],
      });

      const updatedUser = {
        id: "user_123",
        email: "user@test.com",
        name: "New Name",
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "New Name",
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe("New Name");
    });

    it("should update only email", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["users:write"],
      });

      const updatedUser = {
        id: "user_123",
        email: "newemail@test.com",
        name: "Test User",
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "newemail@test.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe("newemail@test.com");
    });

    it("should reject invalid email format", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["users:write"],
      });

      const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
    });

    it("should reject name that is too long", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["users:write"],
      });

      const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "a".repeat(101), // Exceeds 100 char limit
        });

      expect(response.status).toBe(400);
    });

    it("should reject without authentication", async () => {
      const response = await request(app).patch("/api/users/me").send({
        name: "New Name",
      });

      expect(response.status).toBe(401);
    });

    it("should reject without required scope", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["users:read"],
      });

      const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "New Name",
        });

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/users", () => {
    it("should list all users for admin", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["admin"],
      });

      const mockUsers = [
        {
          id: "user_1",
          email: "user1@test.com",
          role: "customer",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "user_2",
          email: "user2@test.com",
          role: "driver",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(2);

      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.total).toBe(2);
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(mockPrisma.user.count).toHaveBeenCalled();
    });

    it("should support pagination", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["admin"],
      });

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(100);

      const response = await request(app)
        .get("/api/users?take=10&skip=20")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toEqual({ take: 10, skip: 20 });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it("should limit max pagesize to 100", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["admin"],
      });

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(200);

      const response = await request(app)
        .get("/api/users?take=200") // Exceeds limit
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.take).toBe(100); // Capped at 100
    });

    it("should use default pagination values", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["admin"],
      });

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(5);

      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toEqual({ take: 50, skip: 0 });
    });

    it("should reject non-admin users", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["users:read"],
      });

      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });

    it("should reject without authentication", async () => {
      const response = await request(app).get("/api/users");

      expect(response.status).toBe(401);
    });

    it("should order users by creation date descending", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["admin"],
      });

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await request(app).get("/api/users").set("Authorization", `Bearer ${authToken}`);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        }),
      );
    });
  });

  describe("Security & Validation", () => {
    it("should require authentication for all endpoints", async () => {
      const endpoints = [
        { method: "get", path: "/api/users/me" },
        { method: "patch", path: "/api/users/me" },
        { method: "get", path: "/api/users" },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path).send({});

        expect(response.status).toBe(401);
      }
    });

    it("should enforce scope requirements", async () => {
      const testCases = [
        { endpoint: "/api/users/me", method: "get", requiredScope: "users:read" },
        { endpoint: "/api/users/me", method: "patch", requiredScope: "users:write" },
        { endpoint: "/api/users", method: "get", requiredScope: "admin" },
      ];

      for (const testCase of testCases) {
        const authToken = generateTestJWT({
          sub: "user_123",
          email: "user@test.com",
          scopes: ["wrong:scope"],
        });

        const response = await request(app)
          [testCase.method](testCase.endpoint)
          .set("Authorization", `Bearer ${authToken}`)
          .send({});

        expect(response.status).toBe(403);
      }
    });

    it("should handle database errors gracefully", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["users:read"],
      });

      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(500);
    });
  });
});
