import * as Sentry from "@sentry/node";

const rawDsn = process.env.SENTRY_DSN?.trim();
const sendDefaultPii = process.env.SENTRY_SEND_DEFAULT_PII === "true";
const dsn = rawDsn || undefined;
let sentryEnabled = Boolean(Sentry.getClient());
let sentryWarning: string | undefined;

if (dsn && !sentryEnabled) {
  const looksLikeSentryToken = /^sntr[a-z0-9]*_/i.test(dsn);

  if (looksLikeSentryToken) {
    sentryEnabled = false;
    sentryWarning =
      "SENTRY_DSN appears to be a Sentry auth token, not a DSN; error reporting is disabled.";
  } else {
    try {
      Sentry.init({
        dsn,
        environment:
          process.env.SENTRY_ENVIRONMENT ||
          process.env.NODE_ENV ||
          "development",
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
        release: process.env.SENTRY_RELEASE || process.env.RELEASE,
        sendDefaultPii,
        integrations: [Sentry.processSessionIntegration()],
      });
      sentryEnabled = true;
    } catch {
      sentryEnabled = false;
      sentryWarning = "Sentry initialization failed; error reporting is disabled.";
    }
  }
}

if (sentryWarning) {
  console.warn(sentryWarning);
}

export function captureException(error: unknown): void {
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

export function runWithSentryCapture<T>(operation: () => T): T;
export function runWithSentryCapture<T>(operation: () => Promise<T>): Promise<T>;
export function runWithSentryCapture<T>(operation: () => T | Promise<T>): T | Promise<T> {
  try {
    const result = operation();

    if (result && typeof (result as Promise<T>).then === "function") {
      return (result as Promise<T>).catch((error: unknown) => {
        captureException(error);
        throw error;
      });
    }

    return result;
  } catch (error) {
    captureException(error);
    throw error;
  }
}

process.on("unhandledRejection", (reason) => {
  captureException(reason);
});

process.on("uncaughtException", (error) => {
  captureException(error);
});

export { Sentry, sentryEnabled };
