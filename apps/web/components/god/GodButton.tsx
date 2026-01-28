import React from "react";
import clsx from "clsx";

export function GodButton({
  children,
  variant = "neural",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "neural" | "gold";
}) {
  const base =
    "relative rounded-god px-5 py-3 uppercase text-sm tracking-[0.08em] transition-all duration-300 ease-god focus:outline-none focus:ring-2";
  const neural =
    "bg-carbon/60 border border-neural/25 text-white shadow-glowSoft hover:shadow-glowMed hover:border-neural/45 focus:ring-neural/40 animate-idlePulse";
  const gold =
    "bg-carbon/60 border border-gold/35 text-gold shadow-[0_0_18px_rgba(212,175,55,.22)] hover:shadow-[0_0_34px_rgba(212,175,55,.35)] hover:border-gold/55 focus:ring-gold/40";

  return (
    <button
      {...props}
      className={clsx(base, variant === "gold" ? gold : neural, className)}
    >
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 ease-god [background:radial-gradient(circle_at_50%_50%,rgba(255,26,26,.22),transparent_60%)]" />
    </button>
  );
}
