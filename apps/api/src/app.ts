import express from "express";
import { authMiddleware } from "./middleware/auth.js";
import { tenantContext } from "./middleware/tenantContext.js";
import { anomaliesRouter } from "./routes/anomalies.js";
import { dispatchRouter } from "./routes/dispatch.js";
import { loadsRouter } from "./routes/loads.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "infamous-freight-api" });
  });

  app.use(authMiddleware);
  app.use(tenantContext);

  app.use("/loads", loadsRouter);
  app.use("/dispatch", dispatchRouter);
  app.use("/anomalies", anomaliesRouter);

  return app;
}
