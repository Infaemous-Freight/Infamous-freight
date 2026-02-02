/**
 * Sentry Client Configuration for Next.js
 * Initialize error tracking and performance monitoring
 */

import * as Sentry from "@sentry/nextjs";

export const initSentry = (): void => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn("⚠️  Sentry DSN not configured. Error tracking disabled.");
    return;
  }

  try {
    Sentry.init({
      // Sentry project configuration
      dsn: dsn,
      environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development",

      // Performance monitoring - sample 10% of transactions in production
      tracesSampleRate: isDevelopment ? 1.0 : 0.1,

      // Replay configuration - sample 10% of user sessions in production
      replaysSessionSampleRate: isDevelopment ? 1.0 : 0.1,
      replaysOnErrorSampleRate: isDevelopment ? 1.0 : 1.0, // Always capture replays on errors

      // Release tracking (set by build process)
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || "unknown",

      // Integrations
      integrations: [
        // Session Replay - captures user interactions for debugging
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),

        // Browser Tracing - captures performance metrics
        new Sentry.BrowserTracing({
          // Set `tracePropagationTargets` to control what URLs distributed tracing should be enabled for
          tracePropagationTargets: [
            "localhost",
            /^\//,
            // Adds tracing for API Gateway
            /^https:\/\/yourserver\.io\/api/,
          ],
          routingInstrumentation: Sentry
            .nextjsRouterInstrumentation
            // This function won't actually be imported until Next.js runtime
            // when using the Next.js SDK
            (),
        }),
      ],

      // Default tags added to all events
      initialScope: {
        tags: {
          component: "web",
          deployment: process.env.NEXT_PUBLIC_ENV || "production",
        },
      },

      // Before sending events to Sentry, modify them here
      beforeSend(event, hint) {
        // Filter 404 errors in production
        if (event.status === 404 && !isDevelopment) {
          return null;
        }

        // Filter harmless errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            // Skip "ResizeObserver loop limit exceeded"
            if (error.message.includes("ResizeObserver")) {
              return null;
            }
            // Skip network errors in development
            if (isDevelopment && error.message.includes("Network")) {
              return null;
            }
          }
        }

        return event;
      },

      // Ignore certain errors
      denyUrls: [
        // Browser console errors
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
        // Ignore 404 requests to resources
        /\.woff2$/i,
        /\.png$/i,
      ],

      // Attach stack traces to all events
      attachStacktrace: true,

      // Include source code context in errors (disabled in production by default)
      maxBreadcrumbs: isDevelopment ? 100 : 50,

      // Ignore errors from specific patterns
      ignoreErrors: [
        // Browser extensions
        "top.GLOBALS",
        // Ignore ResizeObserver errors (non-critical)
        "ResizeObserver loop limit exceeded",
        // Random plugins/extensions
        "chrome-extension://",
        "moz-extension://",
        // Network errors
        "NetworkError",
        "Network request failed",
      ],
    });

    if (!isDevelopment) {
      console.log("✅ Sentry initialized for", process.env.NEXT_PUBLIC_ENV);
    }
  } catch (error) {
    console.error("❌ Failed to initialize Sentry:", error);
  }
};

/**
 * Capture an exception with additional context
 */
export const captureException = (error: Error, context?: Record<string, unknown>): void => {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
};

/**
 * Capture a message for monitoring/alerting
 */
export const captureMessage = (
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
): void => {
  Sentry.captureMessage(message, level);
};

/**
 * Set user context for better error tracking
 */
export const setUserContext = (userId: string, email?: string): void => {
  Sentry.setUser({
    id: userId,
    email: email || undefined,
  });
};

/**
 * Clear user context on logout
 */
export const clearUserContext = (): void => {
  Sentry.setUser(null);
};

/**
 * Add custom breadcrumb (appears in error details)
 */
export const addBreadcrumb = (
  message: string,
  category: string = "custom",
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
): void => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

export default Sentry;
