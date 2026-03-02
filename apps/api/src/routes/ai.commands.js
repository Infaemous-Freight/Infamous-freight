const express = require("express");
const { body } = require("express-validator");
const { prisma, getPrisma } = require("../db/prisma");
const { cacheMiddleware } = require("../middleware/cache");
const {
  limiters,
  authenticate,
  requireScope,
  requireOrganization,
  auditLog,
} = require("../middleware/security");
const { requireActiveOrgPlan } = require("../middleware/planEnforcement");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { predictProfit } = require("../services/aiProfitService");
const { aiCommandQueue } = require("../queue/aiCommandQueue");

const router = express.Router();

function getOrgAiApprovalMode() {
  return String(process.env.AI_APPROVAL_MODE || "REQUIRE_APPROVAL").toUpperCase();
}

function enforceAiCommandsEnabled(_req, res, next) {
  if (process.env.ENABLE_AI_COMMANDS === "false") {
    return res.status(503).json({ ok: false, error: "AI commands are currently disabled" });
  }
  return next();
}

router.post(
  "/ai/command",
  limiters.ai,
  authenticate,
  requireOrganization,
  requireScope("ai:command"),
  requireActiveOrgPlan("GROWTH"),
  enforceAiCommandsEnabled,
  auditLog,
  validateString("command", { maxLength: 500 }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const client = getPrisma?.() || prisma;
      if (!client) {
        return res.status(503).json({ ok: false, error: "Database not initialized" });
      }

      const { command } = req.body;
      const orgId = req.auth.organizationId;
      const userId = req.auth.userId;
      const approvalMode = getOrgAiApprovalMode();
      const provider = process.env.AI_PROVIDER || "synthetic";

      const created = await client.aiCommand.create({
        data: {
          organizationId: orgId,
          userId,
          command,
          provider,
          approvalMode,
          status: approvalMode === "AUTO_EXECUTE" ? "QUEUED" : "PENDING_APPROVAL",
        },
      });

      if (approvalMode === "SUGGEST_ONLY") {
        await client.aiCommand.update({
          where: { id: created.id },
          data: { status: "CREATED", proposedPlan: { note: "Suggest-only mode (no execution)" } },
        });

        return res.json({
          ok: true,
          id: created.id,
          status: "CREATED",
          approvalMode,
          suggestion: {
            note: "Suggest-only mode. Add your real AI planner/tooling here.",
            command,
          },
        });
      }

      if (approvalMode === "REQUIRE_APPROVAL") {
        return res.json({
          ok: true,
          id: created.id,
          status: "PENDING_APPROVAL",
          approvalMode,
          message: "Command created and awaiting approval",
        });
      }

      await aiCommandQueue.add("execute", { aiCommandId: created.id });

      return res.json({
        ok: true,
        id: created.id,
        status: "QUEUED",
        approvalMode,
        message: "Command queued for execution",
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/ai/commands/:id",
  limiters.ai,
  authenticate,
  requireOrganization,
  requireScope("ai:history"),
  cacheMiddleware(5),
  auditLog,
  async (req, res, next) => {
    try {
      const client = getPrisma?.() || prisma;
      const orgId = req.auth.organizationId;
      const id = String(req.params.id);

      const cmd = await client.aiCommand.findFirst({
        where: { id, organizationId: orgId },
        include: { toolCalls: true },
      });

      if (!cmd) return res.status(404).json({ ok: false, error: "Not found" });
      return res.json({ ok: true, command: cmd });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/ai/commands/:id/approve",
  limiters.ai,
  authenticate,
  requireOrganization,
  requireScope(["ai:command", "admin:ops"]),
  requireActiveOrgPlan("GROWTH"),
  auditLog,
  async (req, res, next) => {
    try {
      const client = getPrisma?.() || prisma;
      const orgId = req.auth.organizationId;
      const id = String(req.params.id);

      const cmd = await client.aiCommand.findFirst({ where: { id, organizationId: orgId } });
      if (!cmd) return res.status(404).json({ ok: false, error: "Not found" });

      if (cmd.status !== "PENDING_APPROVAL") {
        return res.status(409).json({
          ok: false,
          error: "Command not pending approval",
          status: cmd.status,
        });
      }

      await client.aiCommand.update({ where: { id }, data: { status: "QUEUED" } });
      await aiCommandQueue.add("execute", { aiCommandId: id });

      return res.json({ ok: true, id, status: "QUEUED" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/ai/commands/:id/reject",
  limiters.ai,
  authenticate,
  requireOrganization,
  requireScope(["ai:command", "admin:ops"]),
  auditLog,
  [body("reason").optional().isString().isLength({ max: 300 }), handleValidationErrors],
  async (req, res, next) => {
    try {
      const client = getPrisma?.() || prisma;
      const orgId = req.auth.organizationId;
      const id = String(req.params.id);
      const reason = req.body?.reason ? String(req.body.reason) : "rejected";

      const cmd = await client.aiCommand.findFirst({ where: { id, organizationId: orgId } });
      if (!cmd) return res.status(404).json({ ok: false, error: "Not found" });

      await client.aiCommand.update({ where: { id }, data: { status: "REJECTED", error: reason } });

      return res.json({ ok: true, id, status: "REJECTED" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/ai/profit-predict",
  limiters.ai,
  authenticate,
  requireScope("ai:predict"),
  auditLog,
  [
    body("origin").optional().isObject(),
    body("origin.lat").optional().isFloat({ min: -90, max: 90 }),
    body("origin.lng").optional().isFloat({ min: -180, max: 180 }),
    body("destination").optional().isObject(),
    body("destination.lat").optional().isFloat({ min: -90, max: 90 }),
    body("destination.lng").optional().isFloat({ min: -180, max: 180 }),
    body("distanceMiles").optional().isFloat({ min: 1 }),
    body("weight").optional().isFloat({ min: 0 }),
    body("ratePerMile").optional().isFloat({ min: 1.25 }),
    body("fuelPricePerGallon").optional().isFloat({ min: 0 }),
    body("mpg").optional().isFloat({ min: 1 }),
    body("maintenancePerMile").optional().isFloat({ min: 0 }),
    body("insurancePerMile").optional().isFloat({ min: 0 }),
    body("handlingFee").optional().isFloat({ min: 0 }),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const prediction = predictProfit(req.body || {});
      res.json({ ok: true, prediction, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/ai/history",
  limiters.ai,
  authenticate,
  requireScope("ai:history"),
  cacheMiddleware(30),
  auditLog,
  async (req, res, next) => {
    try {
      const { take = 20, skip = 0 } = req.query;
      const limit = Math.min(Number(take) || 20, 100);
      const offset = Number(skip) || 0;
      const client = getPrisma?.() || prisma;

      const history = client?.aiEvent?.findMany
        ? await client.aiEvent.findMany({
            where: { userId: req.user.sub },
            take: limit,
            skip: offset,
            orderBy: { createdAt: "desc" },
          })
        : [];

      res.json({
        ok: true,
        history,
        count: history.length,
        pagination: { take: limit, skip: offset },
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
