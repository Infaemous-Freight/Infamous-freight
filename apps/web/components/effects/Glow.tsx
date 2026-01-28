import React from "react";

type GlowProps = {
  className?: string;
  children: React.ReactNode;
};

export default function Glow({ className, children }: GlowProps) {
  return <div className={`glow-frame ${className ?? ""}`.trim()}>{children}</div>;
}
