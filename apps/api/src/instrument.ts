import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN?.trim();
const sendDefaultPii = process.env.SENTRY_SEND_DEFAULT_PII === "true";

const sentryEnabled = Boolean(dsn);

if (sentryEnabled && !Sentry.getClient()) {
  Sentry.init({
    dsn,
    sendDefaultPii,
    environment: process.env.NODE_ENV || "development",
  });
}

export { Sentry, sentryEnabled };
