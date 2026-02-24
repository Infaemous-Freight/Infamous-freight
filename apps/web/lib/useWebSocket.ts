/**
 * WebSocket Client Hook - Phase 6 Tier 2.1
 *
 * React hook for real-time WebSocket connections
 * Usage: const socket = useWebSocket({ userId: '123' });
 */

import { useEffect, useState, useRef, useCallback } from "react";

type Socket = unknown; // Will be socket.io Socket when package is installed

// Placeholder for socket.io when not installed
const io = (url: string, options?: unknown): Socket => {
  console.warn("socket.io-client not installed");
  return {} as Socket;
};

interface UseWebSocketOptions {
  userId?: string;
  role?: string;
  autoConnect?: boolean;
  namespace?: string;
}

interface WebSocketStatus {
  connected: boolean;
  error: string | null;
  transport: string | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { userId, role, autoConnect = true, namespace = "/" } = options;

  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    error: null,
    transport: null,
  });

  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const socketUrl = apiUrl.replace("/api", "");

    // Create socket connection
    const socket = io(`${socketUrl}${namespace}`, {
      transports: ["websocket", "polling"],
      query: {
        userId: userId || "",
        role: role || "",
      },
      auth: {
        userId: userId || "",
        role: role || "",
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socket.on("connect", () => {
      console.log("[WebSocket] Connected:", socket.id);
      setStatus({
        connected: true,
        error: null,
        transport: socket.io.engine.transport.name,
      });
    });

    socket.on("connected", (data) => {
      console.log("[WebSocket] Server confirmation:", data);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WebSocket] Disconnected:", reason);
      setStatus({
        connected: false,
        error: reason,
        transport: null,
      });
    });

    socket.on("connect_error", (error) => {
      console.error("[WebSocket] Connection error:", error.message);
      setStatus({
        connected: false,
        error: error.message,
        transport: null,
      });
    });

    socket.on("error", (error) => {
      console.error("[WebSocket] Error:", error);
      setStatus((prev) => ({
        ...prev,
        error: error.message || "Unknown error",
      }));
    });

    // Transport change tracking
    socket.io.engine.on("upgrade", (transport) => {
      console.log("[WebSocket] Transport upgraded to:", transport.name);
      setStatus((prev) => ({
        ...prev,
        transport: transport.name,
      }));
    });

    socketRef.current = socket;

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, role, autoConnect, namespace]);

  // Subscribe to shipment updates
  const subscribeToShipment = useCallback(
    (shipmentId: string, callback: (data: unknown) => void) => {
      if (!socketRef.current) {
        console.warn("[WebSocket] Socket not initialized");
        return () => {};
      }

      const socket = socketRef.current;

      // Subscribe
      socket.emit("subscribe:shipment", shipmentId);

      // Listen for updates
      socket.on("shipment:updated", (data) => {
        if (data.id === shipmentId) {
          callback(data);
        }
      });

      socket.on("shipment:location:updated", (data) => {
        if (data.shipmentId === shipmentId) {
          callback(data);
        }
      });

      // Return unsubscribe function
      return () => {
        socket.emit("unsubscribe:shipment", shipmentId);
        socket.off("shipment:updated");
        socket.off("shipment:location:updated");
      };
    },
    [],
  );

  // Subscribe to driver updates
  const subscribeToDriver = useCallback((driverId: string, callback: (data: unknown) => void) => {
    if (!socketRef.current) {
      console.warn("[WebSocket] Socket not initialized");
      return () => {};
    }

    const socket = socketRef.current;

    // Subscribe
    socket.emit("subscribe:driver", driverId);

    // Listen for updates
    socket.on("driver:updated", (data) => {
      if (data.id === driverId) {
        callback(data);
      }
    });

    socket.on("driver:location:updated", (data) => {
      if (data.driverId === driverId) {
        callback(data);
      }
    });

    // Return unsubscribe function
    return () => {
      socket.emit("unsubscribe:driver", driverId);
      socket.off("driver:updated");
      socket.off("driver:location:updated");
    };
  }, []);

  // Subscribe to notifications
  const subscribeToNotifications = useCallback((callback: (notification: unknown) => void) => {
    if (!socketRef.current) {
      console.warn("[WebSocket] Socket not initialized");
      return () => {};
    }

    const socket = socketRef.current;

    socket.on("notification", callback);

    return () => {
      socket.off("notification", callback);
    };
  }, []);

  // Subscribe to system messages
  const subscribeToSystemMessages = useCallback((callback: (message: unknown) => void) => {
    if (!socketRef.current) {
      console.warn("[WebSocket] Socket not initialized");
      return () => {};
    }

    const socket = socketRef.current;

    socket.on("system:message", callback);

    return () => {
      socket.off("system:message", callback);
    };
  }, []);

  // Send driver location (for driver clients)
  const sendDriverLocation = useCallback(
    (data: { driverId: string; lat: number; lng: number; shipmentId?: string }) => {
      if (!socketRef.current) {
        console.warn("[WebSocket] Socket not initialized");
        return;
      }

      socketRef.current.emit("driver:location", data);
    },
    [],
  );

  // Ping server
  const ping = useCallback(() => {
    if (!socketRef.current) {
      console.warn("[WebSocket] Socket not initialized");
      return Promise.reject(new Error("Socket not initialized"));
    }

    return new Promise((resolve) => {
      const socket = socketRef.current!;
      const startTime = Date.now();

      socket.emit("ping");
      socket.once("pong", () => {
        const latency = Date.now() - startTime;
        resolve(latency);
      });
    });
  }, []);

  return {
    socket: socketRef.current,
    status,
    subscribeToShipment,
    subscribeToDriver,
    subscribeToNotifications,
    subscribeToSystemMessages,
    sendDriverLocation,
    ping,
  };
}

export default useWebSocket;
