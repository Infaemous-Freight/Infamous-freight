import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;
const sendDefaultPii = process.env.SENTRY_SEND_DEFAULT_PII === "true";

if (!Sentry.getClient()) {
  Sentry.init({
    dsn,
    sendDefaultPii,
    environment: process.env.NODE_ENV || "development",
  });
}

export { Sentry };
