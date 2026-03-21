import type { NextFunction, Request, Response } from "express";
import { getCurrentUser, login, logout, refresh, register } from "./service.js";
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from "./validation.js";

export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await register(payload);
    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await login(payload);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = refreshSchema.parse(req.body);
    const result = await refresh(payload.refreshToken);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = logoutSchema.parse(req.body);
    await logout(payload.refreshToken);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getCurrentUser(req.auth!.userId);
    res.json({ ok: true, data: user });
  } catch (error) {
    next(error);
  }
}
