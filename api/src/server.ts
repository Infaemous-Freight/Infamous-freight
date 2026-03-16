/**
 * server.ts — Infæmous Freight API Entry Point
 *
 * Boot order is critical:
 *   1. Tracing (must patch before any other imports)
 *   2. Metrics registry
 *   3. Logger
 *   4. Express app + middleware
 *   5. Routes
 *   6. Error handler
 */

// ── 1. Tracing — MUST be first ────────────────────────────────────────────────
import "./lib/tracing";

// ── 2. Core imports ───────────────────────────────────────────────────────────
import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";

// ── 3. Observability ──────────────────────────────────────────────────────────
import { logger, requestIdMiddleware, httpLoggerMiddleware } from "./lib/logger";
import { metricsMiddleware, metricsEndpoint } from "./lib/metrics";

// ── App init ──────────────────────────────────────────────────────────────────
const app = express();
const PORT = Number(process.env.PORT ?? 4000);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  })
);

// ── Observability middleware (register early) ─────────────────────────────────
app.use(requestIdMiddleware);
app.use(httpLoggerMiddleware);
app.use(metricsMiddleware);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health & metrics endpoints ────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: process.env.SERVICE_NAME ?? "infamous-freight-api",
    version: process.env.npm_package_version ?? "unknown",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/metrics", metricsEndpoint);

// ── Routes ────────────────────────────────────────────────────────────────────
// TODO: Mount domain routers here
// import { shipmentsRouter } from "./routes/shipments";
// import { carriersRouter } from "./routes/carriers";
// app.use("/api/v1/shipments", shipmentsRouter);
// app.use("/api/v1/carriers", carriersRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as Request & { requestId?: string }).requestId;
  logger.error({ err, requestId }, "Unhandled error");
  res.status(500).json({
    error: "Internal Server Error",
    requestId,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      env: process.env.NODE_ENV ?? "development",
      service: process.env.SERVICE_NAME ?? "infamous-freight-api",
    },
    "Server started"
  );
});

export default app;