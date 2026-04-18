import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN?.trim();
const sendDefaultPii = process.env.SENTRY_SEND_DEFAULT_PII === "true";

const sentryEnabled = Boolean(dsn);

if (sentryEnabled && !Sentry.getClient()) {
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ||
      process.env.NODE_ENV ||
      "development",
    tracesSampleRate: Math.min(1, Math.max(0, Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0) || 0)),
    release: process.env.SENTRY_RELEASE || process.env.RELEASE,
    sendDefaultPii,
  });
}

function captureException(error: unknown): void {
  if (!sentryEnabled) return;

  if (error instanceof Error) {
    Sentry.captureException(error);
    return;
  }

  if (error !== null && typeof error === "object") {
    Sentry.captureException(error);
    return;
  }

  const normalizedError = new Error(String(error));
  Sentry.captureException(normalizedError, {
    extra: {
      originalThrowable: error,
    },
  });
}

process.on("unhandledRejection", (reason) => {
  captureException(reason);
});

process.on("uncaughtException", (error) => {
  captureException(error);
  void Sentry.close(2000).finally(() => process.exit(1));
});

export { Sentry, sentryEnabled };
