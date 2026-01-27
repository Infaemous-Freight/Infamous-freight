const express = require("express");
const { z } = require("zod");
const { limiters, auditLog } = require("../middleware/security");
const { getWeather } = require("./openmeteo");
const { summarizeRoute } = require("./routing");

const router = express.Router();

// GET /v1/satellite/weather?lat=..&lon=..
router.get("/weather", limiters.general, auditLog, async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ ok: false, error: "lat and lon required" });
    }

    try {
        const point = await getWeather(lat, lon);
        res.json({ ok: true, point });
    } catch (e) {
        res
            .status(400)
            .json({ ok: false, error: e?.message || "weather fetch failed" });
    }
});

// POST /v1/satellite/route-risk
router.post("/route-risk", limiters.general, auditLog, async (req, res) => {
    const Schema = z.object({
        origin: z.object({ lat: z.number(), lon: z.number() }),
        destination: z.object({ lat: z.number(), lon: z.number() }),
        avgSpeedMph: z.number().optional(),
    });

    let body;
    try {
        body = Schema.parse(req.body);
    } catch (err) {
        return res.status(400).json({ ok: false, error: "invalid route input" });
    }

    try {
        // Fast sampling at endpoints; can expand to midpoints later
        const [w1, w2] = await Promise.all([
            getWeather(body.origin.lat, body.origin.lon),
            getWeather(body.destination.lat, body.destination.lon),
        ]);

        const summary = summarizeRoute(body, [w1, w2]);
        res.json({ ok: true, weather: { origin: w1, destination: w2 }, summary });
    } catch (e) {
        res
            .status(400)
            .json({ ok: false, error: e?.message || "route-risk failed" });
    }
});

module.exports = router;
