// Performance monitoring utilities
import * as Sentry from "@sentry/nextjs";

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  start(name: string): void {
    this.metrics.set(name, performance.now());
  }

  end(name: string, metadata?: Record<string, unknown>): PerformanceMetric | null {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      console.warn(`Performance metric "${name}" was never started`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    // Send to Sentry for analysis
    Sentry.addBreadcrumb({
      category: "performance",
      message: `${name}: ${duration.toFixed(2)}ms`,
      level: "info",
      data: metadata,
    });

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }

    return metric;
  }

  measure<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
    this.start(name);
    try {
      const result = fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Web Vitals tracking
export function trackWebVitals(): void {
  if (typeof window === "undefined") return;

  if ("web-vital" in window.performance) {
    // Track Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metric = {
          name: entry.name,
          value: entry.startTime,
        };

        Sentry.addBreadcrumb({
          category: "web-vital",
          message: `${entry.name}: ${entry.startTime.toFixed(2)}`,
          level: "info",
          data: metric,
        });
      }
    });

    observer.observe({ entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"] });
  }
}

// API response time tracker
export async function trackApiCall<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
  return performanceMonitor.measureAsync(`api:${endpoint}`, fn, { endpoint });
}

// Page load performance
export function trackPageLoad(pageName: string): void {
  if (typeof window === "undefined") return;

  window.addEventListener("load", () => {
    const perfData = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

    if (perfData) {
      const metrics = {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        ttfb: perfData.responseStart - perfData.requestStart,
        download: perfData.responseEnd - perfData.responseStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        domComplete: perfData.domComplete - perfData.fetchStart,
        loadComplete: perfData.loadEventEnd - perfData.fetchStart,
      };

      Sentry.addBreadcrumb({
        category: "performance",
        message: `Page Load: ${pageName}`,
        level: "info",
        data: metrics,
      });

      // Log slow pages
      if (metrics.loadComplete > 3000) {
        console.warn(`Slow page load detected for ${pageName}:`, metrics);
      }
    }
  });
}
