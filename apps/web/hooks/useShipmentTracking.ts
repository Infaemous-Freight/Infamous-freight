import { useEffect, useRef, useState } from "react";
import { SocketClient, ShipmentUpdate, VehicleUpdate, Notification } from "../lib/socketClient";

type TrackingState = {
  connected: boolean;
  shipmentUpdate: ShipmentUpdate | null;
  vehicleUpdate: VehicleUpdate | null;
  notifications: Notification[];
};

/**
 * React hook for real-time shipment tracking via WebSocket.
 *
 * @param token  - JWT access token for WebSocket authentication
 * @param shipmentId - Shipment ID to subscribe to (optional)
 * @param vehicleId  - Vehicle ID to subscribe to (optional)
 */
export function useShipmentTracking(
  token: string | null,
  shipmentId?: string,
  vehicleId?: string,
): TrackingState & { clearNotifications: () => void } {
  const clientRef = useRef<SocketClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [shipmentUpdate, setShipmentUpdate] = useState<ShipmentUpdate | null>(null);
  const [vehicleUpdate, setVehicleUpdate] = useState<VehicleUpdate | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Connect / disconnect when token changes
  useEffect(() => {
    if (!token) return;

    const client = new SocketClient(token);
    clientRef.current = client;

    client.connect({
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onShipmentUpdate: (update) => setShipmentUpdate(update),
      onVehicleUpdate: (update) => setVehicleUpdate(update),
      onNotification: (notification) =>
        setNotifications((prev) => [notification, ...prev].slice(0, 50)),
    });

    return () => {
      client.disconnect();
      clientRef.current = null;
      setConnected(false);
    };
  }, [token]);

  // Subscribe / unsubscribe when connected or tracked IDs change
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connected) return;

    if (shipmentId) client.subscribeShipment(shipmentId);
    if (vehicleId) client.subscribeVehicle(vehicleId);

    return () => {
      if (shipmentId) client.unsubscribeShipment(shipmentId);
      if (vehicleId) client.unsubscribeVehicle(vehicleId);
    };
  }, [connected, shipmentId, vehicleId]);

  const clearNotifications = () => setNotifications([]);

  return { connected, shipmentUpdate, vehicleUpdate, notifications, clearNotifications };
}
