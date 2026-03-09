import type { ShipmentStatus, LoadStatus } from "@infamous/shared";

/** Badge colour variants keyed by shipment status. */
export const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  CREATED: "#6B7280",
  POSTED: "#3B82F6",
  ASSIGNED: "#8B5CF6",
  PICKED_UP: "#F59E0B",
  IN_TRANSIT: "#10B981",
  DELIVERED: "#059669",
  CANCELLED: "#EF4444",
};

/** Badge colour variants keyed by load status. */
export const LOAD_STATUS_COLORS: Record<LoadStatus, string> = {
  OPEN: "#3B82F6",
  CLAIMED: "#F59E0B",
  ASSIGNED: "#8B5CF6",
  CLOSED: "#6B7280",
};

/** The public API base URL resolved from the environment. */
export const API_BASE_URL: string =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";
