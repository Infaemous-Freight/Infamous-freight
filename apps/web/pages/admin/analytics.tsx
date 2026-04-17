"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ChartSkeleton = ({ height }: { height: number }) => (
  <div
    style={{
      height,
      width: "100%",
      background: "linear-gradient(90deg, #f0f0f0 0%, #e5e5e5 50%, #f0f0f0 100%)",
      borderRadius: 4,
    }}
    aria-label="Loading chart"
  />
);

const RevenueAreaChart = dynamic<Record<string, never>>(
  () => import("../../components/analytics/RevenueAreaChart").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={300} />,
  },
);

const ShipmentsBarChart = dynamic<Record<string, never>>(
  () => import("../../components/analytics/ShipmentsBarChart").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={250} />,
  },
);

const ActiveUsersLineChart = dynamic<Record<string, never>>(
  () => import("../../components/analytics/ActiveUsersLineChart").then((mod) => mod.default),
  { ssr: false, loading: () => <ChartSkeleton height={250} /> },
);

const ErrorRateLineChart = dynamic<Record<string, never>>(
  () => import("../../components/analytics/ErrorRateLineChart").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={250} />,
  },
);

const ApiLatencyAreaChart = dynamic<Record<string, never>>(
  () => import("../../components/analytics/ApiLatencyAreaChart").then((mod) => mod.default),
  { ssr: false, loading: () => <ChartSkeleton height={250} /> },
);

interface MetricData {
  timestamp: string;
  value: number;
}

interface Dashboard {
  revenue: MetricData[];
  shipments: MetricData[];
  activeUsers: MetricData[];
  errorRate: MetricData[];
  apiLatency: MetricData[];
}

export default function AnalyticsDashboard(): React.ReactElement {
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics?range=${dateRange}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
        );
        const data = await response.json();
        setDashboardData(data.data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  if (loading || !dashboardData) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h1>Analytics Dashboard</h1>

      <div style={{ marginBottom: "20px" }}>
        <label>Date Range: </label>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          marginBottom: "20px",
          borderRadius: "8px",
        }}
      >
        <h2>Revenue Trend</h2>
        <RevenueAreaChart data={dashboardData.revenue} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
          <h2>Shipments Processed</h2>
          <ShipmentsBarChart data={dashboardData.shipments} />
        </div>

        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
          <h2>Active Users</h2>
          <ActiveUsersLineChart data={dashboardData.activeUsers} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
          <h2>Error Rate (%)</h2>
          <ErrorRateLineChart data={dashboardData.errorRate} />
        </div>

        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
          <h2>API Latency (ms)</h2>
          <ApiLatencyAreaChart data={dashboardData.apiLatency} />
        </div>
      </div>
    </div>
  );
}
