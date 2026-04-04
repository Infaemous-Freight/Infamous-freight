import cors from "cors";
import express from "express";
import * as Sentry from "@sentry/node";
import { ENV } from "./env.js";
import { health } from "./routes/health.js";
import { ai } from "./routes/ai.js";
import { loadboard } from "./routes/loadboard.js";
import { shipments } from "./routes/shipments.js";
import { tenants } from "./routes/tenants.js";
import { HttpError } from "./utils/errors.js";

const app = express();

const SENTRY_SEND_DEFAULT_PII = process.env.SENTRY_SEND_DEFAULT_PII === "true";

const redactSentryEvent = (event: Sentry.Event): Sentry.Event => {
  if (!event.request) {
    return event;
  }

  if (event.request.headers) {
    delete event.request.headers.authorization;
    delete event.request.headers.Authorization;
    delete event.request.headers.cookie;
    delete event.request.headers.Cookie;
  }

  if ("cookies" in event.request) {
    delete (event.request as Sentry.Event["request"] & { cookies?: unknown }).cookies;
  }

  return event;
};

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: SENTRY_SEND_DEFAULT_PII,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  beforeSend: (event) => redactSentryEvent(event),
});

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
