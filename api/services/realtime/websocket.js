/**
 * WebSocket Real-Time Notifications Service
 * 
 * Provides real-time communication via WebSocket for:
 * - Shipment status updates
 * - Delivery notifications
 * - Driver location updates
 * - Alerts and warnings
 * - Chat messages
 * 
 * Features:
 * - User authentication via JWT
 * - Channel-based messaging (rooms)
 * - Broadcast capabilities
 * - Connection health monitoring
 * - Automatic reconnection support
 * 
 * Usage:
 *   const http = require('http').createServer(app);
 *   const NotificationManager = require('./websocket');
 *   const notifier = new NotificationManager(http);
 *   
 *   // Send to single user
 *   notifier.sendToUser('user123', 'shipment:updated', shipmentData);
 *   
 *   // Broadcast to all
 *   notifier.broadcast('service:alert', { message: 'Maintenance window' });
 */

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../../middleware/logger");

class NotificationManager {
    constructor(server) {
        this.jwtSecret = process.env.JWT_SECRET;
        if (!this.jwtSecret) {
            logger.error("WebSocket service misconfigured: JWT_SECRET is not set");
            throw new Error("Server auth misconfiguration");
        }

        this.io = new Server(server, {
            cors: {
                origin: (process.env.WEB_URL || "http://localhost:3000").split(","),
                methods: ["GET", "POST"],
                credentials: true,
            },
            pingInterval: 25000,
            pingTimeout: 60000,
            transports: ["websocket", "polling"],
        });

        this.connections = new Map(); // userId -> socket
        this.channels = new Map(); // channel -> Set of socketIds

        this.setupMiddleware();
        this.setupConnectionHandlers();
    }

    setupMiddleware() {
        // Middleware for authentication
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error("Missing authentication token"));
            }

            try {
                const decoded = jwt.verify(token, this.jwtSecret);
                socket.userId = decoded.sub;
                socket.email = decoded.email;
                const scopes = decoded.scopes || decoded.scope || [];
                socket.scopes = scopes;
                socket.scope = scopes; // backward compatibility if existing code reads `socket.scope`
                next();
            } catch (error) {
                logger.warn("WebSocket authentication failed", {
                    error: error.message,
                });
                next(new Error("Invalid token"));
            }
        });
    }

    setupConnectionHandlers() {
        this.io.on("connection", (socket) => {
            logger.info("WebSocket client connected", {
                socketId: socket.id,
                userId: socket.userId,
            });

            // Store connection
            this.connections.set(socket.userId, socket);

            // Subscribe to channels
            socket.on("subscribe", (channels) => {
                if (!Array.isArray(channels)) return;

                channels.forEach((channel) => {
                    socket.join(channel);

                    if (!this.channels.has(channel)) {
                        this.channels.set(channel, new Set());
                    }
                    this.channels.get(channel).add(socket.id);

                    logger.debug("User subscribed to channel", {
                        userId: socket.userId,
                        channel,
                    });
                });
            });

            // Unsubscribe from channels
            socket.on("unsubscribe", (channels) => {
                if (!Array.isArray(channels)) return;

                channels.forEach((channel) => {
                    socket.leave(channel);

                    const channelSet = this.channels.get(channel);
                    if (channelSet) {
                        channelSet.delete(socket.id);
                        if (channelSet.size === 0) {
                            this.channels.delete(channel);
                        }
                    }

                    logger.debug("User unsubscribed from channel", {
                        userId: socket.userId,
                        channel,
                    });
                });
            });

            // Ping/pong for health check
            socket.on("ping", () => {
                socket.emit("pong");
            });

            // Handle disconnection
            socket.on("disconnect", (reason) => {
                logger.info("WebSocket client disconnected", {
                    socketId: socket.id,
                    userId: socket.userId,
                    reason,
                });

                this.connections.delete(socket.userId);

                // Clean up channels
                this.channels.forEach((socketIds) => {
                    socketIds.delete(socket.id);
                });
            });

            // Error handling
            socket.on("error", (error) => {
                logger.error("WebSocket error", {
                    userId: socket.userId,
                    error: error.message,
                });
            });
        });
    }

    /**
     * Send notification to specific user
     */
    sendToUser(userId, eventType, data = {}) {
        const socket = this.connections.get(userId);

        if (!socket) {
            logger.debug("User not connected", { userId });
            return false;
        }

        socket.emit("notification", {
            type: eventType,
            data,
            timestamp: new Date().toISOString(),
        });

        logger.debug("Notification sent to user", { userId, eventType });
        return true;
    }

    /**
     * Send notification to multiple users
     */
    sendToUsers(userIds, eventType, data = {}) {
        const results = userIds.map((userId) =>
            this.sendToUser(userId, eventType, data)
        );
        return {
            total: userIds.length,
            sent: results.filter((r) => r).length,
        };
    }

    /**
     * Send notification to channel
     */
    sendToChannel(channel, eventType, data = {}) {
        this.io.to(channel).emit("notification", {
            type: eventType,
            data,
            timestamp: new Date().toISOString(),
        });

        const count = this.channels.get(channel)?.size || 0;
        logger.debug("Notification sent to channel", {
            channel,
            eventType,
            recipients: count,
        });

        return count;
    }

    /**
     * Broadcast to all connected users
     */
    broadcast(eventType, data = {}) {
        this.io.emit("notification", {
            type: eventType,
            data,
            timestamp: new Date().toISOString(),
        });

        logger.info("Broadcast message sent", {
            eventType,
            recipients: this.connections.size,
        });

        return this.connections.size;
    }

    /**
     * Shipment-specific notifications
     */
    shipmentCreated(shipmentId, shipment) {
        this.sendToChannel(`shipment:${shipmentId}`, "shipment:created", {
            id: shipmentId,
            status: shipment.status,
            origin: shipment.origin,
            destination: shipment.destination,
        });
    }

    /**
     * Shipment status update
     */
    shipmentUpdated(shipmentId, updates) {
        this.sendToChannel(`shipment:${shipmentId}`, "shipment:updated", updates);
    }

    /**
     * Delivery notification
     */
    shipmentDelivered(shipmentId, shipment, signature) {
        this.sendToChannel(`shipment:${shipmentId}`, "shipment:delivered", {
            id: shipmentId,
            deliveredAt: new Date().toISOString(),
            signature,
        });
    }

    /**
     * Driver location update
     */
    driverLocationUpdated(driverId, location) {
        this.sendToChannel(`driver:${driverId}`, "driver:location", {
            driverId,
            latitude: location.latitude,
            longitude: location.longitude,
            updatedAt: new Date().toISOString(),
        });
    }

    /**
     * Alert notification
     */
    sendAlert(userId, severity, message) {
        this.sendToUser(userId, "alert", {
            severity, // 'info', 'warning', 'error'
            message,
        });
    }

    /**
     * Get connection stats
     */
    getStats() {
        return {
            totalConnections: this.connections.size,
            totalChannels: this.channels.size,
            channels: Array.from(this.channels.entries()).map(([name, sockets]) => ({
                name,
                subscribers: sockets.size,
            })),
        };
    }

    /**
     * Get user's socket
     */
    getUserSocket(userId) {
        return this.connections.get(userId);
    }

    /**
     * Check if user is connected
     */
    isUserConnected(userId) {
        return this.connections.has(userId);
    }

    /**
     * Get connected users
     */
    getConnectedUsers() {
        return Array.from(this.connections.keys());
    }

    /**
     * Close connection
     */
    closeConnection(userId) {
        const socket = this.connections.get(userId);
        if (socket) {
            socket.disconnect(true);
            return true;
        }
        return false;
    }

    /**
     * Shutdown server
     */
    async shutdown() {
        logger.info("Shutting down WebSocket server");
        await this.io.close();
    }
}

module.exports = NotificationManager;
