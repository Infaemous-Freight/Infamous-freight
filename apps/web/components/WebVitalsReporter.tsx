"use client";

import { useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";
import * as Sentry from "@sentry/nextjs";

type Rating = "good" | "needs-improvement" | "poor";

type Thresholds = { needsImprovement: number; poor: number };

// Standard Core Web Vitals thresholds (web.dev).
const THRESHOLDS: Record<string, Thresholds> = {
  LCP: { needsImprovement: 2500, poor: 4000 },
  INP: { needsImprovement: 200, poor: 500 },
  FID: { needsImprovement: 100, poor: 300 },
  CLS: { needsImprovement: 0.1, poor: 0.25 },
  TTFB: { needsImprovement: 800, poor: 1800 },
  FCP: { needsImprovement: 1800, poor: 3000 },
};

function rate(name: string, value: number): Rating {
  const t = THRESHOLDS[name];
  if (!t) return "good";
  if (value >= t.poor) return "poor";
  if (value >= t.needsImprovement) return "needs-improvement";
  return "good";
}

type VitalSample = {
  name: string;
  value: number;
  rating: Rating;
  id: string;
  path: string;
  navigationType?: string;
  ts: number;
};

// Keep the last few samples in-session for the dashboard-health panel.
const BUFFER_KEY = "__ifWebVitals";
const BUFFER_LIMIT = 30;

function pushToBuffer(sample: VitalSample) {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, VitalSample[] | undefined>;
  const buf = w[BUFFER_KEY] ?? [];
  buf.push(sample);
  if (buf.length > BUFFER_LIMIT) buf.splice(0, buf.length - BUFFER_LIMIT);
  w[BUFFER_KEY] = buf;
  try {
    window.dispatchEvent(new CustomEvent("web-vital", { detail: sample }));
  } catch {
    /* no-op */
  }
}

function sendBeacon(sample: VitalSample) {
  if (typeof navigator === "undefined") return;
  const body = JSON.stringify(sample);
  const url = "/api/metrics/vitals";
  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    void fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* swallow — monitoring must never break the page */
  }
}

export default function WebVitalsReporter() {
  const hasInit = useRef(false);

  useReportWebVitals((metric) => {
    const value = typeof metric.value === "number" ? metric.value : 0;
    const sample: VitalSample = {
      name: metric.name,
      value,
      rating: rate(metric.name, value),
      id: metric.id,
      path: typeof window !== "undefined" ? window.location.pathname : "unknown",
      navigationType: (metric as unknown as { navigationType?: string }).navigationType,
      ts: Date.now(),
    };

    pushToBuffer(sample);

    try {
      Sentry.setMeasurement(
        metric.name,
        value,
        metric.name === "CLS" ? "" : "millisecond",
      );
      if (sample.rating !== "good") {
        Sentry.addBreadcrumb({
          category: "web-vital",
          level: sample.rating === "poor" ? "warning" : "info",
          message: `${metric.name} ${sample.rating} (${value.toFixed(2)})`,
          data: sample,
        });
      }
    } catch {
      /* Sentry optional */
    }

    sendBeacon(sample);
  });

  // Surface a console warning once per session for poor vitals during dev so
  // regressions are obvious when running a local preview.
  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<VitalSample>).detail;
      if (detail?.rating === "poor" && process.env.NODE_ENV !== "production") {

        console.warn(
          `[web-vital:poor] ${detail.name}=${detail.value.toFixed(2)} path=${detail.path}`,
        );
      }
    };
    window.addEventListener("web-vital", handler as EventListener);
    return () => window.removeEventListener("web-vital", handler as EventListener);
  }, []);

  return null;
}
