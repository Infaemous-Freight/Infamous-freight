const express = require("express");
const { authenticate, auditLog } = require("../../middleware/security");
const featureFlags = require("../../services/featureFlags");

const router = express.Router();

function requireAdmin(req, res, next) {
    if (req.user?.role === 'admin') return next();
    return res.status(403).json({ error: 'Admin access required' });
}

router.get(
    "/admin/flags",
    authenticate,
    requireAdmin,
    auditLog,
    (_req, res) => {
        res.json({ flags: featureFlags.listFlags() });
    },
);

router.post(
    "/admin/flags",
    authenticate,
    requireAdmin,
    auditLog,
    (req, res) => {
        const { name, enabled, percentageRollout = 100, targetUsers = [], targetSegments = [] } = req.body || {};
        if (!name) {
            return res.status(400).json({ error: 'flag name is required' });
        }

        try {
            const flag = featureFlags.upsertFlag(name, {
                enabled: typeof enabled === 'boolean' ? enabled : true,
                percentageRollout,
                targetUsers,
                targetSegments,
                source: 'admin',
            });
            return res.json({ flag });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },
);

module.exports = router;
