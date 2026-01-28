import React from "react";

type NeuralBackgroundProps = {
  className?: string;
};

export default function NeuralBackground({ className }: NeuralBackgroundProps) {
  return (
    <div className={`neural-background ${className ?? ""}`.trim()} aria-hidden>
      <svg viewBox="0 0 800 500" role="presentation" aria-hidden="true">
        <path
          className="neural-line"
          d="M40 440 Q220 280 320 320 T520 260 T760 120"
        />
        <path
          className="neural-line"
          d="M20 80 Q180 200 300 140 T520 180 T780 40"
        />
        <path
          className="neural-line"
          d="M60 260 Q240 120 360 200 T600 220 T760 360"
        />
      </svg>
    </div>
  );
}
