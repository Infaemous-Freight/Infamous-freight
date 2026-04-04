// Lightweight instrumentation bootstrap to ensure server startup
let Sentry = null;

try {
  Sentry = require("@sentry/node");
  Sentry.init({
    dsn:
      process.env.SENTRY_DSN ||
      "https://6bfe6c333544c976cbba3633aad08ad4@o4511126931963904.ingest.us.sentry.io/4511126932226048",
    environment:
      process.env.SENTRY_ENVIRONMENT ||
      process.env.NODE_ENV ||
      "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
    release: process.env.SENTRY_RELEASE || process.env.RELEASE,
    sendDefaultPii: process.env.SENTRY_SEND_PII === "true",
  });
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
