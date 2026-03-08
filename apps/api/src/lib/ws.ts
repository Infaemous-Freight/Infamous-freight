import { WebSocketServer, WebSocket } from "ws";

type TrackingEvent = {
  type: string;
  organizationId: string;
  payload: unknown;
};

const socketsByOrg = new Map<string, Set<WebSocket>>();

export function registerTrackingSocket(wss: WebSocketServer) {
  wss.on("connection", (socket, request) => {
    const url = new URL(request.url ?? "", "http://localhost");
    const organizationId = url.searchParams.get("organizationId");

    if (!organizationId) {
      socket.close();
      return;
    }

    const bucket = socketsByOrg.get(organizationId) ?? new Set<WebSocket>();
    bucket.add(socket);
    socketsByOrg.set(organizationId, bucket);

    socket.on("close", () => {
      bucket.delete(socket);
      if (bucket.size === 0) socketsByOrg.delete(organizationId);
    });
  });
}

export function broadcastTrackingEvent(event: TrackingEvent) {
  const bucket = socketsByOrg.get(event.organizationId);
  if (!bucket) return;

  const serialized = JSON.stringify(event);
  for (const socket of bucket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(serialized);
    }
  }
}
