/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Datadog RUM (Real User Monitoring) Integration
 */

import { datadogRum } from "@datadog/browser-rum";

/**
 * Initialize Datadog RUM for production monitoring
 */
export function initDatadogRUM() {
  const isProduction = process.env.NEXT_PUBLIC_ENV === "production";
  const appId = process.env.NEXT_PUBLIC_DD_APP_ID;
  const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;
  const site = process.env.NEXT_PUBLIC_DD_SITE || "datadoghq.com";
  const service = process.env.NEXT_PUBLIC_DD_SERVICE || "infamous-freight-web";
  const env = process.env.NEXT_PUBLIC_DD_ENV || "production";

  // Only initialize in production with valid credentials
  if (!isProduction || !appId || !clientToken) {
    console.info("[Datadog RUM] Skipping initialization (not production or credentials missing)");
    return;
  }

  try {
    datadogRum.init({
      applicationId: appId,
      clientToken: clientToken,
      site: site,
      service: service,
      env: env,
      // Session replay and tracking
      sessionSampleRate: 100, // Track 100% of sessions
      sessionReplaySampleRate: 20, // Record 20% of sessions
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      // Default privacy level for session replay
      defaultPrivacyLevel: "mask-user-input", // Mask sensitive inputs
      // Advanced options
      beforeSend: (event, _context) => {
        // Sanitize sensitive data before sending to Datadog
        if (event.type === "error") {
          // Remove potential PII from error messages
          if (event.error?.message) {
            event.error.message = sanitizeMessage(event.error.message);
          }
        }
        return true; // Return false to drop the event
      },
      // Custom user identification (optional)
      // Set after authentication
    });

    // Start tracking views automatically
    datadogRum.startSessionReplayRecording();

    console.info("[Datadog RUM] Initialized successfully", {
      service,
      env,
      site,
    });
  } catch (error) {
    console.error("[Datadog RUM] Failed to initialize:", error);
  }
}

/**
 * Set user context for Datadog RUM
 * Call this after user authentication
 */
export function setDatadogUser(user: { id: string; email?: string; name?: string; role?: string }) {
  if (process.env.NEXT_PUBLIC_ENV !== "production") {
    return;
  }

  try {
    datadogRum.setUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("[Datadog RUM] Failed to set user:", error);
  }
}

/**
 * Clear user context (call on logout)
 */
export function clearDatadogUser() {
  if (process.env.NEXT_PUBLIC_ENV !== "production") {
    return;
  }

  try {
    datadogRum.clearUser();
  } catch (error) {
    console.error("[Datadog RUM] Failed to clear user:", error);
  }
}

/**
 * Add custom context to RUM events
 */
export function addDatadogContext(key: string, value: unknown) {
  if (process.env.NEXT_PUBLIC_ENV !== "production") {
    return;
  }

  try {
    datadogRum.setGlobalContextProperty(key, value);
  } catch (error) {
    console.error("[Datadog RUM] Failed to add context:", error);
  }
}

/**
 * Track custom action in Datadog RUM
 */
export function trackDatadogAction(name: string, context?: Record<string, unknown>) {
  if (process.env.NEXT_PUBLIC_ENV !== "production") {
    return;
  }

  try {
    datadogRum.addAction(name, context);
  } catch (error) {
    console.error("[Datadog RUM] Failed to track action:", error);
  }
}

/**
 * Sanitize error messages to remove PII
 */
function sanitizeMessage(message: string): string {
  // Remove email addresses
  message = message.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL]");
  // Remove phone numbers
  message = message.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");
  // Remove credit card numbers
  message = message.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[CARD]");
  // Remove SSN
  message = message.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]");
  return message;
}
