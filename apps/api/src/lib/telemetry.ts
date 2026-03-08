import * as Sentry from "@sentry/node";
import { env } from "../config/env.js";

export function initTelemetry() {
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV
  });
}

export function captureError(error: unknown) {
  if (env.SENTRY_DSN) {
    Sentry.captureException(error);
  } else {
    console.error(error);
  }
}
