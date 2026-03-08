import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

export class LoadsController {
  async list(req: Request, res: Response) {
    const loads = await prisma.load.findMany({ where: { organizationId: req.auth!.organizationId } });
    res.json(loads);
  }

  async create(req: Request, res: Response) {
    const { id, organizationId, createdAt, updatedAt, ...allowedData } = req.body ?? {};

    const created = await prisma.load.create({
      data: {
        ...allowedData,
        organizationId: req.auth!.organizationId
      }
    });
    res.status(201).json(created);
  }
}
