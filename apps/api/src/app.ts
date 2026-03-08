import express from "express";
import swaggerUi from "swagger-ui-express";
import openapiDoc from "./docs/openapi.json" with { type: "json" };
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestId } from "./middleware/request-id.js";
import { tenantContext } from "./middleware/tenant-context.js";
import { anomaliesRouter } from "./modules/anomalies/anomalies.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";
import { dispatchRouter } from "./modules/dispatch/dispatch.routes.js";
import { loadsRouter } from "./modules/loads/loads.routes.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestId);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "infamous-freight-api" });
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

  app.use(authMiddleware);
  app.use(tenantContext);

  app.use("/loads", loadsRouter);
  app.use("/dispatch", dispatchRouter);
  app.use("/anomalies", anomaliesRouter);
  app.use("/audit", auditRouter);

  app.use(errorHandler);

  return app;
}
