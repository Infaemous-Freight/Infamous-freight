import "dotenv/config";
import * as Sentry from "@sentry/node";
import type { ErrorRequestHandler } from "express";

let sentryInitialized = false;

function initializeSentry(): boolean {
  if (sentryInitialized) {
    return true;
  }

  const sentryDsn = process.env.SENTRY_DSN;
  if (!sentryDsn) {
    return false;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });

  sentryInitialized = true;
  return true;
}

initializeSentry();

export function captureException(error: unknown, extras?: Record<string, unknown>): void {
  if (!initializeSentry()) {
    return;
  }

  const normalizedError = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(normalizedError, extras ? { extra: extras } : undefined);
}

export const sentryErrorHandler: ErrorRequestHandler = (err, req, _res, next) => {
  captureException(err, {
    method: req.method,
    path: req.path,
    requestId: req.headers["x-request-id"],
  });
  next(err);
};

export function verifySentryCapture(): void {
  captureException(new Error("Sentry integration verification event"), {
    source: "manual-verification",
  });
}
