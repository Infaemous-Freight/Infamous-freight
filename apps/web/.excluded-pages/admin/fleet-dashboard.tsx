"use client";

import React, { useState, useEffect } from "react";
import Map from "../components/Map";

interface Driver {
  id: string;
  name: string;
  status: "available" | "onduty" | "offduty";
  location: { lat: number; lng: number };
  activeShipments: number;
  completedToday: number;
  rating: number;
}

interface FleetStats {
  totalDrivers: number;
  activeDrivers: number;
  completedShipments: number;
  averageRating: number;
}

export default function DriverFleetDashboard() {
  type DriverFilter = "all" | "available" | "onduty";

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DriverFilter>("all");

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fleet`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await response.json();
        setDrivers(data.data.drivers);
        setStats(data.data.stats);
      } catch (error) {
        console.error("Failed to fetch fleet data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFleetData();
    const interval = setInterval(fetchFleetData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  const filteredDrivers = drivers.filter((d) => {
    if (filter === "all") return true;
    return d.status === filter;
  });

  return (
    <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h1>Driver Fleet Management</h1>

      {/* Stats Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <StatCard label="Total Drivers" value={stats?.totalDrivers} icon="👥" />
        <StatCard label="Active Now" value={stats?.activeDrivers} icon="🚗" />
        <StatCard label="Shipments Completed" value={stats?.completedShipments} icon="📦" />
        <StatCard label="Avg Rating" value={stats?.averageRating.toFixed(1)} icon="⭐" />
      </div>

      {/* Filter */}
      <div style={{ marginBottom: "20px" }}>
        <label>Filter: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value as DriverFilter)}>
          <option value="all">All Drivers</option>
          <option value="available">Available</option>
          <option value="onduty">On Duty</option>
        </select>
      </div>

      {/* Map & List */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Map */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            overflow: "hidden",
            height: "500px",
          }}
        >
          <Map
            drivers={filteredDrivers}
            selectedDriver={selectedDriver}
            onSelectDriver={setSelectedDriver}
          />
        </div>

        {/* Driver List */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <h2>Drivers</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredDrivers.map((driver) => (
              <div
                key={driver.id}
                onClick={() => setSelectedDriver(driver.id)}
                style={{
                  padding: "15px",
                  border: selectedDriver === driver.id ? "2px solid #007bff" : "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: selectedDriver === driver.id ? "#f0f8ff" : "white",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{driver.name}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                  Status:{" "}
                  <span
                    style={{
                      color:
                        driver.status === "available"
                          ? "#4caf50"
                          : driver.status === "onduty"
                            ? "#ff9800"
                            : "#999",
                      fontWeight: "bold",
                    }}
                  >
                    {driver.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", marginTop: "5px" }}>
                  Active: {driver.activeShipments} | Today: {driver.completedToday}
                </div>
                <div style={{ fontSize: "12px", color: "#ffb300" }}>
                  ⭐ {driver.rating.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value?: number; icon: string }) {
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
      <div style={{ fontSize: "28px", fontWeight: "bold", color: "#333" }}>{value}</div>
    </div>
  );
}
