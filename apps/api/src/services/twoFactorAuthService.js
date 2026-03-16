/**
 * Two-Factor Authentication Service (TIER 3)
 * TOTP, backup codes, and recovery mechanisms
 */

const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../db/prisma");
const { logger } = require("../middleware/logger");

class TwoFactorAuthService {
  /**
   * Generate TOTP secret and QR code
   */
  async generateTOTPSecret(userId, email) {
    try {
      const secret = speakeasy.generateSecret({
        name: `Infæmous Freight (${email})`,
        issuer: "Infæmous Freight",
        length: 32,
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url);

      return {
        secret: secret.base32,
        qrCode,
        backupCodes: await this.generateBackupCodes(10),
        manualEntryKey: secret.base32,
      };
    } catch (err) {
      logger.error("Failed to generate TOTP secret", { error: err, userId });
      throw err;
    }
  }

  /**
   * Verify TOTP token
   */
  verify2FA(secret, token) {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token,
        window: 2, // Allow 60 seconds of drift
      });
    } catch (err) {
      logger.error("2FA verification failed", { error: err });
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes(count = 10) {
    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash backup codes for storage
   */
  async hashBackupCodes(codes) {
    const hashed = [];

    for (const code of codes) {
      const hash = await bcrypt.hash(code, 10);
      hashed.push(hash);
    }

    return hashed;
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId, code) {
    try {
      const twoFA = await db.twoFactorAuth.findUnique({
        where: { userId },
      });

      if (!twoFA) return false;

      // Check if code was already used
      if (twoFA.backupCodesUsed.includes(code)) {
        logger.warn("Backup code reuse attempted", { userId });
        return false;
      }

      // Verify against hashed codes
      for (const hashedCode of twoFA.backupCodesHashed) {
        const isValid = await bcrypt.compare(code, hashedCode);
        if (isValid) {
          // Mark code as used
          await db.twoFactorAuth.update({
            where: { userId },
            data: {
              backupCodesUsed: { push: code },
            },
          });

          return true;
        }
      }

      return false;
    } catch (err) {
      logger.error("Backup code verification failed", { error: err, userId });
      return false;
    }
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(userId, totpSecret, backupCodes, verificationToken) {
    try {
      // Verify the TOTP token one more time
      if (!this.verify2FA(totpSecret, verificationToken)) {
        throw new Error("Invalid verification code");
      }

      // Hash backup codes
      const hashedCodes = await this.hashBackupCodes(backupCodes);

      // Create or update 2FA record
      const twoFA = await db.twoFactorAuth.upsert({
        where: { userId },
        update: {
          totpSecret,
          totpEnabled: true,
          backupCodesHashed: hashedCodes,
          backupCodesUsed: [],
          updatedAt: new Date(),
        },
        create: {
          userId,
          totpSecret,
          totpEnabled: true,
          backupCodesHashed: hashedCodes,
          backupCodesUsed: [],
        },
      });

      logger.info("2FA enabled for user", { userId });

      return {
        enabled: true,
        message: "2FA has been successfully enabled",
      };
    } catch (err) {
      logger.error("Failed to enable 2FA", { error: err, userId });
      throw err;
    }
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId, password) {
    try {
      // In production, verify password before allowing disable
      // For now, just remove 2FA
      const twoFA = await db.twoFactorAuth.update({
        where: { userId },
        data: {
          totpEnabled: false,
          totpSecret: null,
          backupCodesHashed: [],
          lastUsedAt: new Date(),
        },
      });

      logger.warn("2FA disabled for user", { userId });

      return {
        disabled: true,
        message: "2FA has been disabled",
      };
    } catch (err) {
      logger.error("Failed to disable 2FA", { error: err, userId });
      throw err;
    }
  }

  /**
   * Get 2FA status
   */
  async get2FAStatus(userId) {
    try {
      const twoFA = await db.twoFactorAuth.findUnique({
        where: { userId },
        select: {
          totpEnabled: true,
          backupCodesUsed: true,
          lastUsedAt: true,
        },
      });

      if (!twoFA) {
        return {
          enabled: false,
          backupCodesRemaining: 0,
        };
      }

      const backupCodesRemaining = 10 - (twoFA.backupCodesUsed?.length || 0);

      return {
        enabled: twoFA.totpEnabled,
        backupCodesRemaining: backupCodesRemaining,
        lastUsedAt: twoFA.lastUsedAt,
        needsRefresh: backupCodesRemaining < 3,
      };
    } catch (err) {
      logger.error("Failed to get 2FA status", { error: err, userId });
      throw err;
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId, verificationToken, totpSecret) {
    try {
      // Verify TOTP before allowing regeneration
      if (!this.verify2FA(totpSecret, verificationToken)) {
        throw new Error("Invalid verification code");
      }

      const newCodes = await this.generateBackupCodes(10);
      const hashedCodes = await this.hashBackupCodes(newCodes);

      await db.twoFactorAuth.update({
        where: { userId },
        data: {
          backupCodesHashed: hashedCodes,
          backupCodesUsed: [],
        },
      });

      logger.info("Backup codes regenerated", { userId });

      return {
        success: true,
        backupCodes: newCodes,
        message: "New backup codes have been generated",
      };
    } catch (err) {
      logger.error("Failed to regenerate backup codes", { error: err, userId });
      throw err;
    }
  }

  /**
   * Verify 2FA during login
   */
  async verifyLoginToken(userId, token, secret) {
    try {
      // Try TOTP first
      if (this.verify2FA(secret, token)) {
        await db.twoFactorAuth.update({
          where: { userId },
          data: { lastUsedAt: new Date() },
        });
        return { success: true, method: "totp" };
      }

      // Try backup code
      const backupValid = await this.verifyBackupCode(userId, token);
      if (backupValid) {
        await db.twoFactorAuth.update({
          where: { userId },
          data: { lastUsedAt: new Date() },
        });
        return { success: true, method: "backup_code" };
      }

      logger.warn("Invalid 2FA token", { userId });
      return { success: false };
    } catch (err) {
      logger.error("2FA login verification failed", { error: err, userId });
      return { success: false };
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId) {
    try {
      const twoFA = await db.twoFactorAuth.findUnique({
        where: { userId },
        select: { totpEnabled: true },
      });

      return twoFA?.totpEnabled || false;
    } catch (err) {
      logger.error("Failed to check 2FA status", { error: err, userId });
      return false;
    }
  }

  /**
   * Require 2FA for sensitive operations
   */
  async requireFor2FASensitiveOperation(userId, operation) {
    const sensitiveOps = [
      "change_email",
      "change_password",
      "disable_2fa",
      "update_billing",
      "export_data",
    ];

    const is2FAEnabled = await this.is2FAEnabled(userId);

    // Enterprise users should have 2FA required
    if (sensitiveOps.includes(operation) && is2FAEnabled) {
      logger.info("2FA required for operation", { userId, operation });
      return true;
    }

    return false;
  }
}

module.exports = new TwoFactorAuthService();
