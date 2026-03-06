export interface ShipmentTelemetry {
  shipmentId: string;
  status: string;
  etaMs?: number;
  nowMs: number;
  lastPingMs?: number;
}

export type AlertSeverity = "NONE" | "ALERT" | "CRITICAL";

export interface AlertResult {
  severity: AlertSeverity;
  message?: string;
}

export interface AlertsDeps {
  getShipmentTelemetry?: () => Promise<ShipmentTelemetry[]>;
}
