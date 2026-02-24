/**
 * Two-Factor Authentication (2FA) API Routes - Phase 7 Tier 4
 * 
 * Endpoints for 2FA management:
 * - POST /api/2fa/setup - Initialize 2FA setup
 * - POST /api/2fa/verify-enable - Verify token and enable 2FA
 * - POST /api/2fa/verify - Verify 2FA token during login
 * - POST /api/2fa/disable - Disable 2FA
 * - POST /api/2fa/backup-codes - Regenerate backup codes
 * - GET /api/2fa/status - Get 2FA status
 */

const express = require('express');
const router = express.Router();
const twoFactorService = require('../services/twoFactorAuth');
const { authenticate, auditLog } = require('../middleware/security');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../middleware/logger').logger;
const { ApiResponse, HTTP_STATUS } = require('@infamous-freight/shared');

/**
 * POST /api/2fa/setup
 * Initialize 2FA setup (authenticated users only)
 */
router.post(
    '/setup',
    authenticate,
    auditLog,
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const email = req.user.email;

            const setupData = await twoFactorService.setupTwoFactor(userId, email);

            logger.info('2FA setup initiated', { userId });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: setupData,
                    message: 'Scan the QR code with your authenticator app, then verify the code to enable 2FA',
                    metadata: {
                        warning: 'Save your backup codes in a secure place. You will need them if you lose access to your authenticator app.'
                    }
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/2fa/verify-enable
 * Verify token and enable 2FA
 */
router.post(
    '/verify-enable',
    authenticate,
    auditLog,
    [
        body('token').isString().isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const { token } = req.body;

            const result = await twoFactorService.verifyAndEnable(userId, token);

            if (!result.success) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        error: result.message
                    })
                );
            }

            logger.info('2FA enabled via API', { userId });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: '2FA enabled successfully! You will now be required to enter a code when logging in.'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/2fa/verify
 * Verify 2FA token (used during login flow)
 */
router.post(
    '/verify',
    [
        body('userId').isString().notEmpty().withMessage('User ID is required'),
        body('token').isString().notEmpty().withMessage('Token is required'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const { userId, token } = req.body;

            const result = await twoFactorService.verifyToken(userId, token);

            if (!result.success) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json(
                    new ApiResponse({
                        success: false,
                        error: result.message,
                        metadata: {
                            rateLimited: result.rateLimited || false
                        }
                    })
                );
            }

            logger.info('2FA verification successful', { userId });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: result.message,
                    metadata: {
                        backupCodeUsed: result.backupCode || false,
                        remainingBackupCodes: result.remainingBackupCodes,
                        warning: result.warning
                    }
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/2fa/disable
 * Disable 2FA (requires verification)
 */
router.post(
    '/disable',
    authenticate,
    auditLog,
    [
        body('token').isString().notEmpty().withMessage('Token is required to disable 2FA'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const { token } = req.body;

            const result = await twoFactorService.disableTwoFactor(userId, token);

            if (!result.success) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        error: result.message
                    })
                );
            }

            logger.warn('2FA disabled via API', { userId });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    message: '2FA disabled successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/2fa/backup-codes
 * Regenerate backup codes (requires verification)
 */
router.post(
    '/backup-codes',
    authenticate,
    auditLog,
    [
        body('token').isString().notEmpty().withMessage('Token is required'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const { token } = req.body;

            const result = await twoFactorService.regenerateBackupCodes(userId, token);

            if (!result.success) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json(
                    new ApiResponse({
                        success: false,
                        error: result.message
                    })
                );
            }

            logger.info('Backup codes regenerated', { userId });

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: {
                        backupCodes: result.backupCodes
                    },
                    message: 'New backup codes generated. Save them in a secure place!',
                    metadata: {
                        warning: 'These codes will only be shown once. Store them securely.'
                    }
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/2fa/status
 * Get 2FA status for authenticated user
 */
router.get(
    '/status',
    authenticate,
    auditLog,
    async (req, res, next) => {
        try {
            const userId = req.user.sub;
            const status = await twoFactorService.getTwoFactorStatus(userId);

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: status,
                    message: '2FA status retrieved successfully'
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/2fa/check
 * Check if 2FA is enabled for a user (public endpoint for login flow)
 */
router.post(
    '/check',
    [
        body('userId').isString().notEmpty().withMessage('User ID is required'),
        handleValidationErrors
    ],
    async (req, res, next) => {
        try {
            const { userId } = req.body;
            const enabled = await twoFactorService.is2FAEnabled(userId);

            res.status(HTTP_STATUS.OK).json(
                new ApiResponse({
                    success: true,
                    data: {
                        enabled,
                        requires2FA: enabled
                    }
                })
            );
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
