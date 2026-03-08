import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireScope } from "../middleware/requireScope.js";
import { z, ZodError } from "zod";

export const loadsRouter = Router();

loadsRouter.get(
  "/",
  requireScope("load.read"),
  async (req, res, next) => {
    try {
      const organizationId = req.auth!.organizationId;
      const db = prisma as any;

      const loads = await db.load.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        include: {
          driver: true,
          carrier: true,
          routePlan: true,
        },
      });

      return res.json(loads);
    } catch (error) {
      return next(error);
    }
  }
);

const createLoadSchema = z.object({
  referenceNumber: z.string(),
  originLat: z.number(),
  originLng: z.number(),
  destinationLat: z.number(),
  destinationLng: z.number(),
  pickupWindowStart: z.coerce.date(),
  pickupWindowEnd: z.coerce.date(),
  deliveryDeadline: z.coerce.date(),
  weightLbs: z.number(),
  hazmat: z.boolean().optional().default(false),
  trailerType: z.string().optional(),
});

loadsRouter.post(
  "/",
  requireScope("load.create"),
  async (req, res, next) => {
    try {
      const organizationId = req.auth!.organizationId;
      const db = prisma as any;

      const parsedBody = createLoadSchema.parse(req.body);

      const load = await db.load.create({
        data: {
          organizationId,
          referenceNumber: parsedBody.referenceNumber,
          originLat: parsedBody.originLat,
          originLng: parsedBody.originLng,
          destinationLat: parsedBody.destinationLat,
          destinationLng: parsedBody.destinationLng,
          pickupWindowStart: parsedBody.pickupWindowStart,
          pickupWindowEnd: parsedBody.pickupWindowEnd,
          deliveryDeadline: parsedBody.deliveryDeadline,
          weightLbs: parsedBody.weightLbs,
          hazmat: parsedBody.hazmat ?? false,
          trailerType: parsedBody.trailerType,
        },
      });

      return res.status(201).json(load);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Invalid request body",
          errors: error.errors,
        });
      }

      return next(error);
    }
  }
);
