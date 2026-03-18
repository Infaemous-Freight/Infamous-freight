/**
 * Prometheus Metrics
 * Exposes application metrics at /metrics for Prometheus scraping.
 * Visualize in Grafana using the provided dashboard JSON.
 *
 * Metrics tracked:
 *   - HTTP request duration (histogram by route/method/status)
 *   - Active shipments by status
 *   - Queue depths and job processing rates
 *   - Cache hit/miss rates
 *   - Webhook delivery success/failure rates
 *   - Database query duration
 */

import { Registry, Counter, Histogram, Gauge, Summary } from "prom-client";
import { type Request, type Response } from "express";

// ── Registry ──────────────────────────────────────────────────────────────────

export const metricsRegistry = new Registry();

// Include default Node.js metrics (event loop lag, heap, GC, etc.)
import { collectDefaultMetrics } from "prom-client";
collectDefaultMetrics({ register: metricsRegistry, prefix: "infamous_" });

// ── HTTP Metrics ──────────────────────────────────────────────────────────────

export const httpRequestDuration = new Histogram({
  name: "infamous_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const httpRequestsTotal = new Counter({
  name: "infamous_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

// ── Shipment Metrics ──────────────────────────────────────────────────────────

export const activeShipments = new Gauge({
  name: "infamous_active_shipments",
  help: "Number of active shipments by status",
  labelNames: ["tenant_id", "status"],
  registers: [metricsRegistry],
});

export const shipmentsCreatedTotal = new Counter({
  name: "infamous_shipments_created_total",
  help: "Total shipments created",
  labelNames: ["tenant_id", "service_type"],
  registers: [metricsRegistry],
});

// ── Queue Metrics ─────────────────────────────────────────────────────────────

export const queueDepth = new Gauge({
  name: "infamous_queue_depth",
  help: "Number of jobs waiting in each queue",
  labelNames: ["queue_name"],
  registers: [metricsRegistry],
});

export const jobProcessingDuration = new Histogram({
  name: "infamous_job_processing_duration_seconds",
  help: "Job processing duration in seconds",
  labelNames: ["queue_name", "job_type", "status"],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [metricsRegistry],
});

export const jobsTotal = new Counter({
  name: "infamous_jobs_total",
  help: "Total jobs processed",
  labelNames: ["queue_name", "job_type", "status"],
  registers: [metricsRegistry],
});

// ── Cache Metrics ─────────────────────────────────────────────────────────────

export const cacheOperations = new Counter({
  name: "infamous_cache_operations_total",
  help: "Cache hit/miss counts",
  labelNames: ["operation", "result"], // operation: get/set, result: hit/miss
  registers: [metricsRegistry],
});

// ── Webhook Metrics ───────────────────────────────────────────────────────────

export const webhookDeliveries = new Counter({
  name: "infamous_webhook_deliveries_total",
  help: "Webhook delivery outcomes",
  labelNames: ["status", "attempt"], // status: success/failure
  registers: [metricsRegistry],
});

export const webhookDeliveryDuration = new Histogram({
  name: "infamous_webhook_delivery_duration_seconds",
  help: "Webhook delivery duration",
  buckets: [0.1, 0.5, 1, 5, 10],
  registers: [metricsRegistry],
});

// ── Rate Shopping Metrics ─────────────────────────────────────────────────────

export const rateShopDuration = new Histogram({
  name: "infamous_rate_shop_duration_seconds",
  help: "Rate shopping response time",
  labelNames: ["cache_hit"],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

export const rateShopCarrierErrors = new Counter({
  name: "infamous_rate_shop_carrier_errors_total",
  help: "Carrier API errors during rate shopping",
  labelNames: ["carrier_id"],
  registers: [metricsRegistry],
});

// ── DB Query Metrics ──────────────────────────────────────────────────────────

export const dbQueryDuration = new Summary({
  name: "infamous_db_query_duration_seconds",
  help: "Prisma query duration",
  labelNames: ["model", "operation"],
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [metricsRegistry],
});

// ── Express metrics endpoint ──────────────────────────────────────────────────

export async function metricsEndpoint(_req: Request, res: Response): Promise<void> {
  res.set("Content-Type", metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
}

// ── HTTP instrumentation middleware ──────────────────────────────────────────

export function metricsMiddleware(req: Request, res: Response, next: () => void): void {
  if (req.path === "/metrics" || req.path === "/health") {
    next();
    return;
  }

  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    // Normalize route to avoid high cardinality (e.g. /shipments/:id → /shipments/{id})
    const route = normalizeRoute(req.route?.path ?? req.path);
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    end(labels);
    httpRequestsTotal.inc(labels);
  });

  next();
}

function normalizeRoute(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27}/g, "/{uuid}")
    .replace(/\/[0-9]+/g, "/{id}")
    .replace(/\/:[\w]+/g, "/{param}");
}