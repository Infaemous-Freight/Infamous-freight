/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Notifications Service - SMS & Push Notifications
 */

const twilio = require('twilio');
const admin = require('firebase-admin');
const logger = require('../lib/structuredLogging');

class NotificationService {
    constructor() {
        this.twilioClient = null;
        this.firebaseApp = null;
        this.notificationTemplates = {
            JOB_AVAILABLE: {
                sms: 'New delivery available: {distance}mi, ${price}. Tap to accept.',
                push: {
                    title: 'New Job Available',
                    body: '{distance} miles away, estimated time: {time} min',
                },
            },
            JOB_ACCEPTED: {
                sms: 'Your delivery was accepted by {driverName}. Rating: {rating}⭐',
                push: {
                    title: 'Driver Accepted Your Order',
                    body: '{driverName} is on the way',
                },
            },
            JOB_PICKUP_STARTED: {
                sms: '{driverName} is picking up your order. ETA: {eta} min',
                push: {
                    title: 'Picking Up Your Order',
                    body: 'ETA: {eta} minutes',
                },
            },
            JOB_IN_DELIVERY: {
                sms: 'Your delivery is on the way. Driver location shared in app.',
                push: {
                    title: 'Out for Delivery',
                    body: 'Track your delivery in real-time',
                },
            },
            JOB_DELIVERED: {
                sms: 'Your delivery is complete! Rate your experience in the app.',
                push: {
                    title: 'Delivery Complete',
                    body: 'Tap to rate your experience',
                },
            },
            RATING_REMINDER: {
                sms: "Don't forget to rate your {userType}!",
                push: {
                    title: 'Rate Your {userType}',
                    body: 'Help us improve our service',
                },
            },
            PAYMENT_FAILED: {
                sms: 'Payment failed for your delivery. Please retry in the app.',
                push: {
                    title: 'Payment Failed',
                    body: 'Tap to update payment method',
                },
            },
            DRIVER_ARRIVAL: {
                sms: '{driverName} has arrived at {location}',
                push: {
                    title: 'Driver Arrived',
                    body: '{driverName} is waiting for you',
                },
            },
            LOW_BALANCE: {
                sms: 'Your account balance is low. Add funds to continue.',
                push: {
                    title: 'Add Funds',
                    body: 'Maintain your subscription',
                },
            },
        };

        this.initializeTwilio();
        this.initializeFirebase();
    }

    /**
     * Initialize Twilio client
     */
    initializeTwilio() {
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            logger.warn('Twilio not configured, SMS disabled');
            return;
        }

        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        logger.info('Twilio SMS initialized');
    }

    /**
     * Initialize Firebase for push notifications
     */
    initializeFirebase() {
        if (!process.env.FIREBASE_CREDENTIALS) {
            logger.warn('Firebase not configured, push notifications disabled');
            return;
        }

        try {
            const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
            admin.initializeApp({
                credential: admin.credential.cert(credentials),
            });

            this.firebaseApp = admin.app();
            logger.info('Firebase push notifications initialized');
        } catch (error) {
            logger.error('Failed to initialize Firebase', { error: error.message });
        }
    }

    /**
     * Send SMS notification
     */
    async sendSMS(phoneNumber, message, correlationId = null) {
        if (!this.twilioClient) {
            logger.warn('SMS service not available', { phoneNumber, correlationId });
            return { success: false, error: 'SMS service unavailable' };
        }

        try {
            const result = await this.twilioClient.messages.create({
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber,
                body: message,
            });

            logger.info('SMS sent successfully', {
                phone: phoneNumber.slice(-4), // Log last 4 digits only
                messageId: result.sid,
                correlationId,
            });

            return { success: true, messageId: result.sid };
        } catch (error) {
            logger.error('Failed to send SMS', {
                phone: phoneNumber.slice(-4),
                error: error.message,
                correlationId,
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Send push notification
     */
    async sendPush(deviceToken, title, body, data = {}, correlationId = null) {
        if (!this.firebaseApp) {
            logger.warn('Push notification service not available', {
                deviceToken: deviceToken.slice(0, 10),
                correlationId,
            });
            return { success: false, error: 'Push service unavailable' };
        }

        try {
            const message = {
                notification: { title, body },
                data: data,
                token: deviceToken,
            };

            const result = await admin.messaging().send(message);

            logger.info('Push notification sent', {
                deviceToken: deviceToken.slice(0, 10),
                messageId: result,
                correlationId,
            });

            return { success: true, messageId: result };
        } catch (error) {
            logger.error('Failed to send push notification', {
                error: error.message,
                correlationId,
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Send templated SMS
     */
    async sendTemplateSMS(phoneNumber, templateKey, variables = {}, correlationId = null) {
        const template = this.notificationTemplates[templateKey];
        if (!template) {
            logger.warn('Template not found', { templateKey, correlationId });
            return { success: false, error: 'Template not found' };
        }

        let message = template.sms;
        Object.entries(variables).forEach(([key, value]) => {
            message = message.replace(`{${key}}`, value);
        });

        return this.sendSMS(phoneNumber, message, correlationId);
    }

    /**
     * Send templated push notification
     */
    async sendTemplatePush(deviceToken, templateKey, variables = {}, data = {}, correlationId = null) {
        const template = this.notificationTemplates[templateKey];
        if (!template) {
            logger.warn('Template not found', { templateKey, correlationId });
            return { success: false, error: 'Template not found' };
        }

        let title = template.push.title;
        let body = template.push.body;

        Object.entries(variables).forEach(([key, value]) => {
            title = title.replace(`{${key}}`, value);
            body = body.replace(`{${key}}`, value);
        });

        return this.sendPush(deviceToken, title, body, data, correlationId);
    }

    /**
     * Send multi-channel notification (SMS + Push)
     */
    async sendMultiChannel(phoneNumber, deviceToken, templateKey, variables = {}, data = {}, correlationId = null) {
        const [smsResult, pushResult] = await Promise.all([
            this.sendTemplateSMS(phoneNumber, templateKey, variables, correlationId),
            this.sendTemplatePush(deviceToken, templateKey, variables, data, correlationId),
        ]);

        return {
            success: smsResult.success || pushResult.success,
            sms: smsResult,
            push: pushResult,
        };
    }

    /**
     * Send job available notification to driver
     */
    async notifyJobAvailable(driver, job, correlationId = null) {
        const variables = {
            distance: job.distance.toFixed(1),
            price: (job.price / 100).toFixed(2),
            time: job.timeMinutes,
        };

        const data = {
            jobId: job.id,
            type: 'JOB_AVAILABLE',
        };

        return this.sendMultiChannel(
            driver.phoneNumber,
            driver.deviceToken,
            'JOB_AVAILABLE',
            variables,
            data,
            correlationId
        );
    }

    /**
     * Send job accepted notification to shipper
     */
    async notifyJobAccepted(shipper, driver, job, correlationId = null) {
        const variables = {
            driverName: driver.name,
            rating: driver.rating || 'New',
        };

        const data = {
            jobId: job.id,
            driverId: driver.id,
            type: 'JOB_ACCEPTED',
        };

        return this.sendMultiChannel(
            shipper.phoneNumber,
            shipper.deviceToken,
            'JOB_ACCEPTED',
            variables,
            data,
            correlationId
        );
    }

    /**
     * Send delivery status notification
     */
    async notifyDeliveryStatus(user, status, job, driver, correlationId = null) {
        let templateKey;

        switch (status) {
            case 'PICKED_UP':
                templateKey = 'JOB_PICKUP_STARTED';
                break;
            case 'IN_DELIVERY':
                templateKey = 'JOB_IN_DELIVERY';
                break;
            case 'DELIVERED':
                templateKey = 'JOB_DELIVERED';
                break;
            default:
                return { success: false, error: 'Unknown status' };
        }

        const variables = {
            driverName: driver.name,
            eta: job.estimatedDeliveryTime || 15,
        };

        const data = {
            jobId: job.id,
            type: templateKey,
        };

        return this.sendMultiChannel(
            user.phoneNumber,
            user.deviceToken,
            templateKey,
            variables,
            data,
            correlationId
        );
    }

    /**
     * Send rating reminder
     */
    async notifyRatingReminder(user, jobId, userType, correlationId = null) {
        const variables = { userType };
        const data = { jobId, type: 'RATING_REMINDER' };

        return this.sendMultiChannel(
            user.phoneNumber,
            user.deviceToken,
            'RATING_REMINDER',
            variables,
            data,
            correlationId
        );
    }

    /**
     * Send bulk notifications
     */
    async sendBulkNotifications(users, templateKey, variables = {}, data = {}, correlationId = null) {
        const results = [];

        for (const user of users) {
            const result = await this.sendMultiChannel(
                user.phoneNumber,
                user.deviceToken,
                templateKey,
                variables,
                data,
                correlationId
            );
            results.push({
                userId: user.id,
                ...result,
            });
        }

        const successCount = results.filter((r) => r.success).length;
        logger.info('Bulk notifications sent', {
            total: results.length,
            successful: successCount,
            correlationId,
        });

        return results;
    }

    /**
     * Get notification preferences for user
     */
    async getNotificationPreferences(userId, prisma) {
        const prefs = await prisma.userNotificationPreference.findUnique({
            where: { userId },
        });

        return {
            smsEnabled: prefs?.smsEnabled ?? true,
            pushEnabled: prefs?.pushEnabled ?? true,
            emailEnabled: prefs?.emailEnabled ?? true,
            jobAlerts: prefs?.jobAlerts ?? true,
            statusUpdates: prefs?.statusUpdates ?? true,
            promotions: prefs?.promotions ?? false,
        };
    }

    /**
     * Update notification preferences
     */
    async updateNotificationPreferences(userId, preferences, prisma) {
        return prisma.userNotificationPreference.upsert({
            where: { userId },
            update: preferences,
            create: { userId, ...preferences },
        });
    }
}

// Singleton
let instance = null;

function getInstance() {
    if (!instance) {
        instance = new NotificationService();
    }
    return instance;
}

module.exports = {
    getInstance,
    NotificationService,
};
