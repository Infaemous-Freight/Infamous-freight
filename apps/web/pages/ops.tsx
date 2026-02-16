import React, { useState } from "react";
import { useRouter } from "next/router";
import { getLocaleFromRouter, t } from "../lib/i18n/t";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type WeatherPoint = {
  lat: number;
  lon: number;
  tempC?: number;
  windKph?: number;
  precipMm?: number;
  visibilityM?: number;
  summary?: string;
  source?: string;
  ts?: string;
};

type RouteSummary = {
  distanceMiles: number;
  etaHours: number;
  risk: { level: "low" | "medium" | "high"; reasons: string[] };
};

export default function Ops() {
  const router = useRouter();
  const locale = getLocaleFromRouter(router.locale);
  const [lat, setLat] = useState("35.4676");
  const [lon, setLon] = useState("-97.5164");
  const [originLat, setOriginLat] = useState("35.4676");
  const [originLon, setOriginLon] = useState("-97.5164");
  const [destLat, setDestLat] = useState("32.7767");
  const [destLon, setDestLon] = useState("-96.7970");

  const [weather, setWeather] = useState<WeatherPoint | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeWeather, setRouteWeather] = useState<{
    origin: WeatherPoint;
    destination: WeatherPoint;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function fetchWeather() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `${apiBase}/v1/satellite/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "weather fetch failed");
      }
      setWeather(data.point as WeatherPoint);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "weather fetch failed");
    } finally {
      setBusy(false);
    }
  }

  async function fetchRoute() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/v1/satellite/route-risk`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin: { lat: Number(originLat), lon: Number(originLon) },
          destination: { lat: Number(destLat), lon: Number(destLon) },
          avgSpeedMph: 55,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "route-risk failed");
      }
      setRouteSummary(data.summary as RouteSummary);
      setRouteWeather(data.weather as { origin: WeatherPoint; destination: WeatherPoint });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "route-risk failed");
    } finally {
      setBusy(false);
    }
  }

  const card: React.CSSProperties = {
    borderRadius: 16,
    border: "1px solid rgba(200,0,0,0.35)",
    background: "linear-gradient(135deg, rgba(255,0,0,0.06), rgba(90,0,0,0.06))",
    padding: 18,
    boxShadow: "0 12px 40px rgba(120,0,0,0.08)",
  };

  const input: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(200,0,0,0.35)",
    width: 140,
    background: "rgba(255,255,255,0.85)",
    color: "#2a0a0a",
  };

  const button: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(200,0,0,0.55)",
    background: "rgba(255,0,0,0.12)",
    color: "#3a0a0a",
    cursor: busy ? "wait" : "pointer",
  };

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 28,
        fontFamily: '"Space Grotesk", "Segoe UI", system-ui, sans-serif',
        background:
          "radial-gradient(circle at 10% 20%, rgba(255,0,0,0.05), transparent 25%), radial-gradient(circle at 90% 10%, rgba(255,0,0,0.08), transparent 25%)",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0, color: "rgb(170,0,0)" }}>{t(locale, "ops.title")}</h1>
        <span style={{ color: "#5a1a1a", opacity: 0.8 }}>
          {t(locale, "ops.subtitle")} (Open-Meteo by default)
        </span>
      </header>

      {err && (
        <div
          style={{
            ...card,
            border: "1px solid rgba(255,0,0,0.5)",
            background: "rgba(255,0,0,0.08)",
            marginTop: 14,
            color: "#4d0f0f",
          }}
        >
          <strong style={{ color: "rgb(170,0,0)" }}>Error:</strong> {err}
          <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
            Ensure the API is running and /v1/satellite is mounted.
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        <section style={card}>
          <h2 style={{ marginTop: 0, color: "#5a1a1a" }}>Weather at Coordinates</h2>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <label style={{ color: "#4a0f0f" }}>
              Lat
              <input style={input} value={lat} onChange={(e) => setLat(e.target.value)} />
            </label>
            <label style={{ color: "#4a0f0f" }}>
              Lon
              <input style={input} value={lon} onChange={(e) => setLon(e.target.value)} />
            </label>
            <button style={button} onClick={fetchWeather} disabled={busy}>
              Fetch Weather
            </button>
          </div>
          {weather ? (
            <pre
              style={{
                marginTop: 12,
                whiteSpace: "pre-wrap",
                fontSize: 12,
                opacity: 0.9,
                background: "rgba(255,255,255,0.75)",
                padding: 12,
                borderRadius: 12,
              }}
            >
              {JSON.stringify(weather, null, 2)}
            </pre>
          ) : (
            <div style={{ marginTop: 12, opacity: 0.75, color: "#4a0f0f" }}>
              No weather data yet.
            </div>
          )}
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0, color: "#5a1a1a" }}>Route Risk (Origin → Destination)</h2>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <label style={{ color: "#4a0f0f" }}>
              O Lat
              <input
                style={input}
                value={originLat}
                onChange={(e) => setOriginLat(e.target.value)}
              />
            </label>
            <label style={{ color: "#4a0f0f" }}>
              O Lon
              <input
                style={input}
                value={originLon}
                onChange={(e) => setOriginLon(e.target.value)}
              />
            </label>
            <label style={{ color: "#4a0f0f" }}>
              D Lat
              <input style={input} value={destLat} onChange={(e) => setDestLat(e.target.value)} />
            </label>
            <label style={{ color: "#4a0f0f" }}>
              D Lon
              <input style={input} value={destLon} onChange={(e) => setDestLon(e.target.value)} />
            </label>
            <button style={button} onClick={fetchRoute} disabled={busy}>
              Compute Risk
            </button>
          </div>
          {routeSummary ? (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 10,
                  alignItems: "center",
                  background: "rgba(255,255,255,0.78)",
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Distance</div>
                  <div style={{ fontWeight: 600, color: "#3b0a0a" }}>
                    {routeSummary.distanceMiles} mi
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>ETA</div>
                  <div style={{ fontWeight: 600, color: "#3b0a0a" }}>
                    {routeSummary.etaHours} hours
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Risk</div>
                  <div style={{ fontWeight: 700, color: "#3b0a0a" }}>
                    {routeSummary.risk.level.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Reasons</div>
                  <div style={{ fontWeight: 500, color: "#3b0a0a" }}>
                    {routeSummary.risk.reasons.length
                      ? routeSummary.risk.reasons.join(" • ")
                      : "clear"}
                  </div>
                </div>
              </div>
              {routeWeather && (
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: 12,
                    opacity: 0.9,
                    background: "rgba(255,255,255,0.75)",
                    padding: 12,
                    borderRadius: 12,
                  }}
                >
                  {JSON.stringify(routeWeather, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 12, opacity: 0.75, color: "#4a0f0f" }}>
              No route risk computed yet.
            </div>
          )}
        </section>
      </div>

      <div style={{ marginTop: 14, opacity: 0.75, fontSize: 12, color: "#4a0f0f" }}>
        Next: plug in traffic (HERE/Google), telematics, and imagery providers behind the same API
        surface.
      </div>
    </main>
  );
}
