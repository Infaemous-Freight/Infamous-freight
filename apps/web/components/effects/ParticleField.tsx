import React from "react";

const PARTICLES = [
  { left: "12%", top: "68%", delay: "0s", size: 3 },
  { left: "22%", top: "30%", delay: "1s", size: 4 },
  { left: "34%", top: "50%", delay: "2s", size: 2 },
  { left: "46%", top: "22%", delay: "0.5s", size: 3 },
  { left: "58%", top: "70%", delay: "1.5s", size: 4 },
  { left: "70%", top: "38%", delay: "2.5s", size: 3 },
  { left: "82%", top: "58%", delay: "0.8s", size: 2 },
  { left: "90%", top: "26%", delay: "1.2s", size: 4 },
  { left: "15%", top: "15%", delay: "2.8s", size: 3 },
  { left: "55%", top: "12%", delay: "3s", size: 2 },
];

type ParticleFieldProps = {
  className?: string;
};

export default function ParticleField({ className }: ParticleFieldProps) {
  return (
    <div className={`particle-field ${className ?? ""}`.trim()} aria-hidden>
      {PARTICLES.map((particle, index) => (
        <span
          key={`${particle.left}-${particle.top}-${index}`}
          className="particle"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.delay,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
        />
      ))}
    </div>
  );
}
