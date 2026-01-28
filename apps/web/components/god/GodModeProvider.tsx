"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useWatcherEffect } from "./useWatcherEffect";

type GodModeState = {
  commandMode: boolean;
  setCommandMode: (v: boolean) => void;
  toggleCommandMode: () => void;
};

const Ctx = createContext<GodModeState | null>(null);

export function GodModeProvider({ children }: { children: React.ReactNode }) {
  const [commandMode, setCommandMode] = useState(false);

  useWatcherEffect();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setCommandMode((v) => !v);
      }
      if (e.key === "Escape") setCommandMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.command = commandMode ? "on" : "off";
  }, [commandMode]);

  const value = useMemo(
    () => ({ commandMode, setCommandMode, toggleCommandMode: () => setCommandMode((v) => !v) }),
    [commandMode],
  );

  return (
    <Ctx.Provider value={value}>
      <div className="watcher-bg" aria-hidden="true" />
      <div className="command-vignette" aria-hidden="true" />
      <div className="god-app-layer">{children}</div>
    </Ctx.Provider>
  );
}

export function useGodMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGodMode must be used within GodModeProvider");
  return ctx;
}
