/**
 * Sentry Utilities - Helper functions for error tracking
 * Import these helpers throughout your app for consistent error handling
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Capture an exception with additional context
 * Use this instead of raw Sentry.captureException for consistency
 *
 * @example
 * try {
 *   await updateShipment(id);
 * } catch (error) {
 *   logError(error, { shipmentId: id, action: 'update' });
 * }
 */
export function logError(
  error: Error | unknown,
  context?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "error",
): string {
  const eventId = Sentry.captureException(error, {
    level,
    contexts: {
      custom: context,
    },
    tags: {
      source: "manual",
      ...((context?.tags as Record<string, string>) || {}),
    },
  });

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("[Sentry]", error, context);
  }

  return eventId;
}

/**
 * Capture a message for monitoring/alerting
 * Use for non-error events that you want to track
 *
 * @example
 * logMessage('Payment processing completed', 'info', { amount: 100 });
 */
export function logMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, unknown>,
): string {
  const eventId = Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });

  if (process.env.NODE_ENV === "development") {
    console.debug(`[Sentry ${level}]`, message, context);
  }

  return eventId;
}

/**
 * Set user context for better error tracking
 * Call this after user login
 *
 * @example
 * setUser({ id: user.id, email: user.email, role: user.role });
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  if (process.env.NODE_ENV === "development") {
    console.debug("[Sentry] User set:", user.id);
  }
}

/**
 * Clear user context on logout
 * Call this when user logs out
 *
 * @example
 * clearUser();
 */
export function clearUser(): void {
  Sentry.setUser(null);

  if (process.env.NODE_ENV === "development") {
    console.debug("[Sentry] User cleared");
  }
}

/**
 * Add custom breadcrumb (appears in error details)
 * Use to track user actions leading up to errors
 *
 * @example
 * addBreadcrumb('User clicked submit', 'user-action', 'info');
 */
export function addBreadcrumb(
  message: string,
  category: string = "custom",
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set custom context for next error
 * Use to add domain-specific context
 *
 * @example
 * setContext('shipment', { id: '123', status: 'in-transit' });
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  Sentry.setContext(name, context);
}

/**
 * Set custom tag for filtering
 * Tags appear in Sentry UI for filtering/grouping
 *
 * @example
 * setTag('feature', 'billing');
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set multiple tags at once
 *
 * @example
 * setTags({ feature: 'billing', environment: 'production' });
 */
export function setTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

/**
 * Track custom performance metric
 * Use for business-critical operations
 *
 * @example
 * const metric = startPerformanceMetric('payment-processing');
 * await processPayment();
 * metric.finish();
 */
export function startPerformanceMetric(
  name: string,
  op: string = "custom",
): Sentry.Span | undefined {
  // Start a new span using the current scope
  return Sentry.startSpan(
    {
      name,
      op,
    },
    (span) => span,
  );
}

/**
 * Wrap an async function with automatic error tracking
 * Automatically captures errors and adds breadcrumbs
 *
 * @example
 * const safeUpdate = withErrorTracking(updateShipment, 'updateShipment');
 * await safeUpdate(shipmentId);
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  functionName?: string,
  context?: Record<string, unknown>,
): T {
  const wrappedFn = async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const name = functionName || fn.name || "anonymous";

    addBreadcrumb(`Calling ${name}`, "function-call", "info", {
      args: args.length,
    });

    try {
      const result = await fn(...args);
      return result as Awaited<ReturnType<T>>;
    } catch (error) {
      logError(error, {
        function: name,
        args,
        ...context,
      });
      throw error; // Re-throw after logging
    }
  };

  return wrappedFn as T;
}

/**
 * Create a Sentry transaction for performance monitoring
 * Use for tracking complex operations
 *
 * @example
 * const transaction = createTransaction('checkout-process', 'payment');
 * try {
 *   // Do work
 *   transaction.setStatus('ok');
 * } catch (error) {
 *   transaction.setStatus('internal_error');
 *   throw error;
 * } finally {
 *   transaction.finish();
 * }
 */
export function createTransaction(name: string, op: string = "custom"): Sentry.Span | undefined {
  return Sentry.startSpan(
    {
      name,
      op,
      attributes: {
        manual: "true",
      },
    },
    (span) => span,
  );
}

/**
 * Check if Sentry is initialized and ready
 * Useful for conditional Sentry calls
 */
export function isSentryEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_SENTRY_DSN;
}

/**
 * Get current Sentry environment
 */
export function getSentryEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_ENV ||
    process.env.NODE_ENV ||
    "unknown"
  );
}

/**
 * Safely execute code with Sentry error tracking
 * If Sentry is disabled, just runs the code normally
 *
 * @example
 * await safeExecute(async () => {
 *   await riskyOperation();
 * }, 'riskyOperation');
 */
export async function safeExecute<T>(
  fn: () => Promise<T> | T,
  operationName?: string,
  context?: Record<string, unknown>,
): Promise<T | null> {
  try {
    if (operationName) {
      addBreadcrumb(`Executing ${operationName}`, "operation", "info");
    }
    return await fn();
  } catch (error) {
    if (isSentryEnabled()) {
      logError(error, {
        operation: operationName,
        ...context,
      });
    } else {
      console.error(error);
    }
    return null;
  }
}

// Export Sentry instance for advanced usage
export { Sentry };

// Re-export commonly used types
export type { SeverityLevel, Span } from "@sentry/nextjs";
