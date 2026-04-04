import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

if (dsn && !Sentry.getClient()) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
    environment: process.env.NODE_ENV || "development",
  });
}

export { Sentry };
