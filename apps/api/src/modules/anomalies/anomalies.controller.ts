import type { Request, Response } from "express";
import { AnomaliesService } from "./anomalies.service.js";

const service = new AnomaliesService();

export class AnomaliesController {
  async evaluateDriverGps(req: Request, res: Response) {
    const data = await service.evaluateDriverGps(
      req.auth!.organizationId,
      req.auth!.sub,
      req.params.driverId
    );

    res.json(data);
  }
}
