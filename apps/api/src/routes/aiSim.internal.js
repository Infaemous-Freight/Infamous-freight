const express = require('express');
const { auditLog } = require('../middleware/security');

const router = express.Router();

/**
 * GET /internal/ai/simulate
 * Internal synthetic AI engine simulator (no auth required for internal testing)
 */
router.get('/ai/simulate', auditLog, async (req, res, next) => {
    try {
        const { prompt } = req.query;

        if (!prompt) {
            return res.status(400).json({
                ok: false,
                error: 'Prompt is required',
            });
        }

        // Synthetic response
        const response = {
            ok: true,
            prompt,
            completion: `Synthetic AI response to: "${prompt}"`,
            model: 'synthetic-v1',
            timestamp: new Date().toISOString(),
        };

        res.json(response);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /internal/ai/batch
 * Internal batch AI processing (no auth for internal services)
 */
router.post('/ai/batch', auditLog, async (req, res, next) => {
    try {
        const { prompts } = req.body;

        if (!Array.isArray(prompts)) {
            return res.status(400).json({
                ok: false,
                error: 'Prompts must be an array',
            });
        }

        // Synthetic batch responses
        const results = prompts.map((prompt, idx) => ({
            index: idx,
            prompt,
            completion: `Synthetic AI response to: "${prompt}"`,
            model: 'synthetic-v1',
        }));

        res.json({
            ok: true,
            results,
            count: results.length,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
