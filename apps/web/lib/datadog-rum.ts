/**
 * Datadog Real User Monitoring (RUM) Setup
 * Client-side performance monitoring and error tracking for web app
 *
 * Place this in apps/web/lib/datadog-rum.ts
 */

export interface DatadogConfig {
  applicationId: string;
  clientToken: string;
  site: string;
  service: string;
  env: string;
  version?: string;
}

/**
 * Initialize Datadog RUM
 * Should be called early in app lifecycle (e.g., in _app.tsx)
 */
export function initializeDatadogRum(config: DatadogConfig) {
  // Only initialize in browser
  if (typeof window === "undefined") return;

  // Check if config is valid
  if (!config.applicationId || !config.clientToken) {
    console.warn("Datadog RUM config incomplete, skipping initialization");
    return;
  }

  // Dynamic import to avoid issues with SSR
  import("@datadog/browser-rum").then(({ datadogRum }) => {
    datadogRum.init({
      applicationId: config.applicationId,
      clientToken: config.clientToken,
      site: config.site || "datadoghq.com",
      service: config.service,
      env: config.env,
      version: config.version,
      sessionSampleRate: 100, // Track all sessions
      sessionReplaySampleRate: 20, // Record 20% ofessions with replay
      trackUserInteractions: true,
      defaultPrivacyLevel: "mask-user-input", // Mask sensitive data
      enableExperimentalFeatures: ["resource_timings"],
    });

    // Start RUM
    datadogRum.startSessionReplayRecording();
  });
}

/**
 * Add custom actions to track user interactions
 */
export function trackAction(name: string, context?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  import("@datadog/browser-rum").then(({ datadogRum }) => {
    datadogRum.addAction(name, context);
  });
}

/**
 * Track errors manually
 */
export function trackError(error: Error, context?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  import("@datadog/browser-rum").then(({ datadogRum }) => {
    datadogRum.addError(error, context);
  });
}

/**
 * Set user context
 */
export function setUserContext(userId: string, metadata?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  import("@datadog/browser-rum").then(({ datadogRum }) => {
    datadogRum.setUserAction({
      id: userId,
      ...metadata,
    });
  });
}

/**
 * Track page views
 */
export function trackPageView(name: string, context?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  import("@datadog/browser-rum").then(({ datadogRum }) => {
    datadogRum.addAction(name, context);
  });
}

/**
 * React integration helper
 * Use in useEffect to track route changes
 */
export function useDatadogRouteTracking(routeName: string) {
  if (typeof window === "undefined") return;

  import("@datadog/browser-rum").then(({ datadogRum }) => {
    datadogRum.addAction("page_view", {
      route: routeName,
      timestamp: new Date().toISOString(),
    });
  });
}
