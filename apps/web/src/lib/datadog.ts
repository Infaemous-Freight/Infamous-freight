/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Datadog RUM (Real User Monitoring) Integration
 */

type DatadogRum = typeof import("@datadog/browser-rum").datadogRum;

let rumPromise: Promise<DatadogRum | null> | null = null;

function isConfigured() {
  return (
    process.env.NEXT_PUBLIC_ENV === "production" &&
    !!process.env.NEXT_PUBLIC_DD_APP_ID &&
    !!process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN
  );
}

function loadRum(): Promise<DatadogRum | null> {
  if (!isConfigured()) return Promise.resolve(null);
  if (!rumPromise) {
    rumPromise = import("@datadog/browser-rum")
      .then((mod) => mod.datadogRum)
      .catch((error) => {
        console.error("[Datadog RUM] Failed to load SDK:", error);
        rumPromise = null;
        return null;
      });
  }
  return rumPromise;
}

/**
 * Initialize Datadog RUM for production monitoring.
 * The SDK is dynamically imported so it is not part of the initial JS bundle.
 */
export function initDatadogRUM() {
  const appId = process.env.NEXT_PUBLIC_DD_APP_ID;
  const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;
  const site = process.env.NEXT_PUBLIC_DD_SITE || "datadoghq.com";
  const service = process.env.NEXT_PUBLIC_DD_SERVICE || "infamous-freight-web";
  const env = process.env.NEXT_PUBLIC_DD_ENV || "production";

  if (!isConfigured()) {
    console.info("[Datadog RUM] Skipping initialization (not production or credentials missing)");
    return;
  }

  loadRum().then((datadogRum) => {
    if (!datadogRum) return;

    try {
      datadogRum.init({
        applicationId: appId!,
        clientToken: clientToken!,
        site,
        service,
        env,
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: "mask-user-input",
        beforeSend: (event, _context) => {
          if (event.type === "error") {
            if (event.error?.message) {
              event.error.message = sanitizeMessage(event.error.message);
            }
          }
          return true;
        },
      });

      datadogRum.startSessionReplayRecording();

      console.info("[Datadog RUM] Initialized successfully", { service, env, site });
    } catch (error) {
      console.error("[Datadog RUM] Failed to initialize:", error);
    }
  });
}

/**
 * Set user context for Datadog RUM
 * Call this after user authentication
 */
export function setDatadogUser(user: { id: string; email?: string; name?: string; role?: string }) {
  if (!isConfigured()) return;

  loadRum().then((datadogRum) => {
    if (!datadogRum) return;
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
  });
}

/**
 * Clear user context (call on logout)
 */
export function clearDatadogUser() {
  if (!isConfigured()) return;

  loadRum().then((datadogRum) => {
    if (!datadogRum) return;
    try {
      datadogRum.clearUser();
    } catch (error) {
      console.error("[Datadog RUM] Failed to clear user:", error);
    }
  });
}

/**
 * Add custom context to RUM events
 */
export function addDatadogContext(key: string, value: unknown) {
  if (!isConfigured()) return;

  loadRum().then((datadogRum) => {
    if (!datadogRum) return;
    try {
      datadogRum.setGlobalContextProperty(key, value);
    } catch (error) {
      console.error("[Datadog RUM] Failed to add context:", error);
    }
  });
}

/**
 * Track custom action in Datadog RUM
 */
export function trackDatadogAction(name: string, context?: Record<string, unknown>) {
  if (!isConfigured()) return;

  loadRum().then((datadogRum) => {
    if (!datadogRum) return;
    try {
      datadogRum.addAction(name, context);
    } catch (error) {
      console.error("[Datadog RUM] Failed to track action:", error);
    }
  });
}

/**
 * Sanitize error messages to remove PII
 */
function sanitizeMessage(message: string): string {
  message = message.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL]");
  message = message.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");
  message = message.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[CARD]");
  message = message.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]");
  return message;
}
