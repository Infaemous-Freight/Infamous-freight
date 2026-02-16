"use client";

import React, { useState, useEffect } from "react";
import Map from "../components/Map";

interface Route {
  driverId: string;
  driverName: string;
  stops: number;
  distance: number;
  estimatedTime: number;
  coordinates: Array<{ lat: number; lng: number }>;
}

export default function RouteOptimizationVisualization() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalDistance: 0,
    totalTime: 0,
    efficiency: 0,
  });

  useEffect(() => {
    const fetchOptimization = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/routes/optimize`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
        );
        const data = await response.json();
        setRoutes(data.data.routes);
        setMetrics(data.data.metrics);
      } catch (error) {
        console.error("Failed to fetch route optimization:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptimization();
  }, []);

  if (loading) return <div>Loading...</div>;

  const _currentRoute = routes.find((r) => r.driverId === selectedRoute);
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"];

  return (
    <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h1>Route Optimization Visualization</h1>

      {/* Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <MetricCard
          label="Total Distance"
          value={`${metrics.totalDistance.toFixed(0)} km`}
          icon="🛣️"
        />
        <MetricCard label="Total Time" value={`${Math.ceil(metrics.totalTime)} mins`} icon="⏱️" />
        <MetricCard label="Route Efficiency" value={`${metrics.efficiency}%`} icon="⚡" />
      </div>

      {/* Map & Routes */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Map */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            overflow: "hidden",
            height: "600px",
          }}
        >
          <Map routes={routes} selectedRoute={selectedRoute} colors={colors} />
        </div>

        {/* Route List */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <h2>Routes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {routes.map((route, idx) => (
              <div
                key={route.driverId}
                onClick={() => setSelectedRoute(route.driverId)}
                style={{
                  padding: "15px",
                  border: selectedRoute === route.driverId ? "2px solid #007bff" : "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: selectedRoute === route.driverId ? "#f0f8ff" : "white",
                  borderLeft: `4px solid ${colors[idx % colors.length]}`,
                }}
              >
                <div style={{ fontWeight: "bold" }}>{route.driverName}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                  Stops: {route.stops}
                </div>
                <div style={{ fontSize: "12px" }}>Distance: {route.distance.toFixed(1)} km</div>
                <div style={{ fontSize: "12px" }}>Time: {Math.ceil(route.estimatedTime)} min</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "32px", marginBottom: "10px" }}>{icon}</div>
      <div style={{ fontSize: "14px", color: "#666" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>{value}</div>
    </div>
  );
}
