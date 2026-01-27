const express = require("express");
const { limiters, authenticate, requireScope } = require("../middleware/security");
const { resolveGenesisProfile } = require("./core");
const { addMessage, getHistory } = require("./memory");
const { getUserId } = require("../auth/user");
const { genesisReply } = require("./llm");

const router = express.Router();

// GET /v1/genesis/profile - returns current Genesis profile with selected avatar
router.get(
    "/profile",
    limiters.general,
    authenticate,
    requireScope("user:avatar"),
    (req, res) => {
        try {
            const userId = getUserId(req);
            const profile = resolveGenesisProfile(userId);
            res.json({ ok: true, profile, timestamp: new Date().toISOString() });
        } catch (err) {
            res
                .status(500)
                .json({ ok: false, error: err?.message || "profile resolution failed" });
        }
    },
);

// POST /v1/genesis/chat - deterministic, in-memory chat stub
router.post(
    "/chat",
    limiters.ai || limiters.general,
    authenticate,
    requireScope("user:avatar"),
    async (req, res) => {
        try {
            const userId = getUserId(req);
            const message = typeof req.body?.message === "string" ? req.body.message : "";
            const trimmed = message.trim();

            if (!trimmed) {
                return res.status(400).json({ ok: false, error: "message is required" });
            }

            const bounded = trimmed.slice(0, 4000);
            addMessage(userId, "user", bounded);

            const out = await genesisReply(userId, bounded);
            addMessage(userId, "assistant", out.text);

            res.json({
                ok: true,
                reply: out.text,
                provider: out.provider,
                model: out.model,
                history: getHistory(userId, 12),
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            res.status(500).json({ ok: false, error: err?.message || "chat failed" });
        }
    },
);

module.exports = router;
module.exports.genesisRouter = router;
