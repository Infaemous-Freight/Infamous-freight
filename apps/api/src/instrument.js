// Lightweight instrumentation bootstrap to ensure server startup
try {
  const Sentry = require("@sentry/node");
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
}

process.on("unhandledRejection", (reason) => {
  try {
    const Sentry = require("@sentry/node");
    Sentry.captureException(reason);
  } catch (_) {}
});

process.on("uncaughtException", (err) => {
  try {
    const Sentry = require("@sentry/node");
    Sentry.captureException(err);
  } catch (_) {}
});
