/**
 * Shipment Tracking Hook - Phase 6 Tier 2.1
 *
 * React hook for real-time shipment tracking
 * Usage: const { shipment, location, status } = useShipmentTracking(shipmentId);
 */

import { useEffect, useState } from "react";
import { useWebSocket } from "../lib/useWebSocket";

interface ShipmentData {
  id: string;
  status: string;
  location?: {
    lat: number;
    lng: number;
  };
  estimatedDelivery?: string;
  driver?: {
    id: string;
    name: string;
  };
  lastUpdate?: string;
}

interface ShipmentTrackingStatus {
  loading: boolean;
  error: string | null;
  connected: boolean;
}

export function useShipmentTracking(shipmentId: string, userId?: string) {
  const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<ShipmentTrackingStatus>({
    loading: true,
    error: null,
    connected: false,
  });

  const { socket, status, subscribeToShipment } = useWebSocket({ userId });

  // Fetch initial shipment data
  useEffect(() => {
    if (!shipmentId) {
      return;
    }

    const fetchShipment = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(`${apiUrl}/api/shipments/${shipmentId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch shipment");
        }

        const data = await response.json();

        if (data.success && data.data) {
          setShipmentData(data.data);
          setTrackingStatus({
            loading: false,
            error: null,
            connected: status.connected,
          });
        } else {
          throw new Error(data.message || "Invalid response");
        }
      } catch (error) {
        console.error("[ShipmentTracking] Failed to fetch shipment:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setTrackingStatus({
          loading: false,
          error: errorMessage,
          connected: status.connected,
        });
      }
    };

    fetchShipment();
  }, [shipmentId, status.connected]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!shipmentId || !socket) {
      return;
    }

    setTrackingStatus((prev) => ({
      ...prev,
      connected: status.connected,
    }));

    const unsubscribe = subscribeToShipment(shipmentId, (update) => {
      console.log("[ShipmentTracking] Received update:", update);

      setShipmentData((prev) => {
        if (!prev) return prev;

        const patch =
          update && typeof update === "object"
            ? (update as Record<string, unknown>)
            : {};

        return {
          ...prev,
          ...patch,
          lastUpdate: new Date().toISOString(),
        };
      });
    });

    return unsubscribe;
  }, [shipmentId, socket, status.connected, subscribeToShipment]);

  // Refresh shipment data manually
  const refresh = async () => {
    setTrackingStatus((prev) => ({ ...prev, loading: true }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/shipments/${shipmentId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setShipmentData(data.data);
        setTrackingStatus({
          loading: false,
          error: null,
          connected: status.connected,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setTrackingStatus({
        loading: false,
        error: errorMessage,
        connected: status.connected,
      });
    }
  };

  return {
    shipment: shipmentData,
    status: trackingStatus,
    refresh,
  };
}

export default useShipmentTracking;
