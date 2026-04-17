import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Rating = "good" | "needs-improvement" | "poor";

type VitalPayload = {
  name: string;
  value: number;
  rating: Rating;
  id: string;
  path: string;
  navigationType?: string;
  ts: number;
};

const ALLOWED_METRICS = new Set(["LCP", "INP", "FID", "CLS", "TTFB", "FCP"]);
const MAX_VALUE = 60_000; // clamp absurd values (>60s) — likely bogus

function parsePayload(raw: unknown): VitalPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name : "";
  const value = typeof r.value === "number" ? r.value : NaN;
  const rating = typeof r.rating === "string" ? r.rating : "";
  const id = typeof r.id === "string" ? r.id : "";
  const path = typeof r.path === "string" ? r.path.slice(0, 256) : "";
  if (!ALLOWED_METRICS.has(name)) return null;
  if (!Number.isFinite(value) || value < 0 || value > MAX_VALUE) return null;
  if (rating !== "good" && rating !== "needs-improvement" && rating !== "poor") return null;
  if (!id) return null;
  return {
    name,
    value,
    rating: rating as Rating,
    id,
    path,
    navigationType:
      typeof r.navigationType === "string" ? r.navigationType.slice(0, 32) : undefined,
    ts: typeof r.ts === "number" ? r.ts : Date.now(),
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const sample = parsePayload(body);
  if (!sample) {
    return new NextResponse(null, { status: 204 });
  }

  // Structured log line — greppable in Netlify function logs and easy to pipe
  // into log-based alerting. Keep the shape stable; consumers may rely on it.
  const line = {
    tag: "web-vital",
    name: sample.name,
    value: Number(sample.value.toFixed(2)),
    rating: sample.rating,
    path: sample.path,
    nav: sample.navigationType,
    ts: sample.ts,
    env: process.env.NEXT_RUNTIME_ENV || process.env.NODE_ENV || "unknown",
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
  };

  if (sample.rating === "poor") {
    console.warn(JSON.stringify({ level: "warn", ...line }));
  } else {
    console.info(JSON.stringify({ level: "info", ...line }));
  }

  return new NextResponse(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "web-vitals beacon",
      method: "POST",
      accepted: Array.from(ALLOWED_METRICS),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
