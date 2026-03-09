import type { ShipmentStatus, LoadStatus } from "@infamous/shared";

/** Colour values keyed by shipment status (React Native compatible). */
export const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  CREATED: "#6B7280",
  POSTED: "#3B82F6",
  ASSIGNED: "#8B5CF6",
  PICKED_UP: "#F59E0B",
  IN_TRANSIT: "#10B981",
  DELIVERED: "#059669",
  CANCELLED: "#EF4444",
};

/** Colour values keyed by load status (React Native compatible). */
export const LOAD_STATUS_COLORS: Record<LoadStatus, string> = {
  OPEN: "#3B82F6",
  CLAIMED: "#F59E0B",
  ASSIGNED: "#8B5CF6",
  CLOSED: "#6B7280",
};

/** The API base URL resolved from Expo config / environment. */
export const API_BASE_URL: string =
  process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3001";
