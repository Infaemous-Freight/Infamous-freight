import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router: Router = Router();

const createBrokerSchema = z.object({
  companyName: z.string().min(1),
  mcNumber: z.string().min(1),
  creditScore: z.number().int().min(0).max(100).default(70),
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const brokers = await prisma.broker.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { companyName: "asc" },
    });
    res.json({ ok: true, data: brokers });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user!;
    if (!user.tenantId) {
      res.status(401).json({ error: "Tenant context required" });
      return;
    }
    const { companyName, mcNumber, creditScore } = createBrokerSchema.parse(req.body);
    const broker = await prisma.broker.create({
      data: { tenantId: user.tenantId, companyName, mcNumber, creditScore },
    });
    res.status(201).json({ ok: true, data: broker });
  } catch (err) {
    next(err);
  }
});

export default router;
