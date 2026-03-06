import { minutesLate } from "./eta";
import type { AlertResult, ShipmentTelemetry } from "./types";

export function evaluateShipmentAlert(t: ShipmentTelemetry): AlertResult {
  if (t.lastPingMs != null) {
    const mins = Math.floor((t.nowMs - t.lastPingMs) / 60000);
    if (mins >= 60) return { severity: "CRITICAL", message: `No GPS ping for ${mins} minutes` };
    if (mins >= 20) return { severity: "ALERT", message: `GPS ping delayed (${mins} minutes)` };
  }

  const late = minutesLate(t);
  if (late == null) return { severity: "NONE" };
  if (late >= 120) return { severity: "CRITICAL", message: `Shipment is ${late} minutes late` };
  if (late >= 30) return { severity: "ALERT", message: `Shipment is ${late} minutes late` };
  return { severity: "NONE" };
}

export function worstAlert(telemetry: ShipmentTelemetry[]): AlertResult {
  let best: AlertResult = { severity: "NONE" };
  for (const t of telemetry) {
    const r = evaluateShipmentAlert(t);
    if (r.severity === "CRITICAL") return r;
    if (r.severity === "ALERT") best = r;
  }
  return best;
}
