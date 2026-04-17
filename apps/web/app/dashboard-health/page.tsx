"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";

type Rating = "good" | "needs-improvement" | "poor";

type VitalSample = {
  name: string;
  value: number;
  rating: Rating;
  id: string;
  path: string;
  navigationType?: string;
  ts: number;
};

type Summary = { name: string; count: number; p75: number; worstRating: Rating };

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx] ?? 0;
}

function worstRating(samples: VitalSample[]): Rating {
  if (samples.some((s) => s.rating === "poor")) return "poor";
  if (samples.some((s) => s.rating === "needs-improvement")) return "needs-improvement";
  return "good";
}

function ratingColor(rating: Rating): string {
  if (rating === "poor") return "#b91c1c";
  if (rating === "needs-improvement") return "#b45309";
  return "#15803d";
}

function formatValue(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  return `${value.toFixed(0)} ms`;
}

export default function DashboardHealthPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    const read = () => {
      const buf =
        (window as unknown as { __ifWebVitals?: VitalSample[] }).__ifWebVitals ?? [];
      const byName = new Map<string, VitalSample[]>();
      for (const s of buf) {
        const arr = byName.get(s.name) ?? [];
        arr.push(s);
        byName.set(s.name, arr);
      }
      const next: Summary[] = [];
      for (const [name, samples] of byName.entries()) {
        next.push({
          name,
          count: samples.length,
          p75: percentile(
            samples.map((s) => s.value),
            75,
          ),
          worstRating: worstRating(samples),
        });
      }
      next.sort((a, b) => a.name.localeCompare(b.name));
      setSummaries(next);
      setLastUpdate(Date.now());
    };

    read();
    const interval = window.setInterval(read, 2000);
    const onEvent = () => read();
    window.addEventListener("web-vital", onEvent);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("web-vital", onEvent);
    };
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Dashboard Health</h1>
      <p>Firebase Auth initialized: {auth ? "yes" : "no"}</p>
      <p>Firestore initialized: {db ? "yes" : "no"}</p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Web Vitals — this session</h2>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#475569" }}>
          Live samples from the current browser session. Aggregated dashboards live in
          Sentry (Performance) and Netlify function logs (filter <code>tag=web-vital</code>).
        </p>
        {summaries.length === 0 ? (
          <p style={{ fontSize: 14 }}>
            No samples yet. Navigate the app for a few seconds, then refresh this panel.
          </p>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 520 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #e2e8f0" }}>
                  Metric
                </th>
                <th style={{ textAlign: "right", padding: 6, borderBottom: "1px solid #e2e8f0" }}>
                  p75
                </th>
                <th style={{ textAlign: "right", padding: 6, borderBottom: "1px solid #e2e8f0" }}>
                  Samples
                </th>
                <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #e2e8f0" }}>
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.name}>
                  <td style={{ padding: 6 }}>{s.name}</td>
                  <td style={{ padding: 6, textAlign: "right" }}>{formatValue(s.name, s.p75)}</td>
                  <td style={{ padding: 6, textAlign: "right" }}>{s.count}</td>
                  <td style={{ padding: 6, color: ratingColor(s.worstRating) }}>
                    {s.worstRating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {lastUpdate ? (
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        ) : null}
      </section>

      <ul style={{ marginTop: 24 }}>
        <li><Link href="/">Homepage</Link></li>
        <li><Link href="/status">Status</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/login">Login</Link></li>
        <li><Link href="/driver">Driver</Link></li>
      </ul>
    </main>
  );
}
