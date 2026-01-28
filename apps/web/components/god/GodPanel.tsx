import React from "react";

export function GodPanel({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        god-noise relative overflow-hidden rounded-god
        border border-neural/20 bg-obsidian/70
        shadow-glowSoft backdrop-blur-xl
      "
    >
      <div className="absolute inset-0 pointer-events-none opacity-25 [background:radial-gradient(circle_at_30%_20%,rgba(255,26,26,.35),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(212,175,55,.18),transparent_55%)]" />
      {title ? (
        <header className="px-5 pt-5 pb-3">
          <h3 className="text-xs tracking-[0.12em] uppercase text-ember">{title}</h3>
        </header>
      ) : null}
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}
