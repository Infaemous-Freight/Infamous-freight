import React from "react";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function UsageRing({ used, included }: { used: number; included: number }) {
  const pct = included <= 0 ? 0 : used / included;
  const pctClamped = clamp(pct, 0, 2);
  const radius = 46;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * pctClamped;

  const label =
    pct < 0.8 ? "Healthy" : pct < 1 ? "Approaching limit" : pct < 2 ? "Overage" : "Hard cap";

  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="58"
          textAnchor="middle"
          className="fill-white"
          fontSize="16"
          fontWeight="700"
        >
          {Math.round(pct * 100)}%
        </text>
        <text x="60" y="78" textAnchor="middle" className="fill-white/70" fontSize="11">
          {used}/{included}
        </text>
      </svg>

      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-white/70">
          Included: {included.toLocaleString()} • Used: {used.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
