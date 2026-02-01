/**
 * Vercel Web Analytics - Custom Events
 *
 * Track custom user interactions and business metrics
 *
 * @see https://vercel.com/docs/analytics/custom-events
 */

import { track } from "@vercel/analytics";

/**
 * Custom event types for type safety
 */
export type CustomEventName =
  // User actions
  | "user_signup"
  | "user_login"
  | "user_logout"
  | "user_profile_update"

  // Shipment events
  | "shipment_created"
  | "shipment_updated"
  | "shipment_delivered"
  | "shipment_canceled"

  // Payment events
  | "payment_initiated"
  | "payment_completed"
  | "payment_failed"
  | "subscription_started"
  | "subscription_canceled"

  // Search events
  | "search_performed"
  | "filter_applied"
  | "sort_changed"

  // Engagement events
  | "feature_used"
  | "help_viewed"
  | "feedback_submitted"
  | "support_contacted"

  // Conversion events
  | "trial_started"
  | "upgrade_clicked"
  | "checkout_started"
  | "checkout_completed"

  // Error events
  | "error_occurred"
  | "api_error"
  | "validation_error";

/**
 * Event properties type
 */
export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Track custom event with Vercel Analytics
 *
 * @param eventName - Name of the event
 * @param properties - Optional event properties
 */
export function trackEvent(eventName: CustomEventName, properties?: EventProperties) {
  try {
    // Only track in production
    if (process.env.NEXT_PUBLIC_ENV !== "production") {
      console.log("📊 Analytics (dev):", eventName, properties);
      return;
    }

    track(eventName, properties);
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

/**
 * Track page view (automatic with Vercel Analytics, but can be used manually)
 *
 * @param pagePath - Page path (e.g., '/dashboard')
 * @param properties - Optional page properties
 */
export function trackPageView(pagePath: string, properties?: EventProperties) {
  trackEvent("feature_used", {
    feature: "page_view",
    page: pagePath,
    ...properties,
  });
}

/**
 * Track user signup
 *
 * @param method - Signup method (email, google, etc.)
 * @param userId - User ID (optional)
 */
export function trackSignup(method: string, userId?: string) {
  trackEvent("user_signup", {
    method,
    user_id: userId,
    timestamp: Date.now(),
  });
}

/**
 * Track user login
 *
 * @param method - Login method (email, google, etc.)
 * @param userId - User ID (optional)
 */
export function trackLogin(method: string, userId?: string) {
  trackEvent("user_login", {
    method,
    user_id: userId,
    timestamp: Date.now(),
  });
}

/**
 * Track shipment creation
 *
 * @param shipmentId - Shipment ID
 * @param properties - Additional shipment properties
 */
export function trackShipmentCreated(shipmentId: string, properties?: EventProperties) {
  trackEvent("shipment_created", {
    shipment_id: shipmentId,
    ...properties,
  });
}

/**
 * Track payment completion
 *
 * @param amount - Payment amount
 * @param currency - Currency code (e.g., 'USD')
 * @param method - Payment method
 */
export function trackPaymentCompleted(amount: number, currency: string, method: string) {
  trackEvent("payment_completed", {
    amount,
    currency,
    method,
    timestamp: Date.now(),
  });
}

/**
 * Track payment failure
 *
 * @param reason - Failure reason
 * @param amount - Payment amount
 * @param method - Payment method
 */
export function trackPaymentFailed(reason: string, amount?: number, method?: string) {
  trackEvent("payment_failed", {
    reason,
    amount,
    method,
    timestamp: Date.now(),
  });
}

/**
 * Track search performed
 *
 * @param query - Search query
 * @param resultsCount - Number of results
 */
export function trackSearch(query: string, resultsCount: number) {
  trackEvent("search_performed", {
    query,
    results_count: resultsCount,
    timestamp: Date.now(),
  });
}

/**
 * Track feature usage
 *
 * @param featureName - Name of the feature used
 * @param properties - Additional properties
 */
export function trackFeatureUsage(featureName: string, properties?: EventProperties) {
  trackEvent("feature_used", {
    feature: featureName,
    ...properties,
  });
}

/**
 * Track error occurrence
 *
 * @param errorType - Type of error
 * @param errorMessage - Error message
 * @param context - Additional context
 */
export function trackError(errorType: string, errorMessage: string, context?: EventProperties) {
  trackEvent("error_occurred", {
    error_type: errorType,
    error_message: errorMessage,
    ...context,
    timestamp: Date.now(),
  });
}

/**
 * Track API error
 *
 * @param endpoint - API endpoint
 * @param statusCode - HTTP status code
 * @param errorMessage - Error message
 */
export function trackAPIError(endpoint: string, statusCode: number, errorMessage: string) {
  trackEvent("api_error", {
    endpoint,
    status_code: statusCode,
    error_message: errorMessage,
    timestamp: Date.now(),
  });
}

/**
 * Track conversion event (trial, upgrade, checkout)
 *
 * @param conversionType - Type of conversion
 * @param value - Conversion value (optional)
 * @param properties - Additional properties
 */
export function trackConversion(
  conversionType: "trial" | "upgrade" | "checkout",
  value?: number,
  properties?: EventProperties,
) {
  const eventMap = {
    trial: "trial_started",
    upgrade: "upgrade_clicked",
    checkout: "checkout_completed",
  } as const;

  trackEvent(eventMap[conversionType] as CustomEventName, {
    value,
    ...properties,
    timestamp: Date.now(),
  });
}

/**
 * Batch tracking (for multiple events at once)
 *
 * @param events - Array of events to track
 */
export function trackBatch(events: Array<{ name: CustomEventName; properties?: EventProperties }>) {
  events.forEach(({ name, properties }) => {
    trackEvent(name, properties);
  });
}

/**
 * Track interaction time (time spent on feature/page)
 *
 * @param feature - Feature name
 * @param startTime - Start timestamp
 */
export function trackInteractionTime(feature: string, startTime: number) {
  const duration = Date.now() - startTime;
  trackEvent("feature_used", {
    feature,
    interaction_duration_ms: duration,
    interaction_duration_s: Math.round(duration / 1000),
  });
}

/**
 * Initialize analytics session tracking
 * Call this on app mount to track session data
 */
export function initializeAnalytics() {
  // Track session start
  if (typeof window !== "undefined") {
    const sessionStart = Date.now();

    // Track when user leaves
    window.addEventListener("beforeunload", () => {
      const sessionDuration = Date.now() - sessionStart;
      trackEvent("feature_used", {
        feature: "session_end",
        session_duration_ms: sessionDuration,
        session_duration_min: Math.round(sessionDuration / 60000),
      });
    });
  }
}
