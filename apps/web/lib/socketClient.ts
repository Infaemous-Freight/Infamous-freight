/**
 * WebSocket Client for Real-Time Shipment Tracking
 * Connects to the API WebSocket server at /ws
 */

export type ShipmentUpdate = {
  shipmentId: string;
  data: {
    status?: string;
    location?: { latitude: number; longitude: number };
    estimatedDelivery?: string;
    [key: string]: unknown;
  };
  timestamp: number;
};

export type VehicleUpdate = {
  vehicleId: string;
  data: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    timestamp: number;
  };
  timestamp: number;
};

export type Notification = {
  data: Record<string, unknown>;
  timestamp: number;
};

type MessageHandler = {
  onShipmentUpdate?: (update: ShipmentUpdate) => void;
  onVehicleUpdate?: (update: VehicleUpdate) => void;
  onNotification?: (notification: Notification) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
};

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")
    .replace(/^http/, "ws")
    .replace(/\/?$/, "/ws");

export class SocketClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private handlers: MessageHandler = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 3000;
  private shouldReconnect = false;

  constructor(token: string) {
    this.token = token;
  }

  connect(handlers: MessageHandler = {}): void {
    this.handlers = handlers;
    this.shouldReconnect = true;
    this.openConnection();
  }

  private openConnection(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(WS_URL);

    this.ws.addEventListener("open", () => {
      // Authenticate immediately after connection
      this.send({ type: "auth", token: this.token });
    });

    this.ws.addEventListener("message", (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string;
          [key: string]: unknown;
        };

        switch (msg.type) {
          case "auth_success":
            this.handlers.onConnect?.();
            break;
          case "shipment_update":
            this.handlers.onShipmentUpdate?.(msg as unknown as ShipmentUpdate);
            break;
          case "vehicle_update":
            this.handlers.onVehicleUpdate?.(msg as unknown as VehicleUpdate);
            break;
          case "notification":
            this.handlers.onNotification?.(msg as unknown as Notification);
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    });

    this.ws.addEventListener("close", () => {
      this.handlers.onDisconnect?.();
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.openConnection(), this.reconnectDelay);
      }
    });

    this.ws.addEventListener("error", (event: Event) => {
      this.handlers.onError?.(event);
    });
  }

  subscribeShipment(shipmentId: string): void {
    this.send({ type: "subscribe", shipmentId });
  }

  unsubscribeShipment(shipmentId: string): void {
    this.send({ type: "unsubscribe", shipmentId });
  }

  subscribeVehicle(vehicleId: string): void {
    this.send({ type: "subscribe", vehicleId });
  }

  unsubscribeVehicle(vehicleId: string): void {
    this.send({ type: "unsubscribe", vehicleId });
  }

  private send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}
