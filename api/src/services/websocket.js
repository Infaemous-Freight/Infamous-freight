/**
 * WebSocket Service
 * Manages real-time connections and shipment updates
 */

class WebSocketService {
  constructor() {
    this.connectedClients = new Set();
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Emit shipment update to all connected clients
   */
  emitShipmentUpdate(shipmentId, update) {
    // Broadcast update to all connected clients
    this.connectedClients.forEach((client) => {
      if (client.isAlive) {
        client.send(
          JSON.stringify({
            type: "shipment_update",
            shipmentId,
            data: update,
          }),
        );
      }
    });
  }

  /**
   * Initialize WebSocket server
   */
  initializeWebSocket(io) {
    io.on("connection", (socket) => {
      this.connectedClients.add(socket);

      socket.on("disconnect", () => {
        this.connectedClients.delete(socket);
      });

      socket.on("subscribe_shipment", (shipmentId) => {
        socket.join(`shipment:${shipmentId}`);
      });
    });
  }

  /**
   * Add client
   */
  addClient(client) {
    this.connectedClients.add(client);
  }

  /**
   * Remove client
   */
  removeClient(client) {
    this.connectedClients.delete(client);
  }
}

module.exports = new WebSocketService();
