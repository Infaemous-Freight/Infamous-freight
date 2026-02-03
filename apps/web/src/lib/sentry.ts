/**
 * Sentry Error Tracking & APM Configuration
 *
 * This initializes Sentry for:
 * - Error tracking and reporting
 * - Performance monitoring (APM)
 * - Session replay
 * - Source maps
 * - Release tracking
 */

import * as Sentry from "@sentry/nextjs";

const isDevelopment = process.env.NODE_ENV === "development";
const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (sentryDSN) {
  Sentry.init({
    // Sentry DSN
    dsn: sentryDSN,

    // Environment and Release
    environment: process.env.NEXT_PUBLIC_ENV || "development",
    release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

    // Performance Monitoring
    tracesSampleRate: isDevelopment ? 1.0 : 0.1, // Sample 100% in dev, 10% in production
    profilesSampleRate: isDevelopment ? 1.0 : 0.1,

    // Session Replay
    replaysSessionSampleRate: isDevelopment ? 1.0 : 0.1, // Session replay for 10% of users
    replaysOnErrorSampleRate: isDevelopment ? 1.0 : 1.0, // Always replay errors

    // Release tracking
    autoSessionTracking: true,

    // Error handling
    enabled: !isDevelopment || !!sentryDSN,

    // Transport options
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out certain breadcrumb types
      if (breadcrumb.category === "console" && breadcrumb.level === "debug") {
        return null;
      }
      return breadcrumb;
    },

    beforeSend(event, hint) {
      // Omit sensitive data
      if (event.request) {
        event.request.headers = undefined;
        event.request.cookies = undefined;
      }

      // Omit certain error types
      if (hint.originalException instanceof TypeError) {
        if (hint.originalException.message.includes("Network")) {
          // Don't report network errors in development
          if (isDevelopment) return null;
        }
      }

      return event;
    },

    integrations: [
      new Sentry.Replay({
        maskAllReplayText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
      // Performance monitoring integration
      new Sentry.Integrations.RequestData(),
    ],

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Random plugins/extensions
      "chrome-extension://",
      "moz-extension://",
      // Network errors
      "NetworkError",
      "Network request failed",
      // CSP violations
      "Can't find variable:",
      // Instagram popups and similar
      "instantiateNativeConverter is not a function",
      // See http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
      "jigsaw is not defined",
      "ComboSearch is not defined",
      // Random clicks/typing in search boxes
      "bmi_SafeAddOnload",
      "EBCallBackMessageReceived",
      // Analytics errors
      "Unexpected token <",
      "SyntaxError: unexpected token",
    ],

    // Deny URLs (don't send data for these URLs)
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /moz-extension:\/\//i,
    ],
  });
}

/**
 * Set user context for error tracking
 * Call this after user authentication
 *
 * @param {Object} user - User object with id, email, etc.
 */
export function setSentryUser(user) {
  if (user && sentryDSN) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add custom context for debugging
 *
 * @param {string} contextName - Name of context (e.g. 'shipment', 'payment')
 * @param {Object} data - Context data
 */
export function setSentryContext(contextName, data) {
  if (sentryDSN) {
    Sentry.setContext(contextName, data);
  }
}

/**
 * Track custom events
 *
 * @param {string} message - Event message
 * @param {Object} options - Additional options
 */
export function trackSentryEvent(message, options = {}) {
  if (sentryDSN) {
    Sentry.captureMessage(message, {
      level: options.level || "info",
      tags: options.tags || {},
      contexts: {
        custom: options.contexts || {},
      },
    });
  }
}

/**
 * Report error to Sentry
 *
 * @param {Error} error - Error object
 * @param {Object} options - Additional options
 */
export function reportSentryError(error, options = {}) {
  if (sentryDSN) {
    Sentry.captureException(error, {
      level: options.level || "error",
      tags: options.tags || {},
      contexts: {
        custom: options.contexts || {},
      },
    });
  }
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs show the user's actions leading up to an error
 *
 * @param {string} message - Breadcrumb message
 * @param {Object} options - Additional options
 */
export function addSentryBreadcrumb(message, options = {}) {
  if (sentryDSN) {
    Sentry.addBreadcrumb({
      message,
      category: options.category || "user-action",
      level: options.level || "info",
      data: options.data || {},
    });
  }
}

export default Sentry;
