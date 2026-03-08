import express from "express";
import swaggerUi from "swagger-ui-express";
import { requestId } from "./middleware/request-id.js";
import { authMiddleware } from "./middleware/auth.js";
import { tenantContext } from "./middleware/tenant-context.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { loadsRouter } from "./modules/loads/loads.routes.js";
import { dispatchRouter } from "./modules/dispatch/dispatch.routes.js";
import { anomaliesRouter } from "./modules/anomalies/anomalies.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";
import { trackingRouter } from "./modules/tracking/tracking.routes.js";
import { idempotencyMiddleware } from "./middleware/idempotency.js";
import openapiDoc from "./docs/openapi.json" with { type: "json" };

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestId);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "infamous-freight-api" });
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));
  app.use("/auth", authRouter);

  app.use(authMiddleware);
  app.use(tenantContext);
  app.use(idempotencyMiddleware);

  app.use("/loads", loadsRouter);
  app.use("/dispatch", dispatchRouter);
  app.use("/anomalies", anomaliesRouter);
  app.use("/audit", auditRouter);
  app.use("/tracking", trackingRouter);

  app.use(errorHandler);

  return app;
}
