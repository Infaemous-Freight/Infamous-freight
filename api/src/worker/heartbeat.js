/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Worker Heartbeat Monitoring (Phase 18)
 * 
 * Periodically writes a heartbeat to Redis to prove worker liveness.
 * Ops monitoring can check /api/status endpoint to see last heartbeat timestamp.
 */

const logger = require("../middleware/logger").logger;

let heartbeatInterval = null;

/**
 * Start heartbeat monitoring for a named worker/service
 * @param {string} name - Service name (e.g., "worker", "api", "cron")
 * @param {number} intervalMs - Heartbeat interval in milliseconds (default: 10s)
 */
async function startHeartbeat(name = "worker", intervalMs = 10_000) {
    try {
        const { redis } = require("../lib/redisCache");
        if (!redis) {
            logger.warn(`[Heartbeat] Redis not available, heartbeat disabled for ${name}`);
            return;
        }

        const key = `heartbeat:${name}`;

        // Initial heartbeat
        await redis.set(key, new Date().toISOString(), "EX", 30);
        logger.info(`[Heartbeat] Started for ${name} (interval: ${intervalMs}ms)`);

        // Periodic heartbeat
        heartbeatInterval = setInterval(async () => {
            try {
                await redis.set(key, new Date().toISOString(), "EX", 30);
                logger.debug(`[Heartbeat] Updated for ${name}`);
            } catch (error) {
                logger.warn(`[Heartbeat] Failed to update for ${name}`, {
                    error: error.message,
                });
            }
        }, intervalMs);

        // Handle process termination gracefully
        process.on("SIGTERM", () => {
            clearInterval(heartbeatInterval);
            logger.info(`[Heartbeat] Stopped for ${name}`);
        });
    } catch (error) {
        logger.error(`[Heartbeat] Failed to initialize for ${name}`, {
            error: error.message,
        });
    }
}

/**
 * Stop heartbeat monitoring
 */
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

module.exports = {
    startHeartbeat,
    stopHeartbeat,
};
