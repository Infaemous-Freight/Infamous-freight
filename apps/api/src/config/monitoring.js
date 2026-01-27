/*
 * Monitoring configuration
 * CommonJS module used by server to conditionally enable monitoring features.
 */

const enabled = String(process.env.PERFORMANCE_MONITORING_ENABLED || "false").toLowerCase() === "true";

module.exports = {
  enabled,
  sentry: {
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  },
  datadog: {
    traceEnabled: String(process.env.DD_TRACE_ENABLED || "false").toLowerCase() === "true",
    service: process.env.DD_SERVICE || "infamous-freight-api",
    env: process.env.DD_ENV || process.env.NODE_ENV || "development",
    runtimeMetrics: String(process.env.DD_RUNTIME_METRICS_ENABLED || "false").toLowerCase() === "true",
  },
};
