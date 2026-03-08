import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";

const service = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    const data = await service.login(req.body.email);
    res.json(data);
  }

  async refresh(req: Request, res: Response) {
    const data = await service.refresh(req.body.refreshToken);
    res.json(data);
  }

  async revoke(req: Request, res: Response) {
    const data = await service.revoke(req.body.refreshToken);
    res.json(data);
  }
}
