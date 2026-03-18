import { Router } from "express";
import { pool } from "../lib/db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { generalLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.use(generalLimiter);

router.post("/generate/:loadId", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { loadId } = req.params;

    const loadResult = await pool.query(
      "SELECT rate FROM loads WHERE id = $1 AND tenant_id = $2",
      [loadId, user.tenantId],
    );

    const load = loadResult.rows[0];
    if (!load) {
      res.status(404).json({ error: "Load not found" });
      return;
    }

    const invoice = await pool.query(
      "INSERT INTO invoices (tenant_id, load_id, amount) VALUES ($1, $2, $3) RETURNING id",
      [user.tenantId, loadId, load.rate],
    );

    res.json({ ok: true, invoiceId: invoice.rows[0].id });
  } catch (err) {
    next(err);
  }
});

export default router;
