/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Agent Job Processors
 * Handles long-running AI tasks: dispatch optimization, invoice reconciliation, ETA prediction
 */

const { Queue, Worker } = require("bullmq");
const { prisma } = require("../lib/prismaClient");
const { redisConnection } = require("./redis");
const { logger } = require("../middleware/logger");

// ==================== AGENT QUEUES ====================

const dispatchQueue = new Queue("dispatch", { connection: redisConnection });
const invoiceAuditQueue = new Queue("invoice-audit", { connection: redisConnection });
const etaPredictionQueue = new Queue("eta-prediction", { connection: redisConnection });
const analyticsQueue = new Queue("analytics", { connection: redisConnection });

// ==================== DISPATCH AGENT ====================

const dispatchWorker = new Worker(
    "dispatch",
    async (job) => {
        try {
            const { shipmentIds, driverIds, algorithm, userId } = job.data;

            logger.info({ jobId: job.id, shipmentCount: shipmentIds.length, algorithm }, '[dispatch] Processing shipments');

            // Log agent run start
            const agentRun = await prisma.agentRun.create({
                data: {
                    agentName: "dispatch-optimizer",
                    eventType: "dispatch.optimize",
                    status: "RUNNING",
                    input: job.data,
                    userId
                }
            });

            let suggestions = [];

            if (algorithm === "NEAREST") {
                // Simple nearest-neighbor optimization
                suggestions = await optimizeNearest(shipmentIds, driverIds);
            } else if (algorithm === "LOAD_BALANCE") {
                // Balance load across drivers
                suggestions = await optimizeLoadBalance(shipmentIds, driverIds);
            } else if (algorithm === "TIME_WINDOW") {
                // Respect delivery time windows
                suggestions = await optimizeTimeWindow(shipmentIds, driverIds);
            }

            // Store suggestions in DB
            for (const suggestion of suggestions) {
                await prisma.dispatchSuggestion.create({
                    data: suggestion
                });
            }

            // Mark agent run as complete
            await prisma.agentRun.update({
                where: { id: agentRun.id },
                data: {
                    status: "SUCCESS",
                    output: { suggestionsGenerated: suggestions.length },
                    finishedAt: new Date()
                }
            });

            return {
                ok: true,
                suggestionsGenerated: suggestions.length,
                algorithm
            };
        } catch (error) {
            logger.error({ jobId: job.id, error: error.message }, '[dispatch] Job processing error');
            throw error;
        }
    },
    { connection: redisConnection, concurrency: 2 }
);

async function optimizeNearest(shipmentIds, driverIds) {
    // Placeholder: real implementation would use geolocation
    const suggestions = [];

    for (const shipmentId of shipmentIds) {
        const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
        if (!shipment) continue;

        // Assign first available driver (placeholder)
        const driverId = driverIds[Math.floor(Math.random() * driverIds.length)];

        suggestions.push({
            shipmentId,
            driverId,
            reason: "nearest-available",
            score: Math.random() * 100,
            generatedAt: new Date()
        });
    }

    return suggestions;
}

async function optimizeLoadBalance(shipmentIds, driverIds) {
    const suggestions = [];
    const driverLoads = {};

    // Count existing assignments per driver
    for (const driverId of driverIds) {
        const count = await prisma.assignment.count({
            where: {
                driverId,
                status: { in: ["ASSIGNED", "IN_TRANSIT"] }
            }
        });
        driverLoads[driverId] = count;
    }

    // Assign to least-loaded drivers
    for (const shipmentId of shipmentIds) {
        const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
        if (!shipment) continue;

        const leastLoadedDriver = Object.entries(driverLoads).sort(([, a], [, b]) => a - b)[0];
        if (!leastLoadedDriver) continue;

        const driverId = leastLoadedDriver[0];
        driverLoads[driverId]++;

        suggestions.push({
            shipmentId,
            driverId,
            reason: "load-balance",
            score: Math.random() * 100,
            generatedAt: new Date()
        });
    }

    return suggestions;
}

async function optimizeTimeWindow(shipmentIds, driverIds) {
    // Placeholder: respect delivery time windows
    return optimizeLoadBalance(shipmentIds, driverIds);
}

// ==================== INVOICE AUDIT AGENT ====================

const invoiceAuditWorker = new Worker(
    "invoice-audit",
    async (job) => {
        try {
            const { shipmentId, invoiceId, userId } = job.data;

            logger.info({ jobId: job.id, shipmentId }, '[invoice-audit] Processing shipment');

            const agentRun = await prisma.agentRun.create({
                data: {
                    agentName: "invoice-audit",
                    eventType: "invoice.audit",
                    status: "RUNNING",
                    input: job.data,
                    userId
                }
            });

            // Fetch shipment & invoice data
            const shipment = await prisma.shipment.findUnique({
                where: { id: shipmentId }
            });

            // Simulate reconciliation (real: fetch invoice from PayPal/Stripe)
            const reconciliationResult = {
                ok: true,
                shipmentValue: shipment?.estimatedValue || 0,
                invoiceAmount: 0, // Would fetch real invoice amount
                matches: true,
                discrepancies: []
            };

            await prisma.agentRun.update({
                where: { id: agentRun.id },
                data: {
                    status: reconciliationResult.ok ? "SUCCESS" : "FAILED",
                    output: reconciliationResult,
                    finishedAt: new Date()
                }
            });

            return reconciliationResult;
        } catch (error) {
            logger.error({ jobId: job.id, error: error.message }, '[invoice-audit] Job processing error');
            throw error;
        }
    },
    { connection: redisConnection, concurrency: 3 }
);

// ==================== ETA PREDICTION AGENT ====================

const etaPredictionWorker = new Worker(
    "eta-prediction",
    async (job) => {
        try {
            const { assignmentId, userId } = job.data;

            logger.info({ jobId: job.id, assignmentId }, '[eta-prediction] Predicting ETA for assignment');

            const agentRun = await prisma.agentRun.create({
                data: {
                    agentName: "eta-predictor",
                    eventType: "assignment.predict_eta",
                    status: "RUNNING",
                    input: job.data,
                    userId
                }
            });

            // Fetch assignment details
            const assignment = await prisma.assignment.findUnique({
                where: { id: assignmentId },
                include: { shipment: true, driver: true }
            });

            if (!assignment) {
                throw new Error("Assignment not found");
            }

            // Simple ETA calculation (real: use ML model + traffic data)
            const distanceKm = 50; // Placeholder
            const speedKmh = 80;
            const etaMinutes = Math.round((distanceKm / speedKmh) * 60);
            const predictedArrival = new Date(Date.now() + etaMinutes * 60 * 1000);

            // Update assignment with ETA
            await prisma.assignment.update({
                where: { id: assignmentId },
                data: {
                    predictedArrival,
                    etaMinutes
                }
            });

            await prisma.agentRun.update({
                where: { id: agentRun.id },
                data: {
                    status: "SUCCESS",
                    output: { predictedArrival, etaMinutes },
                    finishedAt: new Date()
                }
            });

            return { ok: true, predictedArrival, etaMinutes };
        } catch (error) {
            logger.error({ jobId: job.id, error: error.message }, '[eta-prediction] Job processing error');
            throw error;
        }
    },
    { connection: redisConnection, concurrency: 5 }
);

// ==================== ANALYTICS AGENT ====================

const analyticsWorker = new Worker(
    "analytics",
    async (job) => {
        try {
            const { eventType, period = "daily", userId } = job.data;

            logger.info({ jobId: job.id, eventType, period }, '[analytics] Computing metrics');

            const agentRun = await prisma.agentRun.create({
                data: {
                    agentName: "analytics",
                    eventType: `analytics.${eventType}`,
                    status: "RUNNING",
                    input: job.data,
                    userId
                }
            });

            const metrics = await computeAnalytics(eventType, period);

            await prisma.agentRun.update({
                where: { id: agentRun.id },
                data: {
                    status: "SUCCESS",
                    output: metrics,
                    finishedAt: new Date()
                }
            });

            return { ok: true, metrics };
        } catch (error) {
            logger.error({ jobId: job.id, error: error.message }, '[analytics] Job processing error');
            throw error;
        }
    },
    { connection: redisConnection, concurrency: 2 }
);

async function computeAnalytics(eventType, period) {
    // Placeholder: compute various metrics
    if (eventType === "shipment-count") {
        const count = await prisma.shipment.count();
        return { totalShipments: count };
    }

    if (eventType === "driver-efficiency") {
        const drivers = await prisma.driver.findMany({
            include: { assignments: true }
        });

        return {
            driverCount: drivers.length,
            averageAssignmentsPerDriver: drivers.reduce((sum, d) => sum + d.assignments.length, 0) / drivers.length
        };
    }

    return {};
}

// ==================== EVENT LISTENERS ====================

dispatchWorker.on("failed", (job, err) => {
    logger.error({ jobId: job.id, error: err.message }, '[dispatch] Job failed');
});

invoiceAuditWorker.on("failed", (job, err) => {
    logger.error({ jobId: job.id, error: err.message }, '[invoice-audit] Job failed');
});

etaPredictionWorker.on("failed", (job, err) => {
    logger.error({ jobId: job.id, error: err.message }, '[eta-prediction] Job failed');
});

analyticsWorker.on("failed", (job, err) => {
    logger.error({ jobId: job.id, error: err.message }, '[analytics] Job failed');
});

// ==================== EXPORTS ====================

module.exports = {
    dispatchQueue,
    invoiceAuditQueue,
    etaPredictionQueue,
    analyticsQueue,
    dispatchWorker,
    invoiceAuditWorker,
    etaPredictionWorker,
    analyticsWorker
};
