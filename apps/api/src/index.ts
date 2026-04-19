// Keep instrumentation bootstrap first so Sentry can patch runtime hooks early.
import "./instrument.js";
import cors from "cors";
import express from "express";
import { ENV } from "./env.js";
import { health } from "./routes/health.js";
import { ai } from "./routes/ai.js";
import { loadboard } from "./routes/loadboard.js";
import { shipments } from "./routes/shipments.js";
import { tenants } from "./routes/tenants.js";
import { HttpError } from "./utils/errors.js";

const app = express();

app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use("/health", health);
app.use("/tenants", tenants);
app.use("/shipments", shipments);
app.use("/loadboard", loadboard);
app.use("/ai", ai);

app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof HttpError ? err.message : "Server error";
  res.status(status).json({ error: message });
});

app.listen(ENV.API_PORT, () => {
  console.log(`API listening on :${ENV.API_PORT}`);
});
