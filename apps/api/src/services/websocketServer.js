/**
 * WebSocket Service for Real-Time Updates
 * Handles real-time shipment status updates and notifications
 */

const WebSocket = require("ws");
const { verifyToken } = require("../middleware/security");
const { logger } = require("../middleware/logger");

class WebSocketService {
  constructor() {
    this.connections = new Map(); // userId -> WebSocket
    this.userSubscriptions = new Map(); // userId -> Set<shipmentId>
  }

  initialize(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws, req) => {
      logger.info('New WebSocket connection');

      // Verify JWT from query string or first message
      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message);

          if (data.type === "auth") {
            // Authenticate user with JWT
            const userId = await this.authenticateSocket(data.token);
            if (userId) {
              ws.userId = userId;
              ws.send(JSON.stringify({ type: "auth_success" }));
            } else {
              ws.close(1008, "Authentication failed");
            }
          }
        } catch (error) {
          logger.error({ error }, 'WebSocket message error');
        }
      });
    });

    logger.info({ port: port || 8080 }, 'WebSocket server running');
  }

  broadcastShipmentUpdate(shipmentId, update) {
    this.wss?.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
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

  sendToUser(userId, message) {
    const userConnection = this.clients.get(userId);
    if (userConnection) {
      userConnection.send(JSON.stringify(message));
    }
  }

  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  close() {
    this.wss.close();
  }
}

module.exports = {
  WebSocketService,
  websocketServer: new WebSocketService(),
};
