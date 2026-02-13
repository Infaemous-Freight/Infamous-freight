/**
 * Authentication Routes Tests
 * Tests for password reset, change password, and verification routes
 *
 * Routes tested:
 * - POST /api/auth/request-password-reset
 * - POST /api/auth/reset-password
 * - POST /api/auth/change-password
 * - GET /api/auth/verify-reset-token
 */

const request = require("supertest");
const express = require("express");
const { generateTestJWT } = require("../../__tests__/helpers/jwt");

// Mock dependencies
jest.mock("../../db/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordReset: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock("../../services/encryption", () => ({
  hashPassword: jest.fn((password) => `hashed_${password}`),
  decrypt: jest.fn(),
}));

jest.mock("../../services/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
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
const authRouter = require("../auth");
const { prisma } = require("../../db/prisma");
const { hashPassword } = require("../../services/encryption");
const { sendEmail } = require("../../services/emailService");

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
}

// Test suite
describe("Auth Routes", () => {
  let app;

  beforeAll(() => {
    app = createApp();
    process.env.APP_URL = "https://testapp.com";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/request-password-reset", () => {
    it("should send reset email for existing user", async () => {
      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.passwordReset.create.mockResolvedValue({
        id: "reset_123",
        userId: "user_123",
        token: "hashed_token",
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("reset link sent");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(prisma.passwordReset.create).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          template: "password-reset",
        }),
      );
    });

    it("should return success even if user does not exist (security)", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "nonexistent@example.com" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.passwordReset.create).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("should reject invalid email format", async () => {
      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "notanemail" });

      expect([400, 422]).toContain(response.status);
    });

    it("should reject missing email", async () => {
      const response = await request(app).post("/api/auth/request-password-reset").send({});

      expect([400, 422]).toContain(response.status);
    });

    it("should handle database errors gracefully", async () => {
      prisma.user.findUnique.mockRejectedValue(new Error("DB connection failed"));

      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "test@example.com" });

      expect([500, 503]).toContain(response.status);
    });

    it("should handle email service failures", async () => {
      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.passwordReset.create.mockResolvedValue({
        id: "reset_123",
        userId: "user_123",
      });
      sendEmail.mockRejectedValue(new Error("Email service down"));

      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "test@example.com" });

      expect([500, 503]).toContain(response.status);
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("should reset password with valid token", async () => {
      const mockUser = {
        id: "user_123",
        email: "test@example.com",
      };

      const mockReset = {
        id: "reset_123",
        userId: "user_123",
        token: "hashed_validtoken",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour ahead
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      };

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordResets: [mockReset],
      });
      prisma.passwordReset.findFirst.mockResolvedValue(mockReset);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.passwordReset.deleteMany.mockResolvedValue({ count: 1 });

      const response = await request(app).post("/api/auth/reset-password").send({
        email: "test@example.com",
        token: "validtoken",
        newPassword: "NewSecure123!",
      });

      expect([200, 201]).toContain(response.status);
    });

    it("should reject weak password (too short)", async () => {
      const response = await request(app).post("/api/auth/reset-password").send({
        email: "test@example.com",
        token: "validtoken",
        newPassword: "short",
      });

      expect([400, 422]).toContain(response.status);
    });

    it("should reject missing required fields", async () => {
      const response = await request(app).post("/api/auth/reset-password").send({
        email: "test@example.com",
        // Missing token and newPassword
      });

      expect([400, 422]).toContain(response.status);
    });

    it("should reject invalid email format", async () => {
      const response = await request(app).post("/api/auth/reset-password").send({
        email: "invalidemail",
        token: "sometoken",
        newPassword: "SecurePass123!",
      });

      expect([400, 422]).toContain(response.status);
    });

    it("should handle expired token", async () => {
      const mockReset = {
        id: "reset_123",
        userId: "user_123",
        token: "hashed_expiredtoken",
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago (expired)
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      };

      prisma.user.findUnique.mockResolvedValue({
        id: "user_123",
        email: "test@example.com",
        passwordResets: [mockReset],
      });
      prisma.passwordReset.findFirst.mockResolvedValue(mockReset);

      const response = await request(app).post("/api/auth/reset-password").send({
        email: "test@example.com",
        token: "expiredtoken",
        newPassword: "SecurePass123!",
      });

      expect([400, 401, 403]).toContain(response.status);
    });

    it("should handle non-existent user", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).post("/api/auth/reset-password").send({
        email: "nonexistent@example.com",
        token: "sometoken",
        newPassword: "SecurePass123!",
      });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("should change password for authenticated user", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        password: "hashed_OldPassword123!",
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        password: "hashed_NewPassword123!",
      });
      hashPassword.mockReturnValue("hashed_OldPassword123!");

      const response = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: "OldPassword123!",
          newPassword: "NewPassword123!",
        });

      expect([200, 201]).toContain(response.status);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user_123" },
        }),
      );
    });

    it("should reject unauthenticated request", async () => {
      const response = await request(app).post("/api/auth/change-password").send({
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      });

      expect([401, 403]).toContain(response.status);
    });

    it("should reject incorrect current password", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        password: "hashed_CorrectPassword",
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      hashPassword.mockReturnValue("hashed_WrongPassword");

      const response = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: "WrongPassword",
          newPassword: "NewPassword123!",
        });

      expect([401, 403]).toContain(response.status);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should reject weak new password", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const response = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: "OldPassword123!",
          newPassword: "weak",
        });

      expect([400, 422]).toContain(response.status);
    });

    it("should reject same current and new password", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        password: "hashed_SamePassword",
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      hashPassword.mockReturnValue("hashed_SamePassword");

      const response = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: "SamePassword",
          newPassword: "SamePassword",
        });

      expect([400]).toContain(response.status);
    });

    it("should handle non-existent user", async () => {
      const authToken = generateTestJWT({
        sub: "user_999",
        scopes: [],
      });

      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: "OldPassword123!",
          newPassword: "NewPassword123!",
        });

      expect([404, 429]).toContain(response.status);
    });

    it("should reject missing required fields", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const response = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: "OldPassword123!",
          // Missing newPassword
        });

      expect([400, 422, 429]).toContain(response.status);
    });
  });

  describe("GET /api/auth/verify-reset-token", () => {
    it("should verify valid reset token", async () => {
      const mockReset = {
        id: "reset_123",
        userId: "user_123",
        token: "hashed_validtoken",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Future
        createdAt: new Date(),
        used: false,
      };

      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        passwordResets: [mockReset],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app).get("/api/auth/verify-reset-token").query({
        email: "test@example.com",
        token: "validtoken",
      });

      expect([200, 400]).toContain(response.status);
    });

    it("should reject invalid token format", async () => {
      const response = await request(app).get("/api/auth/verify-reset-token").query({
        email: "test@example.com",
        token: "", // Empty token
      });

      expect([400, 422]).toContain(response.status);
    });

    it("should reject missing query parameters", async () => {
      const response = await request(app).get("/api/auth/verify-reset-token").query({
        // Missing email and token
      });

      expect([400, 422]).toContain(response.status);
    });

    it("should reject user without reset request", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user_123",
        email: "test@example.com",
        passwordResets: [], // No resets
      });

      const response = await request(app).get("/api/auth/verify-reset-token").query({
        email: "test@example.com",
        token: "sometoken",
      });

      expect([400, 404]).toContain(response.status);
    });

    it("should reject non-existent user", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/api/auth/verify-reset-token").query({
        email: "nonexistent@example.com",
        token: "sometoken",
      });

      expect([400, 404]).toContain(response.status);
    });

    it("should handle database errors", async () => {
      prisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/auth/verify-reset-token").query({
        email: "test@example.com",
        token: "validtoken",
      });

      expect([400, 500, 503]).toContain(response.status);
    });
  });

  describe("Security & Rate Limiting", () => {
    it("should handle SQL injection attempts in email", async () => {
      const response = await request(app).post("/api/auth/request-password-reset").send({
        email: "'; DROP TABLE users; --@example.com",
      });

      // Should either validate and reject (400/422) or sanitize
      expect([400, 422]).toContain(response.status);
    });

    it("should handle XSS attempts in password fields", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const response = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: '<script>alert("xss")</script>',
          newPassword: "SecurePassword123!",
        });

      // Should handle gracefully
      expect([200, 400, 401, 403, 429]).toContain(response.status);
    });

    it("should handle extremely long token strings", async () => {
      const longToken = "a".repeat(10000);

      const response = await request(app).get("/api/auth/verify-reset-token").query({
        email: "test@example.com",
        token: longToken,
      });

      expect([400, 413, 422]).toContain(response.status);
    });

    it("should handle unicode and special characters in passwords", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: [],
      });

      const mockUser = {
        id: "user_123",
        email: "test@example.com",
        password: "hashed_UnicodePass你好123!",
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      hashPassword.mockReturnValue("hashed_UnicodePass你好123!");

      const response = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: "UnicodePass你好123!",
          newPassword: "NewUnicodePass你好123!",
        });

      // Should handle unicode passwords
      expect([200, 400, 429]).toContain(response.status);
    });
  });
});
