/**
 * WebSocket Service - Phase 6 Tier 2.1
 * 
 * Real-time communication layer for:
 * - Live shipment tracking
 * - Driver location updates
 * - Real-time notifications
 * - System alerts
 * 
 * Expected Impact: Real-time user experience, +10% engagement
 */

const socketIO = require('socket.io');
const logger = require('../middleware/logger').logger;

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // socket.id -> user info
    this.shipmentRooms = new Map(); // shipmentId -> Set of socket IDs
    this.driverRooms = new Map(); // driverId -> Set of socket IDs
    this.userRooms = new Map(); // userId -> Set of socket IDs
  }

  /**
   * Initialize WebSocket server with Socket.IO
   * @param {Object} httpServer - Express HTTP server
   * @param {Object} options - Socket.IO configuration
   */
  initialize(httpServer, options = {}) {
    const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    this.io = socketIO(httpServer, {
      cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      ...options
    });

    this._setupEventHandlers();
    this._setupNamespaces();

    logger.info('WebSocket server initialized', {
      namespaces: ['/', '/shipments', '/drivers', '/notifications']
    });

    return this.io;
  }

  /**
   * Setup main connection handlers
   */
  _setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', {
        socketId: socket.id,
        transport: socket.conn.transport.name
      });

      // Extract user info from handshake (if authenticated)
      const userId = socket.handshake.query.userId || socket.handshake.auth?.userId;
      const userRole = socket.handshake.query.role || socket.handshake.auth?.role;

      if (userId) {
        this.connectedClients.set(socket.id, {
          userId,
          role: userRole,
          connectedAt: new Date()
        });

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Add to user rooms tracking
        if (!this.userRooms.has(userId)) {
          this.userRooms.set(userId, new Set());
        }
        this.userRooms.get(userId).add(socket.id);
      }

      // Handle shipment subscription
      socket.on('subscribe:shipment', (shipmentId) => {
        this._handleShipmentSubscription(socket, shipmentId);
      });

      // Handle shipment unsubscription
      socket.on('unsubscribe:shipment', (shipmentId) => {
        this._handleShipmentUnsubscription(socket, shipmentId);
      });

      // Handle driver subscription
      socket.on('subscribe:driver', (driverId) => {
        this._handleDriverSubscription(socket, driverId);
      });

      // Handle driver unsubscription
      socket.on('unsubscribe:driver', (driverId) => {
        this._handleDriverUnsubscription(socket, driverId);
      });

      // Handle location updates from drivers
      socket.on('driver:location', (data) => {
        this._handleDriverLocation(socket, data);
      });

      // Handle generic events
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this._handleDisconnect(socket, reason);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('Socket error', {
          socketId: socket.id,
          error: error.message
        });
      });

      // Send connection confirmation
      socket.emit('connected', {
        socketId: socket.id,
        timestamp: Date.now(),
        server: 'Infamous Freight API'
      });
    });
  }

  /**
   * Setup namespaces for different types of real-time data
   */
  _setupNamespaces() {
    // Shipments namespace
    const shipmentsNs = this.io.of('/shipments');
    shipmentsNs.on('connection', (socket) => {
      logger.debug('Client connected to /shipments namespace', {
        socketId: socket.id
      });

      socket.on('track', (shipmentId) => {
        socket.join(`shipment:${shipmentId}`);
        logger.debug('Client tracking shipment', { shipmentId, socketId: socket.id });
      });
    });

    // Drivers namespace
    const driversNs = this.io.of('/drivers');
    driversNs.on('connection', (socket) => {
      logger.debug('Client connected to /drivers namespace', {
        socketId: socket.id
      });

      socket.on('track', (driverId) => {
        socket.join(`driver:${driverId}`);
        logger.debug('Client tracking driver', { driverId, socketId: socket.id });
      });
    });

    // Notifications namespace
    const notificationsNs = this.io.of('/notifications');
    notificationsNs.on('connection', (socket) => {
      const userId = socket.handshake.query.userId;

      if (userId) {
        socket.join(`user:${userId}`);
        logger.debug('Client connected to notifications', {
          userId,
          socketId: socket.id
        });
      }
    });
  }

  /**
   * Handle shipment subscription
   */
  _handleShipmentSubscription(socket, shipmentId) {
    socket.join(`shipment:${shipmentId}`);

    if (!this.shipmentRooms.has(shipmentId)) {
      this.shipmentRooms.set(shipmentId, new Set());
    }
    this.shipmentRooms.get(shipmentId).add(socket.id);

    logger.debug('Client subscribed to shipment', {
      shipmentId,
      socketId: socket.id,
      totalSubscribers: this.shipmentRooms.get(shipmentId).size
    });

    socket.emit('subscribed:shipment', {
      shipmentId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle shipment unsubscription
   */
  _handleShipmentUnsubscription(socket, shipmentId) {
    socket.leave(`shipment:${shipmentId}`);

    if (this.shipmentRooms.has(shipmentId)) {
      this.shipmentRooms.get(shipmentId).delete(socket.id);

      if (this.shipmentRooms.get(shipmentId).size === 0) {
        this.shipmentRooms.delete(shipmentId);
      }
    }

    logger.debug('Client unsubscribed from shipment', {
      shipmentId,
      socketId: socket.id
    });
  }

  /**
   * Handle driver subscription
   */
  _handleDriverSubscription(socket, driverId) {
    socket.join(`driver:${driverId}`);

    if (!this.driverRooms.has(driverId)) {
      this.driverRooms.set(driverId, new Set());
    }
    this.driverRooms.get(driverId).add(socket.id);

    logger.debug('Client subscribed to driver', {
      driverId,
      socketId: socket.id
    });

    socket.emit('subscribed:driver', {
      driverId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle driver unsubscription
   */
  _handleDriverUnsubscription(socket, driverId) {
    socket.leave(`driver:${driverId}`);

    if (this.driverRooms.has(driverId)) {
      this.driverRooms.get(driverId).delete(socket.id);

      if (this.driverRooms.get(driverId).size === 0) {
        this.driverRooms.delete(driverId);
      }
    }

    logger.debug('Client unsubscribed from driver', {
      driverId,
      socketId: socket.id
    });
  }

  /**
   * Handle driver location update
   */
  _handleDriverLocation(socket, data) {
    const { driverId, lat, lng, shipmentId } = data;

    if (!driverId || !lat || !lng) {
      return;
    }

    // Broadcast to all tracking this driver
    this.io.to(`driver:${driverId}`).emit('driver:location:updated', {
      driverId,
      location: { lat, lng },
      timestamp: Date.now()
    });

    // If shipment is provided, also broadcast to shipment room
    if (shipmentId) {
      this.io.to(`shipment:${shipmentId}`).emit('shipment:location:updated', {
        shipmentId,
        driverId,
        location: { lat, lng },
        timestamp: Date.now()
      });
    }

    logger.debug('Driver location updated', {
      driverId,
      shipmentId,
      location: { lat, lng }
    });
  }

  /**
   * Handle client disconnection
   */
  _handleDisconnect(socket, reason) {
    const clientInfo = this.connectedClients.get(socket.id);

    logger.info('Client disconnected', {
      socketId: socket.id,
      userId: clientInfo?.userId,
      reason
    });

    // Cleanup client tracking
    this.connectedClients.delete(socket.id);

    // Cleanup room tracking
    if (clientInfo?.userId) {
      const userSockets = this.userRooms.get(clientInfo.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userRooms.delete(clientInfo.userId);
        }
      }
    }

    // Cleanup shipment rooms
    this.shipmentRooms.forEach((sockets, shipmentId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.shipmentRooms.delete(shipmentId);
      }
    });

    // Cleanup driver rooms
    this.driverRooms.forEach((sockets, driverId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.driverRooms.delete(driverId);
      }
    });
  }

  /**
   * Emit shipment update to all subscribers
   */
  emitShipmentUpdate(shipmentId, update) {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot emit shipment update');
      return;
    }

    this.io.to(`shipment:${shipmentId}`).emit('shipment:updated', {
      id: shipmentId,
      ...update,
      timestamp: Date.now()
    });

    // Also emit to shipments namespace
    this.io.of('/shipments').to(`shipment:${shipmentId}`).emit('updated', {
      id: shipmentId,
      ...update,
      timestamp: Date.now()
    });

    logger.debug('Shipment update emitted', {
      shipmentId,
      subscribers: this.shipmentRooms.get(shipmentId)?.size || 0
    });
  }

  /**
   * Emit driver update to all subscribers
   */
  emitDriverUpdate(driverId, update) {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot emit driver update');
      return;
    }

    this.io.to(`driver:${driverId}`).emit('driver:updated', {
      id: driverId,
      ...update,
      timestamp: Date.now()
    });

    logger.debug('Driver update emitted', {
      driverId,
      subscribers: this.driverRooms.get(driverId)?.size || 0
    });
  }

  /**
   * Emit notification to specific user
   */
  emitUserNotification(userId, notification) {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot emit notification');
      return;
    }

    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: Date.now()
    });

    // Also emit to notifications namespace
    this.io.of('/notifications').to(`user:${userId}`).emit('new', notification);

    logger.debug('Notification emitted', {
      userId,
      type: notification.type
    });
  }

  /**
   * Broadcast system message to all connected clients
   */
  broadcastSystemMessage(message, type = 'info') {
    if (!this.io) {
      return;
    }

    this.io.emit('system:message', {
      type,
      message,
      timestamp: Date.now()
    });

    logger.info('System message broadcasted', { type, message });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      connectedClients: this.connectedClients.size,
      shipmentRooms: this.shipmentRooms.size,
      driverRooms: this.driverRooms.size,
      userRooms: this.userRooms.size,
      totalSubscriptions:
        Array.from(this.shipmentRooms.values()).reduce((sum, set) => sum + set.size, 0) +
        Array.from(this.driverRooms.values()).reduce((sum, set) => sum + set.size, 0)
    };
  }

  /**
   * Legacy methods for backward compatibility
   */
  initializeWebSocket(io) {
    return this.initialize(io);
  }

  addClient(client) {
    // For backward compatibility
    logger.warn('addClient() is deprecated, use Socket.IO connection handlers');
  }

  removeClient(client) {
    // For backward compatibility
    logger.warn('removeClient() is deprecated, use Socket.IO connection handlers');
  }
}

module.exports = new WebSocketService();

