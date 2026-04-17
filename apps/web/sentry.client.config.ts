/**
 * Sentry Client Configuration for Next.js
 * Client-side error tracking and performance monitoring
 * This file is automatically loaded by @sentry/nextjs
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isDevelopment = process.env.NODE_ENV === "development";

if (dsn) {
  Sentry.init({
    dsn: dsn,
    environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development",

    // Performance Monitoring
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,

    // Session Replay
    // Do not record full sessions in production by default; the replay
    // recorder bundle is non-trivial and the event volume is expensive.
    // Errors still produce a replay via replaysOnErrorSampleRate.
    replaysSessionSampleRate: isDevelopment ? 1.0 : 0,
    replaysOnErrorSampleRate: 1.0, // Always capture on error

    // Release
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || "unknown",

    // Integrations
    integrations: [
      // Session Replay with enhanced privacy controls
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true, // Mask all form inputs by default

        // Custom masking for sensitive elements
        beforeAddRecordingEvent: (event) => {
          // Return event (privacy handled by maskAllText/blockAllMedia)
          return event;
        },
      }),

      // Browser Tracing
      Sentry.browserTracingIntegration({
        enableInp: true,
      }),
    ],

    // Default tags
    initialScope: {
      tags: {
        component: "web",
        runtime: "browser",
        deployment: process.env.NEXT_PUBLIC_ENV || "production",
      },
    },

    // Event filtering
    beforeSend(event, hint) {
      // Filter 404 errors in production
      if (event.contexts?.response?.status_code === 404 && !isDevelopment) {
        return null;
      }

      // Filter ResizeObserver errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
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

    // Deny URLs
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i, /\.woff2$/i, /\.png$/i],

    attachStacktrace: true,
    maxBreadcrumbs: isDevelopment ? 100 : 50,

    // Ignore patterns
    ignoreErrors: [
      "top.GLOBALS",
      "ResizeObserver loop limit exceeded",
      "chrome-extension://",
      "moz-extension://",
      "NetworkError",
      "Network request failed",
      // Ignore some canvas errors
      "WEBGL_DEBUG_LOST_CONTEXT",
    ],
  });
}
