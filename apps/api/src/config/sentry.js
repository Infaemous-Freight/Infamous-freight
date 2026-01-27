// Sentry configuration helpers used by server.js
const Sentry = require("@sentry/node");
const { logger } = require('../middleware/logger');

function initSentry(app) {
  try {
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      Sentry.init({
        dsn: dsn,
        environment: process.env.NODE_ENV || "development",
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app, request: true, serverName: true, transaction: true }),
        ],
        tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) : (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),
        attachStacktrace: true,
        includeLocalVariables: process.env.NODE_ENV !== 'production',
        denyUrls: [
          // Ignore 404 and other low-priority errors
          /\/api\/health/,
        ],
        beforeSend(event, hint) {
          // Filter out certain errors
          if (event.exception) {
            const error = hint.originalException;
            if (error?.message?.includes('Ignored')) {
              return null;
            }
          }
          return event;
        },
      });
      logger.info('Sentry initialized with DSN');
    }
    // Request handler first middleware
    app.use(Sentry.Handlers.requestHandler());
  } catch (err) {
    logger.warn('Failed to initialize Sentry', { error: err.message });
  }
}

function attachErrorHandler(app) {
  try {
    app.use(Sentry.Handlers.errorHandler());
  } catch (err) {
    logger.warn('Failed to attach Sentry error handler', { error: err.message });
  }
}

module.exports = {
  initSentry,
  attachErrorHandler,
  Sentry,
};
