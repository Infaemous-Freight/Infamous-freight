// Sentry configuration helpers used by server.js
let Sentry;
try {
  Sentry = require("@sentry/node");
} catch (e) {
  Sentry = null;
}

function initSentry(app) {
  if (!Sentry) return;
  try {
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      Sentry.init({ dsn, environment: process.env.NODE_ENV || "development" });
    }
    // Request handler first middleware
    app.use(Sentry.Handlers.requestHandler());
  } catch (_) {}
}

function attachErrorHandler(app) {
  if (!Sentry) return;
  try {
    app.use(Sentry.Handlers.errorHandler());
  } catch (_) {}
}

module.exports = {
  initSentry,
  attachErrorHandler,
};
