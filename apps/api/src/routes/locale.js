/**
 * Phase 7 Tier 5: Localization API Routes
 * 
 * Endpoints:
 * - GET /api/locale - Get current user's locale preferences
 * - POST /api/locale - Update user's locale preference
 * - GET /api/locales - Get all supported locales
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/security");
const { getSupportedLocales } = require("../middleware/i18n");
const { SUPPORTED_LOCALES, DEFAULT_LOCALE } = require("@infamous-freight/shared");
const { HTTP_STATUS } = require("@infamous-freight/shared");
const prisma = require("../utils/prisma");
const logger = require("../middleware/logger");

/**
 * GET /api/locale
 * Get current user's locale preferences
 * Requires authentication
 */
router.get("/", authenticate, async (req, res, next) => {
    try {
        const userId = req.user.sub;

        // Fetch user's saved locale from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                locale: true,
                timezone: true,
                currency: true,
            },
        });

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: req.t("errors.notFound"),
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: req.t("messages.success"),
            data: {
                locale: user.locale || req.locale || DEFAULT_LOCALE,
                timezone: user.timezone,
                currency: user.currency,
            },
        });
    } catch (err) {
        logger.error("Failed to fetch user locale", { error: err.message, userId: req.user?.sub });
        next(err);
    }
});

/**
 * POST /api/locale
 * Update user's locale preference
 * Requires authentication
 * 
 * Body: { locale: 'es', timezone?: 'Europe/Madrid', currency?: 'EUR' }
 */
router.post("/", authenticate, async (req, res, next) => {
    try {
        const userId = req.user.sub;
        const { locale, timezone, currency } = req.body;

        // Validate locale
        if (!locale || !Object.values(SUPPORTED_LOCALES).includes(locale)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: req.t("errors.invalidLocale"),
            });
        }

        // Update user's locale preference in database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                locale,
                timezone: timezone || undefined,
                currency: currency || undefined,
            },
            select: {
                id: true,
                email: true,
                locale: true,
                timezone: true,
                currency: true,
            },
        });

        logger.info("User locale updated", {
            userId,
            locale,
            timezone,
            currency,
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: req.t("messages.localeUpdated"),
            data: {
                locale: updatedUser.locale,
                timezone: updatedUser.timezone,
                currency: updatedUser.currency,
            },
        });
    } catch (err) {
        logger.error("Failed to update user locale", { error: err.message, userId: req.user?.sub });
        next(err);
    }
});

/**
 * GET /api/locales
 * Get all supported locales with metadata
 * Public endpoint (no authentication required)
 */
router.get("/supported", getSupportedLocales);

module.exports = router;
