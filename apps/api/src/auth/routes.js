const express = require("express");
const { z } = require("zod");
const { signUserToken } = require("./jwt");
const { getUserId } = require("./user");
const { env } = require("../config/env");

const router = express.Router();

// POST /v1/auth/dev-token -> issue a JWT for a given userId (dev helper)
router.post("/dev-token", express.json(), (req, res) => {
    try {
        const Schema = z.object({ userId: z.string().min(1).max(120) });
        const body = Schema.parse(req.body);

        if (env.nodeEnv === "production") {
            return res.status(403).json({ ok: false, error: "dev-token disabled" });
        }

        const token = signUserToken(body.userId);
        res.json({ ok: true, token });
    } catch (err) {
        res.status(400).json({ ok: false, error: err?.message || "invalid request" });
    }
});

// GET /v1/auth/me -> return current user id
router.get("/me", (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ ok: false, error: "unauthorized" });
    res.json({ ok: true, userId, nodeEnv: env.nodeEnv });
});

module.exports = router;
module.exports.authRouter = router;
