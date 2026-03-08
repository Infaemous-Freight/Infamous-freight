import express from "express";
import { authMiddleware } from "./middleware/auth.js";
import { tenantContext } from "./middleware/tenantContext.js";
import { loadsRouter } from "./routes/loads-express.js";
import { dispatchRouter } from "./routes/dispatch.js";
import { anomaliesRouter } from "./routes/anomalies.js";

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

  app.use((
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const anyErr = err as any;
    const statusFromError =
      typeof anyErr?.status === "number"
        ? anyErr.status
        : typeof anyErr?.statusCode === "number"
        ? anyErr.statusCode
        : undefined;

    const status = statusFromError && statusFromError >= 400 && statusFromError <= 599
      ? statusFromError
      : 500;

    const isServerError = status >= 500;

    const message =
      !isServerError && typeof anyErr?.message === "string" && anyErr.message.trim().length > 0
        ? anyErr.message
        : isServerError
        ? "Internal Server Error"
        : "Request failed";

    const errorBody: Record<string, unknown> = {
      message,
    };

    if (anyErr?.code && typeof anyErr.code === "string") {
      errorBody.code = anyErr.code;
    }

    if (process.env.NODE_ENV !== "production" && isServerError) {
      // Expose minimal diagnostic info in non-production without leaking stack traces.
      if (typeof anyErr?.name === "string") {
        errorBody.type = anyErr.name;
      }
    }

    res.status(status).json({ error: errorBody });
  });
  return app;
}
