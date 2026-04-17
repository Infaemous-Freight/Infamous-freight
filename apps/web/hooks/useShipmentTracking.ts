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

    let cancelled = false;

    const fetchShipment = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(`${apiUrl}/api/shipments/${shipmentId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch shipment");
        }

        const data = await response.json();
        if (cancelled) return;

        if (data.success && data.data) {
          setShipmentData(data.data);
          setTrackingStatus((prev) => ({
            loading: false,
            error: null,
            connected: prev.connected,
          }));
        } else {
          throw new Error(data.message || "Invalid response");
        }
      } catch (error) {
        if (cancelled) return;
        console.error("[ShipmentTracking] Failed to fetch shipment:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setTrackingStatus((prev) => ({
          loading: false,
          error: errorMessage,
          connected: prev.connected,
        }));
      }
    };

    fetchShipment();

    return () => {
      cancelled = true;
    };
    // Intentionally only depends on shipmentId. Socket connect/disconnect
    // cycles should not trigger a refetch — real-time updates flow through
    // the subscription effect below.
  }, [shipmentId]);

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
      const safeUpdate =
        update && typeof update === "object" ? (update as Partial<ShipmentData>) : {};

      setShipmentData((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          ...safeUpdate,
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
