// Lightweight instrumentation bootstrap to ensure server startup
let Sentry = null;

try {
  Sentry = require("@sentry/node");
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
    });
  }
} catch (err) {
  // If Sentry isn't available, fail open
  Sentry = null;
}

function captureException(error) {
  if (!Sentry) return;

  try {
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
  } catch (_) {
    /* Fail gracefully if Sentry unavailable */
  }
}

process.on("unhandledRejection", (reason) => {
  captureException(reason);
});

process.on("uncaughtException", (err) => {
  captureException(err);
});
