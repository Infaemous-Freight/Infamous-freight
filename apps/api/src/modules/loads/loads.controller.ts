import type { Request, Response } from "express";
import { writeAuditLog } from "../../lib/audit.js";
import { LoadsService } from "./loads.service.js";

const service = new LoadsService();

export class LoadsController {
  async list(req: Request, res: Response) {
    const items = await service.list(req.auth!.organizationId);
    res.json(items);
  }

  async create(req: Request, res: Response) {
    const load = await service.create(req.auth!.organizationId, req.body);

    await writeAuditLog({
      organizationId: req.auth!.organizationId,
      actorUserId: req.auth!.sub,
      action: "load.created",
      entityType: "Load",
      entityId: load.id,
      metadata: { referenceNumber: load.referenceNumber }
    });

    res.status(201).json(load);
  }
}
