/**
 * Firebase Admin SDK Service
 * Handles push notifications, Firestore operations, and Firebase Auth
 * 
 * @module services/firebaseAdmin
 */

const admin = require("firebase-admin");
const logger = require("../middleware/logger");

class FirebaseAdminService {
    constructor() {
        this.initialized = false;
        this.app = null;
    }

    /**
     * Initialize Firebase Admin SDK
     * Supports both service account JSON and environment credentials
     */
    initialize() {
        if (this.initialized) {
            logger.info("Firebase Admin already initialized");
            return this.app;
        }

        try {
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
                : null;

            const credential = serviceAccount
                ? admin.credential.cert(serviceAccount)
                : admin.credential.applicationDefault();

            this.app = admin.initializeApp({
                credential,
                projectId: process.env.FIREBASE_PROJECT_ID || "infamous-freight-prod",
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "infamous-freight-prod.appspot.com",
                databaseURL: process.env.FIREBASE_DATABASE_URL,
            });

            this.initialized = true;
            logger.info("Firebase Admin SDK initialized successfully", {
                projectId: process.env.FIREBASE_PROJECT_ID,
            });

            return this.app;
        } catch (error) {
            logger.error("Failed to initialize Firebase Admin SDK", {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Get Firebase Admin app instance
     * @returns {admin.app.App}
     */
    getApp() {
        if (!this.initialized) {
            this.initialize();
        }
        return this.app;
    }

    /**
     * Get Firestore instance
     * @returns {admin.firestore.Firestore}
     */
    getFirestore() {
        return this.getApp().firestore();
    }

    /**
     * Get Firebase Auth instance
     * @returns {admin.auth.Auth}
     */
    getAuth() {
        return this.getApp().auth();
    }

    /**
     * Get Firebase Storage instance
     * @returns {admin.storage.Storage}
     */
    getStorage() {
        return this.getApp().storage();
    }

    /**
     * Send push notification to a single device
     * @param {string} token - FCM device token
     * @param {object} notification - Notification payload
     * @param {object} data - Additional data payload
     * @returns {Promise<string>} Message ID
     */
    async sendPushNotification(token, notification, data = {}) {
        if (!this.initialized) {
            this.initialize();
        }

        try {
            const message = {
                token,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl,
                },
                data: {
                    ...data,
                    timestamp: new Date().toISOString(),
                },
                android: {
                    priority: "high",
                    notification: {
                        sound: "default",
                        clickAction: "FLUTTER_NOTIFICATION_CLICK",
                        channelId: "default",
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: "default",
                            badge: 1,
                            contentAvailable: true,
                        },
                    },
                },
            };

            const response = await admin.messaging().send(message);
            logger.info("Push notification sent successfully", {
                messageId: response,
                token: token.substring(0, 20) + "...",
            });

            return response;
        } catch (error) {
            logger.error("Failed to send push notification", {
                error: error.message,
                code: error.code,
                token: token.substring(0, 20) + "...",
            });
            throw error;
        }
    }

    /**
     * Send push notifications to multiple devices
     * @param {string[]} tokens - Array of FCM device tokens
     * @param {object} notification - Notification payload
     * @param {object} data - Additional data payload
     * @returns {Promise<admin.messaging.BatchResponse>}
     */
    async sendMulticastNotification(tokens, notification, data = {}) {
        if (!this.initialized) {
            this.initialize();
        }

        if (!tokens || tokens.length === 0) {
            logger.warn("No tokens provided for multicast notification");
            return { successCount: 0, failureCount: 0, responses: [] };
        }

        try {
            const message = {
                tokens,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl,
                },
                data: {
                    ...data,
                    timestamp: new Date().toISOString(),
                },
                android: {
                    priority: "high",
                    notification: {
                        sound: "default",
                        channelId: "default",
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: "default",
                            badge: 1,
                        },
                    },
                },
            };

            const response = await admin.messaging().sendEachForMulticast(message);
            logger.info("Multicast notification sent", {
                successCount: response.successCount,
                failureCount: response.failureCount,
                totalTokens: tokens.length,
            });

            // Log failed tokens for debugging
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push({
                            token: tokens[idx].substring(0, 20) + "...",
                            error: resp.error?.code,
                        });
                    }
                });
                logger.warn("Some notifications failed", { failedTokens });
            }

            return response;
        } catch (error) {
            logger.error("Failed to send multicast notification", {
                error: error.message,
                tokenCount: tokens.length,
            });
            throw error;
        }
    }

    /**
     * Send notification to a topic
     * @param {string} topic - Topic name
     * @param {object} notification - Notification payload
     * @param {object} data - Additional data payload
     * @returns {Promise<string>} Message ID
     */
    async sendToTopic(topic, notification, data = {}) {
        if (!this.initialized) {
            this.initialize();
        }

        try {
            const message = {
                topic,
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: {
                    ...data,
                    timestamp: new Date().toISOString(),
                },
            };

            const response = await admin.messaging().send(message);
            logger.info("Topic notification sent successfully", {
                messageId: response,
                topic,
            });

            return response;
        } catch (error) {
            logger.error("Failed to send topic notification", {
                error: error.message,
                topic,
            });
            throw error;
        }
    }

    /**
     * Subscribe tokens to a topic
     * @param {string[]} tokens - Array of FCM device tokens
     * @param {string} topic - Topic name
     * @returns {Promise<admin.messaging.MessagingTopicManagementResponse>}
     */
    async subscribeToTopic(tokens, topic) {
        if (!this.initialized) {
            this.initialize();
        }

        try {
            const response = await admin.messaging().subscribeToTopic(tokens, topic);
            logger.info("Tokens subscribed to topic", {
                successCount: response.successCount,
                failureCount: response.failureCount,
                topic,
            });
            return response;
        } catch (error) {
            logger.error("Failed to subscribe to topic", {
                error: error.message,
                topic,
            });
            throw error;
        }
    }

    /**
     * Unsubscribe tokens from a topic
     * @param {string[]} tokens - Array of FCM device tokens
     * @param {string} topic - Topic name
     * @returns {Promise<admin.messaging.MessagingTopicManagementResponse>}
     */
    async unsubscribeFromTopic(tokens, topic) {
        if (!this.initialized) {
            this.initialize();
        }

        try {
            const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
            logger.info("Tokens unsubscribed from topic", {
                successCount: response.successCount,
                failureCount: response.failureCount,
                topic,
            });
            return response;
        } catch (error) {
            logger.error("Failed to unsubscribe from topic", {
                error: error.message,
                topic,
            });
            throw error;
        }
    }

    /**
     * Verify Firebase ID token
     * @param {string} idToken - Firebase ID token
     * @returns {Promise<admin.auth.DecodedIdToken>}
     */
    async verifyIdToken(idToken) {
        if (!this.initialized) {
            this.initialize();
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            return decodedToken;
        } catch (error) {
            logger.error("Failed to verify ID token", {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Create custom token for user
     * @param {string} uid - User ID
     * @param {object} claims - Additional claims
     * @returns {Promise<string>} Custom token
     */
    async createCustomToken(uid, claims = {}) {
        if (!this.initialized) {
            this.initialize();
        }

        try {
            const customToken = await admin.auth().createCustomToken(uid, claims);
            return customToken;
        } catch (error) {
            logger.error("Failed to create custom token", {
                error: error.message,
                uid,
            });
            throw error;
        }
    }

    /**
     * Store push token in Firestore
     * @param {string} userId - User ID
     * @param {string} token - FCM device token
     * @param {string} platform - Device platform (ios|android|web)
     * @returns {Promise<void>}
     */
    async storePushToken(userId, token, platform) {
        const db = this.getFirestore();

        try {
            await db.collection("pushTokens").doc(token).set({
                userId,
                token,
                platform,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                active: true,
            });

            logger.info("Push token stored successfully", {
                userId,
                platform,
            });
        } catch (error) {
            logger.error("Failed to store push token", {
                error: error.message,
                userId,
            });
            throw error;
        }
    }

    /**
     * Get all push tokens for a user
     * @param {string} userId - User ID
     * @returns {Promise<string[]>} Array of FCM tokens
     */
    async getUserPushTokens(userId) {
        const db = this.getFirestore();

        try {
            const snapshot = await db
                .collection("pushTokens")
                .where("userId", "==", userId)
                .where("active", "==", true)
                .get();

            const tokens = snapshot.docs.map((doc) => doc.data().token);
            return tokens;
        } catch (error) {
            logger.error("Failed to get user push tokens", {
                error: error.message,
                userId,
            });
            throw error;
        }
    }

    /**
     * Delete push token from Firestore
     * @param {string} token - FCM device token
     * @returns {Promise<void>}
     */
    async deletePushToken(token) {
        const db = this.getFirestore();

        try {
            await db.collection("pushTokens").doc(token).delete();
            logger.info("Push token deleted successfully");
        } catch (error) {
            logger.error("Failed to delete push token", {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Store notification in Firestore
     * @param {string} userId - User ID
     * @param {object} notification - Notification data
     * @returns {Promise<string>} Notification ID
     */
    async storeNotification(userId, notification) {
        const db = this.getFirestore();

        try {
            const docRef = await db.collection("notifications").add({
                userId,
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info("Notification stored successfully", {
                notificationId: docRef.id,
                userId,
            });

            return docRef.id;
        } catch (error) {
            logger.error("Failed to store notification", {
                error: error.message,
                userId,
            });
            throw error;
        }
    }

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     * @returns {Promise<void>}
     */
    async markNotificationAsRead(notificationId) {
        const db = this.getFirestore();

        try {
            await db.collection("notifications").doc(notificationId).update({
                read: true,
                readAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info("Notification marked as read", { notificationId });
        } catch (error) {
            logger.error("Failed to mark notification as read", {
                error: error.message,
                notificationId,
            });
            throw error;
        }
    }

    /**
     * Get unread notifications for user
     * @param {string} userId - User ID
     * @param {number} limit - Maximum number of notifications to retrieve
     * @returns {Promise<Array>} Array of notifications
     */
    async getUnreadNotifications(userId, limit = 50) {
        const db = this.getFirestore();

        try {
            const snapshot = await db
                .collection("notifications")
                .where("userId", "==", userId)
                .where("read", "==", false)
                .orderBy("createdAt", "desc")
                .limit(limit)
                .get();

            const notifications = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            return notifications;
        } catch (error) {
            logger.error("Failed to get unread notifications", {
                error: error.message,
                userId,
            });
            throw error;
        }
    }
}

// Singleton instance
const firebaseAdmin = new FirebaseAdminService();

module.exports = firebaseAdmin;
