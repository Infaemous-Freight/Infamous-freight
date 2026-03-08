import type { Request, Response } from "express";
import { TrackingService } from "./tracking.service.js";

const service = new TrackingService();

export class TrackingController {
  async ingestGps(req: Request, res: Response) {
    const ping = await service.ingestGps(req.auth!.organizationId, req.body);
    res.status(201).json(ping);
  }
}
