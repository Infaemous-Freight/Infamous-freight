import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { sha256 } from "../lib/crypto.js";

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }

  const organizationId = req.auth?.organizationId;
  const key = req.header("idempotency-key");

  if (!organizationId || !key) {
    return next();
  }

  const requestHash = sha256(JSON.stringify(req.body ?? {}));

  const existing = await prisma.idempotencyKey.findUnique({
    where: {
      organizationId_key: {
        organizationId,
        key
      }
    }
  });

  if (existing) {
    if (existing.requestHash !== requestHash) {
      return res.status(409).json({
        error: "Idempotency key reused with different request body"
      });
    }

    if (existing.responseCode != null && existing.responseBody != null) {
      return res.status(existing.responseCode).json(existing.responseBody);
    }
  } else {
    await prisma.idempotencyKey.create({
      data: {
        organizationId,
        key,
        method: req.method,
        path: req.path,
        requestHash
      }
    });
  }

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    void prisma.idempotencyKey.update({
      where: {
        organizationId_key: {
          organizationId,
          key
        }
      },
      data: {
        responseCode: res.statusCode,
        responseBody: body as Record<string, unknown>
      }
    });

    return originalJson(body);
  }) as typeof res.json;

  return next();
}
