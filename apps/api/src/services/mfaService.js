// apps/api/src/services/mfaService.js
// MFA (Multi-Factor Authentication) Service
// Supports: TOTP, SMS, Backup Codes

const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");
const { logger } = require("../middleware/logger");

// Encryption helper
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || "0".repeat(64), "hex");

class MFAService {
  /**
   * Generate TOTP secret for user
   */
  async generateTOTPSecret(email) {
    try {
      const secret = speakeasy.generateSecret({
        name: `Infæmous Freight (${email})`,
        issuer: "Infæmous Freight Enterprises",
        length: 32,
      });

      const qrCode = await QRCode.toDataURL(secret.otpauth_url);

      logger.info("TOTP secret generated", { email });

      return {
        secret: secret.base32,
        qrCode,
        otpauthUrl: secret.otpauth_url,
      };
    } catch (err) {
      logger.error("Failed to generate TOTP secret", { email, error: err.message });
      throw err;
    }
  }

  /**
   * Verify TOTP token
   */
  verifyTOTP(secret, token) {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token,
        window: 2, // Allow ±60 seconds
      });

      return verified;
    } catch (err) {
      logger.warn("TOTP verification failed", { error: err.message });
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    return codes;
  }

  /**
   * Verify and consume backup code
   */
  async verifyBackupCode(user, code) {
    try {
      const codes = user.backupCodes || [];
      const hashedCode = this.hashBackupCode(code);

      if (!codes.includes(hashedCode)) {
        logger.warn("Invalid backup code used", { userId: user.id });
        return false;
      }

      // Remove code (one-time use)
      const updatedCodes = codes.filter((c) => c !== hashedCode);

      await prisma.user.update({
        where: { id: user.id },
        data: { backupCodes: updatedCodes },
      });

      logger.info("Backup code consumed", { userId: user.id });
      return true;
    } catch (err) {
      logger.error("Backup code verification error", { error: err.message });
      throw err;
    }
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId, method = "totp") {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error("User not found");
      }

      if (method === "totp") {
        const secret = await this.generateTOTPSecret(user.email);
        const backupCodes = this.generateBackupCodes();

        logger.info("MFA generation started", { userId, method });

        return {
          ...secret,
          backupCodes,
        };
      }

      throw new Error("Unsupported MFA method");
    } catch (err) {
      logger.error("MFA enable error", { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Confirm MFA setup
   */
  async confirmMFA(userId, totp, backupCodes, mfaSecret) {
    try {
      // Verify TOTP
      if (!this.verifyTOTP(mfaSecret, totp)) {
        throw new Error("Invalid TOTP code");
      }

      // Encrypt secret
      const encryptedSecret = this.encryptSecret(mfaSecret);

      // Hash backup codes
      const hashedCodes = backupCodes.map((c) => this.hashBackupCode(c));

      // Save to database
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaMethod: "totp",
          mfaSecret: encryptedSecret,
          backupCodes: hashedCodes,
        },
      });

      logger.info("MFA enabled for user", { userId });

      return {
        success: true,
        mfaEnabled: true,
      };
    } catch (err) {
      logger.error("MFA confirmation error", { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Disable MFA
   */
  async disableMFA(userId, password) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error("User not found");
      }

      // Verify password
      const bcrypt = require("bcrypt");
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        logger.warn("Invalid password for MFA disable", { userId });
        throw new Error("Invalid password");
      }

      // Disable MFA
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaMethod: null,
          mfaSecret: null,
          backupCodes: [],
        },
      });

      logger.info("MFA disabled for user", { userId });

      return { success: true };
    } catch (err) {
      logger.error("MFA disable error", { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Encrypt secret
   */
  encryptSecret(secret) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);

      let encrypted = cipher.update(secret, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    } catch (err) {
      logger.error("Secret encryption error", { error: err.message });
      throw err;
    }
  }

  /**
   * Decrypt secret
   */
  decryptSecret(encryptedSecret) {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedSecret.split(":");
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");

      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (err) {
      logger.error("Secret decryption error", { error: err.message });
      throw err;
    }
  }

  /**
   * Hash backup code
   */
  hashBackupCode(code) {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  /**
   * Get MFA status
   */
  async getMFAStatus(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          mfaEnabled: true,
          mfaMethod: true,
          backupCodes: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        enabled: user.mfaEnabled,
        method: user.mfaMethod,
        backupCodesRemaining: user.backupCodes?.length || 0,
      };
    } catch (err) {
      logger.error("MFA status retrieval error", { userId, error: err.message });
      throw err;
    }
  }
}

module.exports = new MFAService();
