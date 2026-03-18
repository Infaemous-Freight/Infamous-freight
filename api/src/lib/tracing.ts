/**
 * OpenTelemetry Tracing
 * Distributed tracing across API → queues → database → external services.
 * Exports to OTLP (Jaeger, Grafana Tempo, Honeycomb, Datadog — all compatible).
 *
 * IMPORTANT: This file must be imported FIRST in your entry point (server.ts),
 * before any other imports, so instrumentation patches load correctly.
 *
 * Usage in server.ts:
 *   import "./lib/tracing"; // Must be first import
 *   import express from "express";
 *   ...
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from "@opentelemetry/semantic-conventions";
import { trace, context, SpanStatusCode, type Span } from "@opentelemetry/api";

// ── SDK setup ─────────────────────────────────────────────────────────────────

const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: process.env.SERVICE_NAME ?? "infamous-freight-api",
  [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version ?? "0.0.0",
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? "development",
});

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? "http://localhost:4318/v1/traces",
});

const metricExporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ?? "http://localhost:4318/v1/metrics",
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 30_000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Auto-instruments: HTTP, Express, Prisma, Redis, fetch
      "@opentelemetry/instrumentation-fs": { enabled: false }, // Too noisy
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook: (req) => {
          // Don't trace health checks — they'd flood the trace backend
          return req.url === "/health" || req.url === "/metrics";
        },
      },
    }),
  ],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk.shutdown().finally(() => process.exit(0));
});

// ── Tracer helpers ────────────────────────────────────────────────────────────

export const tracer = trace.getTracer("infamous-freight", process.env.npm_package_version);

/**
 * Wrap an async operation in a named span.
 * Automatically records errors and sets span status.
 *
 * Usage:
 *   const result = await withSpan("shipment.create", async (span) => {
 *     span.setAttribute("shipment.origin", originZip);
 *     return prisma.shipment.create(...);
 *   });
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    if (attributes) {
      Object.entries(attributes).forEach(([k, v]) => span.setAttribute(k, v));
    }
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Propagate trace context into BullMQ job data.
 * Allows traces to continue from API → worker process.
 */
export function injectTraceContext(data: Record<string, unknown>): Record<string, unknown> {
  const carrier: Record<string, string> = {};
  // Propagate current context into carrier headers
  const { propagation } = require("@opentelemetry/api");
  propagation.inject(context.active(), carrier);
  return { ...data, _traceContext: carrier };
}

/**
 * Extract and restore trace context in a worker from job data.
 */
export function extractTraceContext(data: Record<string, unknown>) {
  const { propagation } = require("@opentelemetry/api");
  if (data._traceContext) {
    return propagation.extract(context.active(), data._traceContext as Record<string, string>);
  }
  return context.active();
}
