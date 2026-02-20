/**
 * GraphQL Subscriptions Service
 * Provides real-time GraphQL subscriptions using WebSocket connections
 * 
 * Features:
 * - Real-time shipment tracking updates
 * - Live driver location updates
 * - Instant notification delivery
 * - Connection management with authentication
 * 
 * @module services/graphqlSubscriptions
 */

const { PubSub } = require('graphql-subscriptions');
const { logger } = require('../middleware/logger');
const jwt = require('jsonwebtoken');

/**
 * PubSub instance for GraphQL subscriptions
 */
const pubsub = new PubSub();

/**
 * Subscription topics
 */
const SUBSCRIPTION_TOPICS = {
  SHIPMENT_UPDATED: 'SHIPMENT_UPDATED',
  SHIPMENT_CREATED: 'SHIPMENT_CREATED',
  DRIVER_LOCATION_UPDATED: 'DRIVER_LOCATION_UPDATED',
  NOTIFICATION_RECEIVED: 'NOTIFICATION_RECEIVED',
  TRACKING_EVENT_ADDED: 'TRACKING_EVENT_ADDED',
  SHIPMENT_STATUS_CHANGED: 'SHIPMENT_STATUS_CHANGED',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  DELIVERY_COMPLETED: 'DELIVERY_COMPLETED',
  ANALYTICS_UPDATED: 'ANALYTICS_UPDATED',
};

/**
 * Active subscriptions registry
 * Maps subscription IDs to connection info
 */
const activeSubscriptions = new Map();

/**
 * GraphQL Subscriptions Service
 */
class GraphQLSubscriptionsService {
  constructor() {
    this.pubsub = pubsub;
    this.topics = SUBSCRIPTION_TOPICS;
    this.connections = new Set();
  }

  /**
   * Publish shipment update
   * @param {Object} shipment - Updated shipment data
   */
  publishShipmentUpdated(shipment) {
    logger.info('Publishing shipment update', { shipmentId: shipment.id });
    return this.pubsub.publish(SUBSCRIPTION_TOPICS.SHIPMENT_UPDATED, {
      shipmentUpdated: shipment,
    });
  }

  /**
   * Publish new shipment creation
   * @param {Object} shipment - New shipment data
   */
  publishShipmentCreated(shipment) {
    logger.info('Publishing shipment created', { shipmentId: shipment.id });
    return this.pubsub.publish(SUBSCRIPTION_TOPICS.SHIPMENT_CREATED, {
      shipmentCreated: shipment,
    });
  }

  /**
   * Publish driver location update
   * @param {string} driverId - Driver ID
   * @param {Object} location - Location data {lat, lng, timestamp}
   */
  publishDriverLocationUpdated(driverId, location) {
    logger.debug('Publishing driver location', { driverId });
    return this.pubsub.publish(SUBSCRIPTION_TOPICS.DRIVER_LOCATION_UPDATED, {
      driverLocationUpdated: {
        driverId,
        ...location,
      },
    });
  }

  /**
   * Publish notification
   * @param {string} userId - User ID to receive notification
   * @param {Object} notification - Notification data
   */
  publishNotification(userId, notification) {
    logger.info('Publishing notification', { userId });
    return this.pubsub.publish(SUBSCRIPTION_TOPICS.NOTIFICATION_RECEIVED, {
      notificationReceived: {
        userId,
        ...notification,
      },
    });
  }

  /**
   * Publish tracking event
   * @param {string} shipmentId - Shipment ID
   * @param {Object} event - Tracking event data
   */
  publishTrackingEvent(shipmentId, event) {
    logger.info('Publishing tracking event', { shipmentId });
    return this.pubsub.publish(SUBSCRIPTION_TOPICS.TRACKING_EVENT_ADDED, {
      trackingEventAdded: {
        shipmentId,
        ...event,
      },
    });
  }

  /**
   * Publish shipment status change
   * @param {string} shipmentId - Shipment ID
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   */
  publishShipmentStatusChanged(shipmentId, oldStatus, newStatus) {
    logger.info('Publishing status change', { shipmentId, oldStatus, newStatus });
    return this.pubsub.publish(SUBSCRIPTION_TOPICS.SHIPMENT_STATUS_CHANGED, {
      shipmentStatusChanged: {
        shipmentId,
        oldStatus,
        newStatus,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Publish driver assignment
   * @param {string} shipmentId - Shipment ID
   * @param {string} driverId - Driver ID
   */
  publishDriverAssigned(shipmentId, driverId) {
    logger.info('Publishing driver assignment', { shipmentId, driverId });
    return this.pubsub.publish(SUBSCRIPTION_TOPICS.DRIVER_ASSIGNED, {
      driverAssigned: {
        shipmentId,
        driverId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Publish delivery completion
   * @param {Object} shipment - Completed shipment
   */
  publishDeliveryCompleted(shipment) {
    logger.info('Publishing delivery completed', { shipmentId: shipment.id });
    return this.pubsub.publish(SUBSCRIPTION_TOPICS.DELIVERY_COMPLETED, {
      deliveryCompleted: shipment,
    });
  }

  /**
   * Publish analytics update
   * @param {Object} analytics - Updated analytics data
   */
  publishAnalyticsUpdated(analytics) {
    logger.debug('Publishing analytics update');
    return this.pubsub.publish(SUBSCRIPTION_TOPICS.ANALYTICS_UPDATED, {
      analyticsUpdated: analytics,
    });
  }

  /**
   * Register new subscription connection
   * @param {string} subscriptionId - Unique subscription ID
   * @param {Object} connectionInfo - Connection metadata
   */
  registerSubscription(subscriptionId, connectionInfo) {
    activeSubscriptions.set(subscriptionId, {
      ...connectionInfo,
      connectedAt: Date.now(),
    });
    this.connections.add(subscriptionId);
    logger.info('Subscription registered', { subscriptionId });
  }

  /**
   * Unregister subscription connection
   * @param {string} subscriptionId - Subscription ID to remove
   */
  unregisterSubscription(subscriptionId) {
    activeSubscriptions.delete(subscriptionId);
    this.connections.delete(subscriptionId);
    logger.info('Subscription unregistered', { subscriptionId });
  }

  /**
   * Get active subscription count
   * @returns {number} Number of active subscriptions
   */
  getActiveSubscriptionCount() {
    return activeSubscriptions.size;
  }

  /**
   * Get subscription info
   * @param {string} subscriptionId - Subscription ID
   * @returns {Object|null} Subscription info or null
   */
  getSubscriptionInfo(subscriptionId) {
    return activeSubscriptions.get(subscriptionId) || null;
  }

  /**
   * Authenticate WebSocket connection
   * @param {Object} connectionParams - Connection parameters
   * @returns {Object} User context
   */
  async authenticateConnection(connectionParams) {
    const { authToken, authorization } = connectionParams;
    const token = authToken || authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('Authentication token required');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.info('WebSocket authenticated', { userId: decoded.sub });
      
      return {
        user: decoded,
        scopes: decoded.scopes || [],
      };
    } catch (error) {
      logger.error('WebSocket authentication failed', { error: error.message });
      throw new Error('Invalid authentication token');
    }
  }

  /**
   * Filter shipment updates by user permissions
   * @param {Object} shipment - Shipment data
   * @param {Object} context - GraphQL context with user info
   * @returns {boolean} True if user can access shipment
   */
  canAccessShipment(shipment, context) {
    if (!context.user) return false;

    const { user } = context;
    
    // Admin can access all shipments
    if (user.role === 'admin') return true;

    // Users can access their own shipments
    return (
      user.sub === shipment.customerId ||
      user.sub === shipment.driverId ||
      user.organizationId === shipment.organizationId
    );
  }

  /**
   * AsyncIterator for shipment updates
   * @param {string[]} shipmentIds - Optional array of shipment IDs to filter
   * @returns {AsyncIterator} Async iterator for subscription
   */
  subscribeToShipmentUpdates(shipmentIds = null) {
    if (shipmentIds && shipmentIds.length > 0) {
      return this.pubsub.asyncIterator(
        shipmentIds.map(id => `${SUBSCRIPTION_TOPICS.SHIPMENT_UPDATED}:${id}`)
      );
    }
    return this.pubsub.asyncIterator(SUBSCRIPTION_TOPICS.SHIPMENT_UPDATED);
  }

  /**
   * AsyncIterator for driver location updates
   * @param {string} driverId - Driver ID to track
   * @returns {AsyncIterator} Async iterator for subscription
   */
  subscribeToDriverLocation(driverId) {
    return this.pubsub.asyncIterator(`${SUBSCRIPTION_TOPICS.DRIVER_LOCATION_UPDATED}:${driverId}`);
  }

  /**
   * AsyncIterator for user notifications
   * @param {string} userId - User ID
   * @returns {AsyncIterator} Async iterator for subscription
   */
  subscribeToNotifications(userId) {
    return this.pubsub.asyncIterator(`${SUBSCRIPTION_TOPICS.NOTIFICATION_RECEIVED}:${userId}`);
  }

  /**
   * Get statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      activeSubscriptions: this.getActiveSubscriptionCount(),
      connections: this.connections.size,
      topics: Object.keys(SUBSCRIPTION_TOPICS).length,
      uptime: process.uptime(),
    };
  }
}

// Export singleton instance
module.exports = new GraphQLSubscriptionsService();
