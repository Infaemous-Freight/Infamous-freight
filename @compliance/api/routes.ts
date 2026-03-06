import type { Request, Response, Router } from "express";
import { ComplianceService } from "../services/compliance.service";

const complianceService = new ComplianceService();

interface AuthenticatedRequest extends Request {
  user?: {
    tenantId?: string;
    id?: string;
    role?: string;
  };
}

function assertTenantScope(req: AuthenticatedRequest, bodyTenantId: string) {
  const tenantId = req.user?.tenantId;

  if (!tenantId || tenantId !== bodyTenantId) {
    const error = new Error("Tenant scope mismatch.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
}

export function registerComplianceRoutes(router: Router): Router {
  router.post("/compliance/carriers/evaluate", (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload = req.body;
      assertTenantScope(req, payload.tenantId);

      const result = complianceService.evaluateCarrier(payload);

      return res.status(200).json({
        ok: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof (error as { status?: number }).status === "number"
          ? (error as { status: number }).status
          : 400;

      return res.status(status).json({
        ok: false,
        error: {
          message,
        },
      });
    }
  });

  return router;
}
