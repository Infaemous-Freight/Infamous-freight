const express = require("express");
const {
  limiters,
  authenticate,
  requireOrganization,
  auditLog,
} = require("../../middleware/security");
const { getPrisma, prisma } = require("../../db/prisma");
const { Parser } = require("json2csv");

const router = express.Router();

router.get(
  "/admin/audit-logs",
  limiters.general,
  authenticate,
  requireOrganization,
  auditLog,
  async (req, res, next) => {
    try {
      const client = getPrisma?.() || prisma;
      if (!client) {
        const error = new Error("Audit log unavailable (database not initialized)");
        error.status = 503;
        throw error;
      }

      const role = String(req.auth?.role || req.user?.role || "").toUpperCase();
      const isAdmin = role === "ADMIN";

      const q = String(req.query.q || "").trim();
      const action = String(req.query.action || "").trim();
      const entity = String(req.query.entity || "").trim();
      const limit = Math.min(Number(req.query.limit || 200), 500);
      const offset = Math.max(Number(req.query.offset || 0), 0);

      const where = {
        organizationId: req.auth.organizationId,
      };

      // NOTE: Non-admin users are intentionally limited to audit events
      // where they are the actor, even though they share an organizationId.
      // This is stricter than some Supabase policies (which allow visibility
      // based on related_ids such as shipper_id/carrier_id) and is chosen to
      // keep non-admin visibility scoped to "my own actions" only.
      if (!isAdmin && req.auth?.userId) {
        where.actorUserId = req.auth.userId;
      }

      // Build OR conditions only when a search query is present.
      const orConditions = [];

      if (!q) {
        // No search term: apply exact filters directly (AND semantics).
        if (action) {
          where.action = action;
        }
        if (entity) {
          where.entity = entity;
        }
      } else {
        // Search term present: include exact filters as part of the OR search.
        if (action) {
          orConditions.push({ action });
        }
        if (entity) {
          orConditions.push({ entity });
        }

        orConditions.push(
          { action: { contains: q, mode: "insensitive" } },
          { entity: { contains: q, mode: "insensitive" } },
          { entityId: { contains: q, mode: "insensitive" } },
        );

        if (orConditions.length > 0) {
          where.OR = orConditions;
        }
      }

      const [logs, total] = await Promise.all([
        client.orgAuditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        client.orgAuditLog.count({ where }),
      ]);

      return res.json({
        ok: true,
        logs,
        total,
        limit,
        offset,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/admin/audit-logs/export",
  limiters.export,
  authenticate,
  requireOrganization,
  auditLog,
  async (req, res, next) => {
    try {
      const client = getPrisma?.() || prisma;
      if (!client) {
        const error = new Error("Audit log unavailable (database not initialized)");
        error.status = 503;
        throw error;
      }

      const role = String(req.auth?.role || req.user?.role || "").toUpperCase();
      const isAdmin = role === "ADMIN";

      const format = String(req.query.format || "csv").toLowerCase();
      const rawLimit = Number(req.query.limit);
      const limit = Number.isFinite(rawLimit) ? Math.min(rawLimit, 20000) : 5000;

      const where = { organizationId: req.auth.organizationId };
      if (!isAdmin && req.auth?.userId) where.actorUserId = req.auth.userId;

      const logs = await client.orgAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", 'attachment; filename="audit-logs.json"');
        return res.status(200).send(JSON.stringify({ ok: true, logs }, null, 2));
      }

      const parser = new Parser({
        fields: ["id", "organizationId", "actorUserId", "action", "entity", "entityId", "createdAt"],
      });

      const csv = parser.parse(
        logs.map((log) => ({
          ...log,
          createdAt: log.createdAt?.toISOString?.() || log.createdAt,
        })),
      );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="audit-logs.csv"');
      return res.status(200).send(csv);
    } catch (error) {
      return next(error);
    }
  },
);

module.exports = router;
