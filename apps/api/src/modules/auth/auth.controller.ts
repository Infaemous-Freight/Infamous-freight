import type { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service.js";
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from "./auth.schemas.js";

export async function registerController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input, authService.getClientMetadata(req));

    authService.setRefreshTokenCookie(res, result.tokens.refreshToken);
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        accessTokenExpiresIn: result.tokens.accessTokenExpiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input, authService.getClientMetadata(req));

    authService.setRefreshTokenCookie(res, result.tokens.refreshToken);
    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        accessTokenExpiresIn: result.tokens.accessTokenExpiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    refreshSchema.parse(req.body ?? {});
    const result = await authService.refresh(req);

    authService.setRefreshTokenCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        accessTokenExpiresIn: result.accessTokenExpiresIn,
      },
    });
  } catch (error) {
    authService.clearRefreshTokenCookie(res);
    next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    logoutSchema.parse(req.body ?? {});
    await authService.logout(req);
    authService.clearRefreshTokenCookie(res);
    res.status(200).json({
      success: true,
      data: {
        message: "Logged out successfully",
      },
    });
  } catch (error) {
    authService.clearRefreshTokenCookie(res);
    next(error);
  }
}

export async function logoutAllController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ipAddress = authService.getClientMetadata(req).ipAddress;
    await authService.logoutAll(req.auth!.userId, ipAddress);
    authService.clearRefreshTokenCookie(res);
    res.status(200).json({
      success: true,
      data: {
        message: "Logged out from all sessions",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getCurrentUser(req.auth!.userId);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
