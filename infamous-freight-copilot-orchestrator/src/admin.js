import express from "express";
import { getAuditEvents, getAuditStats } from "./audit.js";

export function adminRouter() {
  const router = express.Router();

  function requireAdmin(req, res, next) {
    const token = process.env.ADMIN_BEARER_TOKEN || "";
    if (!token) return res.status(500).json({ error: "ADMIN_BEARER_TOKEN not set" });

    const auth = req.get("authorization") || "";
    if (auth !== `Bearer ${token}`) return res.status(401).json({ error: "unauthorized" });

    return next();
  }

  router.get("/admin/health", requireAdmin, (req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  router.get("/admin/stats", requireAdmin, (req, res) => {
    res.json(getAuditStats());
  });

  router.get("/admin/events", requireAdmin, (req, res) => {
    const limit = req.query.limit || 50;
    res.json(getAuditEvents({ limit }));
  });

  router.get("/admin/last-error", requireAdmin, (req, res) => {
    const list = getAuditEvents({ limit: 200 });
    const last = list.find((e) => e.level === "error");
    res.json(last || { ok: true, message: "no errors recorded" });
  });

  return router;
}
