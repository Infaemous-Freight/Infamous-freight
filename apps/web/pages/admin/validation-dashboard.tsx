/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Automated Validation Dashboard - Real-time 72-hour monitoring
 */

import { useState, useEffect } from "react";
import Head from "next/head";

interface ValidationMetrics {
  hour: number;
  timestamp: string;
  api_response_time_ms: number;
  total_requests: number;
  error_count: number;
  cache_hit_rate: number;
  db_query_time_ms: number;
  active_users: number;
}

interface Anomaly {
  hour: number;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  metric_value: number;
  threshold: number;
}

interface ValidationStatus {
  started_at: string;
  hours_elapsed: number;
  hours_remaining: number;
  progress_percentage: number;
  status: "in-progress" | "complete" | "paused";
  baseline: ValidationMetrics;
  latest: ValidationMetrics;
  anomalies: Anomaly[];
}

export default function ValidationDashboard(): React.ReactElement {
  const [status, setStatus] = useState<ValidationStatus | null>(null);
  const [metrics, setMetrics] = useState<ValidationMetrics[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchValidationStatus();
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchValidationStatus();
        fetchMetrics();
      }, 60000); // Refresh every minute

      return () => clearInterval(interval);
    }

    return undefined;
  }, [autoRefresh]);

  const fetchValidationStatus = async () => {
    try {
      const res = await fetch("/api/validation/status");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
       
      console.error("Failed to fetch validation status:", err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/validation/metrics");
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
       
      console.error("Failed to fetch metrics:", err);
    }
  };

  const startValidation = async () => {
    try {
      await fetch("/api/validation/start", { method: "POST" });
      fetchValidationStatus();
    } catch (err) {
       
      console.error("Failed to start validation:", err);
    }
  };

  const calculateAverage = (field: keyof ValidationMetrics): number => {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + (m[field] as number), 0);
    return sum / metrics.length;
  };

  const getStatusColor = (value: number, threshold: number, inverse = false) => {
    const passed = inverse ? value < threshold : value > threshold;
    return passed ? "text-green-600" : "text-red-600";
  };

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">72-Hour Validation Dashboard</h1>
          <button
            onClick={startValidation}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Start Validation
          </button>
        </div>
      </div>
    );
  }

  const avgResponseTime = calculateAverage("api_response_time_ms");
  const totalRequests = metrics.reduce((sum, m) => sum + m.total_requests, 0);
  const totalErrors = metrics.reduce((sum, m) => sum + m.error_count, 0);
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  const avgCacheHit = calculateAverage("cache_hit_rate") * 100;

  return (
    <>
      <Head>
        <title>72-Hour Validation Dashboard | Infæmous Freight</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  🔍 72-Hour Validation Dashboard
                </h1>
                <p className="text-gray-600 mt-2">
                  Real-time monitoring of Track 1 validation requirements
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-4xl font-bold ${
                    status.status === "complete"
                      ? "text-green-600"
                      : status.status === "paused"
                        ? "text-yellow-600"
                        : "text-blue-600"
                  }`}
                >
                  {status.progress_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">{status.hours_elapsed} of 72 hours</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${status.progress_percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Started: {new Date(status.started_at).toLocaleString()}</span>
                <span>{status.hours_remaining}h remaining</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Response Time */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Avg Response Time</h3>
                <span className="text-2xl">⚡</span>
              </div>
              <div className={`text-3xl font-bold ${getStatusColor(avgResponseTime, 15, true)}`}>
                {avgResponseTime.toFixed(1)}ms
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Target: &lt;15ms {avgResponseTime < 15 ? "✅" : "⚠️"}
              </div>
            </div>

            {/* Error Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Error Rate</h3>
                <span className="text-2xl">🔴</span>
              </div>
              <div className={`text-3xl font-bold ${getStatusColor(errorRate, 1, true)}`}>
                {errorRate.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Target: &lt;1% {errorRate < 1 ? "✅" : "⚠️"}
              </div>
            </div>

            {/* Cache Hit Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Cache Hit Rate</h3>
                <span className="text-2xl">📊</span>
              </div>
              <div className={`text-3xl font-bold ${getStatusColor(avgCacheHit, 80)}`}>
                {avgCacheHit.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Target: &gt;80% {avgCacheHit > 80 ? "✅" : "⚠️"}
              </div>
            </div>

            {/* Total Requests */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Requests</h3>
                <span className="text-2xl">📈</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {totalRequests.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">Over {status.hours_elapsed} hours</div>
            </div>
          </div>

          {/* Anomalies Section */}
          {status.anomalies.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                ⚠️ Detected Anomalies ({status.anomalies.length})
              </h2>
              <div className="space-y-3">
                {status.anomalies.map((anomaly, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      anomaly.severity === "critical"
                        ? "bg-red-50 border-red-600"
                        : anomaly.severity === "high"
                          ? "bg-orange-50 border-orange-600"
                          : anomaly.severity === "medium"
                            ? "bg-yellow-50 border-yellow-600"
                            : "bg-blue-50 border-blue-600"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">
                          Hour {anomaly.hour}: {anomaly.type}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">{anomaly.message}</div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Value: {anomaly.metric_value} (Threshold: {anomaly.threshold})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Performance Trends</h2>
            <div className="h-64 flex items-end space-x-1">
              {metrics.slice(-24).map((metric, idx) => {
                const height = (metric.api_response_time_ms / 30) * 100; // Scale to 30ms max
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                    style={{ height: `${Math.min(height, 100)}%` }}
                    title={`Hour ${metric.hour}: ${metric.api_response_time_ms}ms`}
                  />
                );
              })}
            </div>
            <div className="text-xs text-gray-600 mt-2 text-center">
              Last 24 hours of response time data
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Auto-refresh (every minute)</span>
                </label>
              </div>
              <div className="space-x-3">
                <button
                  onClick={fetchValidationStatus}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Refresh Now
                </button>
                {status.status === "complete" && (
                  <button
                    onClick={() =>
                      window.open("/validation-data/reports/final_validation_report.md")
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    View Final Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
