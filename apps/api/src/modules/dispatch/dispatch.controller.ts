import type { Request, Response } from "express";
import { DispatchService } from "./dispatch.service.js";

const service = new DispatchService();

export class DispatchController {
  async recommend(req: Request, res: Response) {
    const data = await service.recommend(req.auth!.organizationId, req.params.loadId);
    res.json(data);
  }

  async assign(req: Request, res: Response) {
    const data = await service.assign(
      req.auth!.organizationId,
      req.auth!.sub,
      req.params.loadId,
      req.params.driverId
    );
    res.json(data);
  }
}
