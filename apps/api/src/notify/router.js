const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { notifier } = require("./index");
const { authenticate, limiters } = require("../middleware/security");
const {
    validateString,
    validatePhone,
    handleValidationErrors,
} = require("../middleware/validation");
const { logger } = require("../middleware/logger");
const { recordTwilioStatus } = require("../services/notificationTelemetry");

const prisma = new PrismaClient();
const notifyRouter = express.Router();

// Twilio status callbacks (no auth, webhook limiter)
notifyRouter.post(
    "/twilio/status",
    limiters.webhook,
    async (req, res) => {
        const payload = {
            messageSid: req.body.MessageSid || req.body.messageSid,
            to: req.body.To || req.body.to,
            from: req.body.From || req.body.from,
            status: req.body.MessageStatus || req.body.status,
            errorCode: req.body.ErrorCode || req.body.errorCode || null,
        };

        recordTwilioStatus(payload);
        logger.info("Twilio status callback received", payload);
        res.json({ ok: true });
    },
);

// All notification routes require authentication
notifyRouter.use(authenticate);

// Save Expo push token for the authenticated user
notifyRouter.post(
    "/push-token",
    limiters.general,
    [validateString("expoPushToken", { maxLength: 512 }), handleValidationErrors],
    async (req, res, next) => {
        try {
            const userId = req.user?.sub;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const { expoPushToken } = req.body;

            const user = await prisma.user.update({
                where: { id: userId },
                data: { expoPushToken },
            });

            logger.info("Expo push token registered", { userId });
            res.json({ ok: true, expoPushToken: user.expoPushToken });
        } catch (err) {
            next(err);
        }
    },
);

// Save phone number for the authenticated user
notifyRouter.post(
    "/phone",
    limiters.general,
    [validatePhone("phone"), handleValidationErrors],
    async (req, res, next) => {
        try {
            const userId = req.user?.sub;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const { phone } = req.body;

            const user = await prisma.user.update({
                where: { id: userId },
                data: { phone },
            });

            logger.info("Phone registered for notifications", { userId });
            res.json({ ok: true, phone: user.phone });
        } catch (err) {
            next(err);
        }
    },
);

// Send a quick test notification using stored or provided channels
notifyRouter.post(
    "/test",
    limiters.smsUser,
    limiters.smsOrg,
    limiters.general,
    async (req, res, next) => {
        try {
            const userId = req.body.userId || req.user?.sub;
            const title = req.body.title || "Test notification";
            const body = req.body.body || "Hello from Infamous Freight";
            const data = req.body.data || { kind: "test", at: new Date().toISOString() };

            const n = notifier();

            let user = null;
            if (userId) {
                user = await prisma.user.findUnique({ where: { id: userId } });
            }

            const expoPushToken = req.body.expoPushToken || user?.expoPushToken || null;
            const phone = req.body.phone || user?.phone || null;

            const results = {};

            results.expo = await n.pushExpo(expoPushToken, { title, body, data });
            results.sms = await n.sms(phone, body);

            res.json({
                ok: true,
                userId: userId || null,
                expoPushToken,
                phone,
                results,
            });
        } catch (err) {
            next(err);
        }
    },
);

module.exports = { notifyRouter };
