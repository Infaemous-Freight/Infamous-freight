import React from "react";

type UsageRingProps = {
  used: number;
  included: number;
};

export function UsageRing({ used, included }: UsageRingProps) {
  const safeIncluded = included > 0 ? included : 1;
  const ratio = Math.max(0, used / safeIncluded);
  const cappedRatio = Math.min(ratio, 1);

  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - cappedRatio);

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ratio > 1 ? "#f97316" : "#ffffff"}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black">{used}</div>
          <div className="text-xs uppercase tracking-wide text-white/60">of {included}</div>
        </div>
      </div>
    </div>
  );
}
