"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

      {/* Date Range Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label>Date Range: </label>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Revenue Chart */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          marginBottom: "20px",
          borderRadius: "8px",
        }}
      >
        <h2>Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dashboardData.revenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Shipments & Active Users */}
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
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardData.shipments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
          <h2>Active Users</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dashboardData.activeUsers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Error Rate & API Latency */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
          <h2>Error Rate (%)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dashboardData.errorRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#ff7c7c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
          <h2>API Latency (ms)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dashboardData.apiLatency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#8dd1e1" fill="#8dd1e1" opacity={0.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
