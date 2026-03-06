import type { ShipmentTelemetry } from "./types";

export function minutesLate(t: ShipmentTelemetry): number | null {
  if (!t.etaMs) return null;
  const diff = t.nowMs - t.etaMs;
  if (diff <= 0) return 0;
  return Math.floor(diff / 60000);
}
