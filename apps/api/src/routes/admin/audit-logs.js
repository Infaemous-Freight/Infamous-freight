const express = require("express");
const {
  limiters,
  authenticate,
  requireOrganization,
  auditLog,
} = require("../../middleware/security");
const { getPrisma, prisma } = require("../../db/prisma");

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
        const error = new Error(
          "Audit log unavailable (database not initialized)",
        );
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

module.exports = router;
