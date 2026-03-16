/**
 * loads.ts — Load management routes
 *
 * POST /api/loads     — Create a new load
 * GET  /api/loads     — List loads for authenticated tenant
 * GET  /api/loads/:id — Get a single load
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { pool } from "../lib/db.js";
import { ApiResponse, HTTP_STATUS } from "@infamous-freight/shared";

export const loadRoutes = Router();

// ── Schemas ────────────────────────────────────────────────────────────────

const createLoadSchema = z.object({
  brokerId: z.string().uuid("brokerId must be a valid UUID"),
  rate: z.number().positive("rate must be positive"),
  mileage: z.number().positive("mileage must be positive"),
  status: z.enum(["Draft", "Assigned", "InTransit", "Delivered", "Cancelled"]).default("Draft"),
});

// ── Helpers ────────────────────────────────────────────────────────────────

function requireUser(req: Request, res: Response): req is Request & { user: { tenant_id: string } } {
  if (!req.user || !(req.user as Record<string, unknown>).tenant_id) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      new ApiResponse({ success: false, error: "Unauthorized" })
    );
    return false;
  }
  return true;
}

// ── Routes ─────────────────────────────────────────────────────────────────

loadRoutes.get("/", async (req: Request, res: Response, next: NextFunction) => {
  if (!requireUser(req, res)) return;
  try {
    const tenantId = (req.user as Record<string, unknown>).tenant_id as string;
    const { rows } = await pool.query(
      "SELECT * FROM loads WHERE tenant_id = $1 ORDER BY created_at DESC",
      [tenantId]
    );
    res.status(HTTP_STATUS.OK).json(new ApiResponse({ success: true, data: rows }));
  } catch (err) {
    next(err);
  }
});

loadRoutes.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  if (!requireUser(req, res)) return;
  try {
    const tenantId = (req.user as Record<string, unknown>).tenant_id as string;
    const { rows } = await pool.query(
      "SELECT * FROM loads WHERE id = $1 AND tenant_id = $2",
      [req.params.id, tenantId]
    );
    if (rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(new ApiResponse({ success: false, error: "Load not found" }));
      return;
    }
    res.status(HTTP_STATUS.OK).json(new ApiResponse({ success: true, data: rows[0] }));
  } catch (err) {
    next(err);
  }
});

loadRoutes.post("/", async (req: Request, res: Response, next: NextFunction) => {
  if (!requireUser(req, res)) return;
  try {
    const parseResult = createLoadSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        new ApiResponse({ success: false, error: "Validation failed: " + JSON.stringify(parseResult.error.flatten()) })
      );
      return;
    }
    const { brokerId, rate, mileage, status } = parseResult.data;
    const tenantId = (req.user as Record<string, unknown>).tenant_id as string;
    const { rows } = await pool.query(
      "INSERT INTO loads (tenant_id, broker_id, rate, mileage, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [tenantId, brokerId, rate, mileage, status]
    );
    res.status(HTTP_STATUS.CREATED).json(new ApiResponse({ success: true, data: rows[0] }));
  } catch (err) {
    next(err);
  }
});

export default loadRoutes;
