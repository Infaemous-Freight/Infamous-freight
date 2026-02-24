/**
 * Two-Factor Authentication (2FA) Service - Phase 7 Tier 4
 * 
 * Implements TOTP-based 2FA (Time-based One-Time Password)
 * Compatible with Google Authenticator, Authy, Microsoft Authenticator
 * 
 * Security Features:
 * - TOTP with 30-second time step
 * - 6-digit codes
 * - Backup codes for account recovery
 * - Rate limiting on verification attempts
 * - Device trust management
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { prisma } = require('../db/prisma');
const logger = require('../middleware/logger').logger;
const crypto = require('crypto');

class TwoFactorAuthService {
    constructor() {
        this.initialized = false;
        this.verificationAttempts = new Map(); // Track failed attempts
    }

    /**
     * Initialize 2FA service
     */
    async initialize() {
        try {
            logger.info('Two-Factor Authentication Service initialized');
            this.initialized = true;

            // Clean up old verification attempts every 15 minutes
            setInterval(() => {
                this.cleanupVerificationAttempts();
            }, 15 * 60 * 1000);
        } catch (error) {
            logger.error('Failed to initialize 2FA service:', { error: error.message });
            throw error;
        }
    }

    /**
     * Setup 2FA for a user
     * @param {string} userId - User ID
     * @param {string} email - User email (for QR code label)
     */
    async setupTwoFactor(userId, email) {
        try {
            // Generate secret
            const secret = speakeasy.generateSecret({
                name: `Infamous Freight (${email})`,
                issuer: 'Infamous Freight Enterprises',
                length: 32
            });

            // Generate backup codes
            const backupCodes = this.generateBackupCodes(10);
            const hashedBackupCodes = backupCodes.map(code =>
                crypto.createHash('sha256').update(code).digest('hex')
            );

            // Store 2FA config in database
            await prisma.twoFactorAuth.upsert({
                where: { userId },
                create: {
                    userId,
                    secret: secret.base32,
                    backupCodes: hashedBackupCodes,
                    enabled: false, // User must verify before enabling
                    createdAt: new Date()
                },
                update: {
                    secret: secret.base32,
                    backupCodes: hashedBackupCodes,
                    updatedAt: new Date()
                }
            });

            // Generate QR code
            const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

            logger.info('2FA setup initiated', {
                userId,
                hasBackupCodes: backupCodes.length
            });

            return {
                secret: secret.base32,
                qrCode: qrCodeDataUrl,
                backupCodes, // Show these ONCE to the user
                manualEntryKey: secret.base32
            };
        } catch (error) {
            logger.error('Failed to setup 2FA:', {
                error: error.message,
                userId
            });
            throw error;
        }
    }

    /**
     * Verify 2FA token and enable 2FA
     * @param {string} userId - User ID
     * @param {string} token - 6-digit TOTP token
     */
    async verifyAndEnable(userId, token) {
        try {
            // Get user's 2FA config
            const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
                where: { userId }
            });

            if (!twoFactorAuth) {
                throw new Error('2FA not set up for this user');
            }

            // Verify token
            const verified = speakeasy.totp.verify({
                secret: twoFactorAuth.secret,
                encoding: 'base32',
                token,
                window: 2 // Allow 2 time steps (60 seconds) tolerance
            });

            if (!verified) {
                logger.warn('2FA verification failed', { userId });
                return { success: false, message: 'Invalid verification code' };
            }

            // Enable 2FA
            await prisma.twoFactorAuth.update({
                where: { userId },
                data: {
                    enabled: true,
                    verifiedAt: new Date()
                }
            });

            logger.info('2FA enabled successfully', { userId });

            return {
                success: true,
                message: '2FA enabled successfully'
            };
        } catch (error) {
            logger.error('Failed to verify and enable 2FA:', {
                error: error.message,
                userId
            });
            throw error;
        }
    }

    /**
     * Verify 2FA token during login
     * @param {string} userId - User ID
     * @param {string} token - 6-digit TOTP token or backup code
     */
    async verifyToken(userId, token) {
        try {
            // Rate limiting - max 5 attempts per 15 minutes
            const attempts = this.verificationAttempts.get(userId) || 0;
            if (attempts >= 5) {
                logger.warn('2FA rate limit exceeded', { userId });
                return {
                    success: false,
                    message: 'Too many attempts. Please try again later.',
                    rateLimited: true
                };
            }

            // Get user's 2FA config
            const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
                where: { userId }
            });

            if (!twoFactorAuth || !twoFactorAuth.enabled) {
                return {
                    success: false,
                    message: '2FA not enabled for this user'
                };
            }

            // Check if it's a backup code
            if (token.length === 12) {
                return await this.verifyBackupCode(userId, token, twoFactorAuth);
            }

            // Verify TOTP token
            const verified = speakeasy.totp.verify({
                secret: twoFactorAuth.secret,
                encoding: 'base32',
                token,
                window: 2
            });

            if (!verified) {
                // Increment failed attempts
                this.verificationAttempts.set(userId, attempts + 1);

                logger.warn('2FA verification failed', {
                    userId,
                    attempts: attempts + 1
                });

                return {
                    success: false,
                    message: 'Invalid verification code'
                };
            }

            // Clear failed attempts on success
            this.verificationAttempts.delete(userId);

            // Update last used timestamp
            await prisma.twoFactorAuth.update({
                where: { userId },
                data: { lastUsedAt: new Date() }
            });

            logger.info('2FA verification successful', { userId });

            return {
                success: true,
                message: '2FA verification successful'
            };
        } catch (error) {
            logger.error('Failed to verify 2FA token:', {
                error: error.message,
                userId
            });
            throw error;
        }
    }

    /**
     * Verify backup code
     */
    async verifyBackupCode(userId, code, twoFactorAuth) {
        try {
            const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

            // Check if backup code exists
            const backupCodes = twoFactorAuth.backupCodes || [];
            const codeIndex = backupCodes.indexOf(hashedCode);

            if (codeIndex === -1) {
                logger.warn('Invalid backup code used', { userId });
                return {
                    success: false,
                    message: 'Invalid backup code'
                };
            }

            // Remove used backup code
            const remainingCodes = backupCodes.filter((_, index) => index !== codeIndex);

            await prisma.twoFactorAuth.update({
                where: { userId },
                data: {
                    backupCodes: remainingCodes,
                    lastUsedAt: new Date()
                }
            });

            logger.warn('Backup code used', {
                userId,
                remainingCodes: remainingCodes.length
            });

            return {
                success: true,
                message: 'Backup code verified',
                backupCode: true,
                remainingBackupCodes: remainingCodes.length,
                warning: remainingCodes.length <= 2
                    ? 'Only ' + remainingCodes.length + ' backup codes remaining. Generate new ones soon!'
                    : null
            };
        } catch (error) {
            logger.error('Failed to verify backup code:', {
                error: error.message,
                userId
            });
            throw error;
        }
    }

    /**
     * Disable 2FA for a user
     * @param {string} userId - User ID
     * @param {string} token - Verification token to confirm
     */
    async disableTwoFactor(userId, token) {
        try {
            // Verify token before disabling
            const verification = await this.verifyToken(userId, token);

            if (!verification.success) {
                return verification;
            }

            // Disable 2FA
            await prisma.twoFactorAuth.update({
                where: { userId },
                data: {
                    enabled: false,
                    disabledAt: new Date()
                }
            });

            logger.warn('2FA disabled', { userId });

            return {
                success: true,
                message: '2FA disabled successfully'
            };
        } catch (error) {
            logger.error('Failed to disable 2FA:', {
                error: error.message,
                userId
            });
            throw error;
        }
    }

    /**
     * Generate new backup codes
     */
    async regenerateBackupCodes(userId, token) {
        try {
            // Verify token before regenerating
            const verification = await this.verifyToken(userId, token);

            if (!verification.success) {
                return verification;
            }

            // Generate new backup codes
            const backupCodes = this.generateBackupCodes(10);
            const hashedBackupCodes = backupCodes.map(code =>
                crypto.createHash('sha256').update(code).digest('hex')
            );

            await prisma.twoFactorAuth.update({
                where: { userId },
                data: {
                    backupCodes: hashedBackupCodes,
                    updatedAt: new Date()
                }
            });

            logger.info('Backup codes regenerated', { userId });

            return {
                success: true,
                backupCodes // Show these ONCE to the user
            };
        } catch (error) {
            logger.error('Failed to regenerate backup codes:', {
                error: error.message,
                userId
            });
            throw error;
        }
    }

    /**
     * Generate random backup codes
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = crypto.randomBytes(6).toString('hex');
            // Format as XXXX-XXXX-XXXX
            const formatted = code.match(/.{1,4}/g).join('-').toUpperCase();
            codes.push(formatted);
        }
        return codes;
    }

    /**
     * Check if user has 2FA enabled
     */
    async is2FAEnabled(userId) {
        try {
            const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
                where: { userId }
            });

            return twoFactorAuth?.enabled === true;
        } catch (error) {
            logger.error('Failed to check 2FA status:', {
                error: error.message,
                userId
            });
            return false;
        }
    }

    /**
     * Get 2FA status for user
     */
    async getTwoFactorStatus(userId) {
        try {
            const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
                where: { userId }
            });

            if (!twoFactorAuth) {
                return {
                    enabled: false,
                    configured: false
                };
            }

            return {
                enabled: twoFactorAuth.enabled,
                configured: true,
                verifiedAt: twoFactorAuth.verifiedAt,
                lastUsedAt: twoFactorAuth.lastUsedAt,
                backupCodesRemaining: twoFactorAuth.backupCodes?.length || 0
            };
        } catch (error) {
            logger.error('Failed to get 2FA status:', {
                error: error.message,
                userId
            });
            throw error;
        }
    }

    /**
     * Clean up old verification attempts
     */
    cleanupVerificationAttempts() {
        this.verificationAttempts.clear();
        logger.debug('Verification attempts cache cleared');
    }
}

module.exports = new TwoFactorAuthService();
