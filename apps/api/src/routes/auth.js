/*
 * Authentication Routes: Login, Refresh, Logout & Password Recovery
 * Protected with strict rate limiting
 */

const bcrypt = require("bcryptjs");
const express = require("express");
const { limiters, authenticate, auditLog } = require("../middleware/security");
const {
  validateEmail,
  validateString,
  handleValidationErrors,
} = require("../middleware/validation");
const { hashPassword, decrypt } = require("../services/encryption");
const { sendEmail } = require("../services/emailService");
const { prisma, getPrisma } = require("../db/prisma");
const { env } = require("../config/env");
const { hashRefreshToken, generateRefreshToken, issueAccessToken } = require("../auth/tokenUtils");

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate with email + password; receive access + refresh tokens.
 */
router.post(
  "/login",
  limiters.auth,
  validateEmail("email"),
  validateString("password", { maxLength: 200 }),
  handleValidationErrors,
  auditLog,
  async (req, res, next) => {
    try {
      const db = prisma || getPrisma();
      if (!db) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const { email, password } = req.body;

      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, tenantId: true, email: true, role: true, passwordHash: true },
      });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const jwtSecret = env.jwtSecret || process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ error: "JWT secret not configured" });
      }
      const accessToken = issueAccessToken(user, jwtSecret);

      // Generate opaque refresh token, store its hash
      const rawRefresh = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefresh);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.refreshToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      res.json({ ok: true, accessToken, refreshToken: rawRefresh });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new access token.
 * Body: { refreshToken: string }
 */
router.post(
  "/refresh",
  limiters.auth,
  validateString("refreshToken", { maxLength: 500 }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const db = prisma || getPrisma();
      if (!db) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const tokenHash = hashRefreshToken(req.body.refreshToken);

      const stored = await db.refreshToken.findUnique({
        where: { tokenHash },
        include: {
          user: { select: { id: true, tenantId: true, email: true, role: true } },
        },
      });

      if (!stored || stored.revoked || stored.expiresAt < new Date()) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
      }

      const accessToken = issueAccessToken(stored.user, env.JWT_SECRET);

      res.json({ ok: true, accessToken });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/logout
 * Revoke a refresh token.
 * Body: { refreshToken: string }
 */
router.post(
  "/logout",
  limiters.general,
  validateString("refreshToken", { maxLength: 500 }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const db = prisma || getPrisma();
      if (!db) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const tokenHash = hashRefreshToken(req.body.refreshToken);

      await db.refreshToken.updateMany({
        where: { tokenHash, revoked: false },
        data: { revoked: true },
      });

      res.json({ ok: true, message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/request-password-reset
 * Request a password reset email
 * Rate limited: 3 attempts per 24 hours per email
 */
router.post(
  "/request-password-reset",
  limiters.passwordReset,
  validateEmail("email"),
  handleValidationErrors,
  auditLog,
  async (req, res, next) => {
    try {
      const { email } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Don't reveal if user exists (security best practice)
      if (!user) {
        return res.status(200).json({
          success: true,
          message: "If an account exists with that email, a reset link will be sent.",
        });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = require("crypto").randomBytes(32).toString("hex");
      const resetTokenHash = hashPassword(resetToken);
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: resetTokenHash,
          expiresAt: resetTokenExpiry,
        },
      });

      // Send reset email
      const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}&email=${email}`;
      await sendEmail({
        to: email,
        subject: "Password Reset Request",
        template: "password-reset",
        data: {
          name: user.name || email,
          resetLink,
          expiresIn: "1 hour",
        },
      });

      res.json({
        success: true,
        message: "Password reset link sent to email",
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/reset-password
 * Complete password reset
 * Rate limited: General rate limiter (prevent brute force)
 */
router.post(
  "/reset-password",
  limiters.general,
  validateEmail("email"),
  validateString("token", { maxLength: 100 }),
  validateString("newPassword", { maxLength: 200 }),
  handleValidationErrors,
  auditLog,
  async (req, res, next) => {
    try {
      const { email, token, newPassword } = req.body;

      // Validate password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          error: "Password must be at least 8 characters",
        });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { passwordResets: { take: 1, orderBy: { createdAt: "desc" } } },
      });

      if (!user || !user.passwordResets.length) {
        return res.status(400).json({
          error: "Invalid or expired reset token",
        });
      }

      const reset = user.passwordResets[0];

      // Verify token
      const tokenHash = hashPassword(token);
      if (reset.token !== tokenHash || reset.expiresAt < new Date()) {
        return res.status(400).json({
          error: "Invalid or expired reset token",
        });
      }

      // Update password
      const hashedPassword = hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
        },
      });

      // Invalidate all reset tokens for user
      await prisma.passwordReset.deleteMany({
        where: { userId: user.id },
      });

      // Send confirmation email
      await sendEmail({
        to: email,
        subject: "Password Changed",
        template: "password-changed",
        data: {
          name: user.name || email,
          timestamp: new Date().toLocaleString(),
        },
      });

      res.json({
        success: true,
        message: "Password reset successful. Please log in.",
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/change-password
 * Change password while authenticated
 * Rate limited: 10 attempts per 15 minutes (more lenient for authenticated users)
 */
router.post(
  "/change-password",
  limiters.auth, // Stricter limiter
  authenticate,
  validateString("currentPassword", { maxLength: 200 }),
  validateString("newPassword", { maxLength: 200 }),
  handleValidationErrors,
  auditLog,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.sub;

      // Validate new password
      if (newPassword.length < 8) {
        return res.status(400).json({
          error: "New password must be at least 8 characters",
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          error: "New password must be different from current password",
        });
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      // Verify current password
      const currentPasswordHash = hashPassword(currentPassword);
      if (user.password !== currentPasswordHash) {
        // Log failed attempt
        console.warn("Failed password change attempt", {
          userId,
          ip: req.ip,
        });

        return res.status(401).json({
          error: "Current password is incorrect",
        });
      }

      // Update password
      const newPasswordHash = hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: newPasswordHash,
        },
      });

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/auth/verify-reset-token
 * Verify reset token validity before showing form
 * Rate limited: General limiter
 */
router.get(
  "/verify-reset-token",
  limiters.general,
  validateString("token", { maxLength: 100 }),
  validateEmail("email"),
  handleValidationErrors,
  auditLog,
  async (req, res, next) => {
    try {
      const { email, token } = req.query;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { passwordResets: { take: 1, orderBy: { createdAt: "desc" } } },
      });

      if (!user || !user.passwordResets.length) {
        return res.status(400).json({
          valid: false,
          error: "No reset request found",
        });
      }

      const reset = user.passwordResets[0];
      const tokenHash = hashPassword(token);

      const isValid = reset.token === tokenHash && reset.expiresAt > new Date();

      if (!isValid) {
        return res.status(400).json({
          valid: false,
          error: "Token is invalid or expired",
        });
      }

      res.json({
        valid: true,
        email,
        expiresAt: reset.expiresAt,
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
