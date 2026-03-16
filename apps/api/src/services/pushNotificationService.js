/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging (FCM) and APNs integration
 * Supports notification throttling, templating, and delivery tracking
 */

const { logger } = require("../middleware/logger");

class PushNotificationService {
  constructor() {
    this.fcmTokens = new Map(); // userId -> [tokens]
    this.notificationHistory = new Map(); // Track sent notifications
    this.subscriptions = new Map(); // Topic subscriptions
    this.deliveryQueue = []; // Queue for batch delivery
    this.templates = this.initializeTemplates();
  }

  /**
   * Register device token (called when app starts)
   */
  async registerDeviceToken(userId, token, platform = "android", appVersion) {
    try {
      logger.info("Push: Registering device token", {
        userId,
        platform,
        appVersion,
      });

      // Store token mapping
      if (!this.fcmTokens.has(userId)) {
        this.fcmTokens.set(userId, []);
      }

      const tokens = this.fcmTokens.get(userId);

      // Check if duplicate
      const existingToken = tokens.find((t) => t.token === token && t.platform === platform);

      if (!existingToken) {
        tokens.push({
          token,
          platform,
          appVersion,
          registeredAt: Date.now(),
          lastSeen: Date.now(),
          isActive: true,
        });
      }

      logger.info("Push: Device token registered", {
        userId,
        tokenCount: tokens.length,
      });

      return {
        userId,
        tokenCount: tokens.length,
        status: "registered",
      };
    } catch (err) {
      logger.error("Push: Device registration failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Send notification to driver
   */
  async sendToDriver(userId, notification) {
    try {
      logger.info("Push: Queueing driver notification", {
        userId,
        type: notification.type,
      });

      const tokens = this.fcmTokens.get(userId) || [];

      if (tokens.length === 0) {
        logger.warn("Push: No tokens for user", { userId });
        return { status: "no_tokens" };
      }

      // Build notification payload
      const payload = this.buildNotificationPayload(notification);

      // Send to all active tokens
      const results = [];
      for (const tokenObj of tokens) {
        if (tokenObj.isActive) {
          const result = await this.sendNotificationViaFCM(
            tokenObj.token,
            payload,
            tokenObj.platform,
          );
          results.push(result);
        }
      }

      // Track in history
      this.addToNotificationHistory(userId, notification, results);

      logger.info("Push: Notifications sent", { userId, count: results.length });

      return {
        userId,
        notificationsSent: results.length,
        results,
      };
    } catch (err) {
      logger.error("Push: Sending failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Send batch notifications (for promotions, alerts, etc.)
   */
  async sendBatchNotification(userIds, notification, priority = "high") {
    try {
      logger.info("Push: Queueing batch notification", {
        count: userIds.length,
        type: notification.type,
        priority,
      });

      const payload = this.buildNotificationPayload(notification);
      const results = [];

      // Process in batches of 500 for FCM rate limits
      const batchSize = 500;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);

        for (const userId of batch) {
          const result = await this.sendToDriver(userId, notification);
          results.push(result);
        }

        // Small delay between batches
        if (i + batchSize < userIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      logger.info("Push: Batch notification complete", {
        total: userIds.length,
        successful: results.filter((r) => r.status === "sent").length,
      });

      return {
        batchId: `batch-${Date.now()}`,
        totalUsers: userIds.length,
        successful: results.filter((r) => r.status === "sent").length,
        failed: results.filter((r) => r.status !== "sent").length,
      };
    } catch (err) {
      logger.error("Push: Batch notification failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Subscribe user to notification topic
   */
  async subscribeToTopic(userId, topic, notificationTypes = []) {
    try {
      logger.info("Push: Subscribing to topic", { userId, topic });

      if (!this.subscriptions.has(topic)) {
        this.subscriptions.set(topic, []);
      }

      const topicSubs = this.subscriptions.get(topic);

      // Add subscription if not exists
      if (!topicSubs.find((s) => s.userId === userId)) {
        topicSubs.push({
          userId,
          topic,
          notificationTypes,
          subscribedAt: Date.now(),
          active: true,
        });
      }

      logger.info("Push: Topic subscription confirmed", { userId, topic });

      return { userId, topic, status: "subscribed" };
    } catch (err) {
      logger.error("Push: Topic subscription failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Send notification to all users subscribed to a topic
   */
  async sendToTopic(topic, notification) {
    try {
      logger.info("Push: Sending to topic", { topic });

      const subscribers = (this.subscriptions.get(topic) || []).filter((s) => s.active) || [];

      logger.info("Push: Topic subscribers found", {
        topic,
        count: subscribers.length,
      });

      if (subscribers.length === 0) {
        return { status: "no_subscribers" };
      }

      const userIds = subscribers.map((s) => s.userId);
      return await this.sendBatchNotification(userIds, notification);
    } catch (err) {
      logger.error("Push: Topic notification failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Get notification templates for different scenarios
   */
  initializeTemplates() {
    return {
      loadAvailable: {
        title: "✨ New Load Available!",
        body: "{pickup} → {dropoff} ({miles} miles)",
        icon: "ic_load",
        priority: "high",
        actionType: "open_load_detail",
      },
      loadExpiring: {
        title: "⏰ Load Expiring Soon",
        body: "{pickup} → {dropoff} expires in {minutes} minutes",
        icon: "ic_timer",
        priority: "high",
      },
      geofenceAlert: {
        title: "📍 Location Alert",
        body: "You're near {locationName}. {instruction}",
        icon: "ic_location",
        priority: "high",
      },
      paymentReceived: {
        title: "💰 Payment Received",
        body: "${amount} for {shipmentId} - Total: ${balance}",
        icon: "ic_payment",
        priority: "normal",
      },
      maintenanceReminder: {
        title: "🔧 Maintenance Due",
        body: "Your truck maintenance is due in {days} days",
        icon: "ic_maintenance",
        priority: "normal",
      },
      docExpiring: {
        title: "📄 License/Cert Expiring",
        body: "{docType} expires in {days} days",
        icon: "ic_document",
        priority: "high",
      },
      promoBanner: {
        title: "🎉 Special Offer",
        body: "{promoText}",
        icon: "ic_promo",
        priority: "normal",
      },
      urgentAlert: {
        title: "🚨 Important Alert",
        body: "{message}",
        icon: "ic_alert",
        priority: "high",
      },
      leaderboardUpdate: {
        title: "🏆 Leaderboard Update",
        body: "You're now #{rank} among drivers in {region}",
        icon: "ic_trophy",
        priority: "normal",
      },
    };
  }

  /**
   * Get notification history for auditing
   */
  async getNotificationHistory(userId, limit = 50) {
    try {
      const history = this.notificationHistory.get(userId) || [];

      return {
        userId,
        totalNotifications: history.length,
        recent: history.slice(-limit).reverse(),
      };
    } catch (err) {
      logger.error("Push: History retrieval failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Suppress notifications for a period (quiet hours, do not disturb)
   */
  async setSuppression(userId, startTime, endTime, types = []) {
    try {
      logger.info("Push: Setting notification suppression", { userId });

      // In production, would store in database
      if (!this.fcmTokens.has(userId)) return { error: "User not found" };

      return {
        userId,
        suppression: {
          active: true,
          startTime,
          endTime,
          duration: (endTime - startTime) / 1000 / 60 + " minutes",
          types: types.length > 0 ? types : "all",
        },
      };
    } catch (err) {
      logger.error("Push: Suppression setup failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Track notification delivery status
   */
  async trackDelivery(notificationId, userId, status = "delivered") {
    try {
      const history = this.notificationHistory.get(userId) || [];
      const notif = history.find((n) => n.id === notificationId);

      if (notif) {
        notif.deliveryStatus = status;
        notif.deliveredAt = Date.now();
      }

      logger.info("Push: Delivery tracked", {
        userId,
        notificationId,
        status,
      });

      return { notificationId, status };
    } catch (err) {
      logger.error("Push: Delivery tracking failed", { error: err.message });
      throw err;
    }
  }

  // ============ HELPER METHODS ============

  buildNotificationPayload(notification) {
    const template = this.templates[notification.templateType] || {};

    // Interpolate variables
    let title = template.title || notification.title || "Infæmous Freight";
    let body = template.body || notification.body || "";

    // Replace template variables
    if (notification.data) {
      Object.entries(notification.data).forEach(([key, value]) => {
        title = title.replace(`{${key}}`, value);
        body = body.replace(`{${key}}`, value);
      });
    }

    const payload = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      notification: {
        title,
        body,
        icon: template.icon || "ic_launcher",
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
        sound: "default",
        vibrate: true,
      },
      data: {
        ...notification.data,
        type: notification.type,
        templateType: notification.templateType,
        clickTarget: notification.clickTarget || "/shipments",
        priority: template.priority || "normal",
      },
      android: {
        priority: template.priority === "high" ? "high" : "normal",
        ttl: "86400", // 24 hours
        notification: {
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: "default",
            badge: 1,
            "mutable-content": true,
          },
        },
      },
    };

    return payload;
  }

  async sendNotificationViaFCM(token, payload, platform = "android") {
    try {
      // In production, would use firebase-admin SDK:
      // const message = {
      //   token,
      //   notification: payload.notification,
      //   data: payload.data,
      //   android: payload.android,
      //   apns: payload.apns,
      // };
      // await admin.messaging().send(message);

      // For now, simulate success
      return {
        status: "sent",
        token: token.substring(0, 10) + "...",
        platform,
        sentAt: Date.now(),
        messageId: `msg-${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (err) {
      logger.error("Push: FCM send failed", {
        error: err.message,
        platform,
      });

      return {
        status: "failed",
        error: err.message,
        platform,
      };
    }
  }

  addToNotificationHistory(userId, notification, results) {
    if (!this.notificationHistory.has(userId)) {
      this.notificationHistory.set(userId, []);
    }

    const history = this.notificationHistory.get(userId);
    history.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type,
      templateType: notification.templateType,
      sentAt: Date.now(),
      deliveryStatus: results.length > 0 ? "sent" : "failed",
      results,
      data: notification.data,
    });

    // Keep only last 1000 notifications per user
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }
}

module.exports = new PushNotificationService();
