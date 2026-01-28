"use client";

import { useEffect, useState } from "react";

export function useWatcherEffect() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.45 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
      const y = Math.min(1, Math.max(0, e.clientY / window.innerHeight));
      setPos({ x, y });
      document.documentElement.style.setProperty("--watch-x", String(x));
      document.documentElement.style.setProperty("--watch-y", String(y));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return pos;
}
