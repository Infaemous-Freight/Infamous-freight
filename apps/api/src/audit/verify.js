/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Audit Chain Verification (Phase 18)
 * 
 * Verifies integrity of tamper-evident audit logs by:
 * - Validating previous hash linkage
 * - Recomputing expected hash
 * - Detecting and reporting mismatches
 */

const crypto = require("crypto");
const logger = require("../middleware/logger").logger;
const { captureException } = require("../observability/sentry");

/**
 * Compute hash of an event with previous hash (from auditChain.js logic)
 * @param {string} prevHash - Previous event's hash
 * @param {object} event - Event object
 * @param {string} salt - Audit log salt
 * @returns {string} SHA256 hash
 */
function computeHash(prevHash, event, salt) {
    const payload = JSON.stringify({
        prev: prevHash || "genesis",
        ...event,
    });

    return crypto
        .createHash("sha256")
        .update(payload + salt)
        .digest("hex");
}

/**
 * Result of audit chain verification
 * @typedef {object} VerifyResult
 * @property {boolean} ok - Chain is intact
 * @property {number} checked - Number of events checked
 * @property {object} [firstError] - First mismatch found
 * @property {number} firstError.index - Event index (0-based)
 * @property {string} firstError.eventId - Event ID
 * @property {string} firstError.reason - Mismatch reason
 * @property {string} [tampering] - Indication of tampering type
 */

/**
 * Verify integrity of event chain (e.g., shipment events)
 * @param {array} events - Array of events in order
 * @param {string} salt - Audit log salt from env
 * @returns {VerifyResult}
 */
function verifyChain(events, salt = process.env.AUDIT_LOG_SALT || "") {
    const result = {
        ok: true,
        checked: 0,
        firstError: null,
        tampering: null,
    };

    if (!events || events.length === 0) {
        return result; // Empty chain is valid
    }

    let prevHash = null;

    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        result.checked++;

        // Verify previous hash linkage
        if (i > 0) {
            if (event.prevHash !== prevHash) {
                result.ok = false;
                result.tampering = "BROKEN_CHAIN";
                result.firstError = {
                    index: i,
                    eventId: event.id || `event-${i}`,
                    reason: `Previous hash mismatch: expected ${prevHash}, got ${event.prevHash}`,
                    stored: event.prevHash,
                    expected: prevHash,
                };
                break;
            }
        }

        // Recompute expected hash (without prevHash for comparison)
        const recomputed = computeHash(
            prevHash,
            {
                id: event.id,
                type: event.type,
                timestamp: event.timestamp,
                user: event.user,
                action: event.action,
                data: event.data,
            },
            salt
        );

        // Verify hash matches
        if (event.hash !== recomputed) {
            result.ok = false;
            result.tampering = "DATA_MODIFIED";
            result.firstError = {
                index: i,
                eventId: event.id || `event-${i}`,
                reason: `Hash mismatch: expected ${recomputed}, got ${event.hash}`,
                stored: event.hash,
                expected: recomputed,
            };
            break;
        }

        prevHash = event.hash;
    }

    return result;
}

/**
 * Verify job event chain integrity (common use case)
 * @param {string} jobId - Job ID to verify
 * @param {object} prisma - Prisma client
 * @returns {Promise<VerifyResult>}
 */
async function verifyJobAuditChain(jobId, prisma) {
    const result = {
        ok: true,
        checked: 0,
        firstError: null,
        jobId,
    };

    try {
        // Fetch all job events in order
        const events = await prisma.jobEvent.findMany({
            where: { jobId },
            orderBy: { createdAt: "asc" },
        });

        if (events.length === 0) {
            return result; // No events to verify
        }

        // Verify chain integrity
        const verification = verifyChain(events);

        return {
            ...result,
            ...verification,
            jobId,
        };
    } catch (error) {
        logger.error(`[AuditVerify] Failed to verify job ${jobId}`, {
            error: error.message,
        });

        captureException(error, {
            extra: { jobId },
            tags: { module: "audit-verify" },
        });

        return {
            ...result,
            ok: false,
            error: error.message,
        };
    }
}

/**
 * Bulk verify multiple job audit chains
 * @param {string[]} jobIds - Job IDs to verify
 * @param {object} prisma - Prisma client
 * @param {number} batchSize - Process in batches (default: 10)
 * @returns {Promise<object>} Results summary
 */
async function verifyBulkJobChains(jobIds, prisma, batchSize = 10) {
    const results = {
        total: jobIds.length,
        verified: 0,
        failed: 0,
        compromised: 0,
        errors: [],
        tamperedJobs: [],
    };

    // Process in batches to avoid memory overload
    for (let i = 0; i < jobIds.length; i += batchSize) {
        const batch = jobIds.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
            batch.map((jobId) => verifyJobAuditChain(jobId, prisma))
        );

        batchResults.forEach((res, idx) => {
            const jobId = batch[idx];

            if (res.status === "fulfilled") {
                results.verified++;

                if (!res.value.ok) {
                    results.compromised++;
                    results.tamperedJobs.push({
                        jobId,
                        tampering: res.value.tampering,
                        firstError: res.value.firstError,
                    });
                }
            } else {
                results.failed++;
                results.errors.push({
                    jobId,
                    error: res.reason.message,
                });
            }
        });
    }

    return results;
}

module.exports = {
    computeHash,
    verifyChain,
    verifyJobAuditChain,
    verifyBulkJobChains,
};
