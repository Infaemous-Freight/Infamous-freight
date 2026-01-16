/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * WebSocket Real-Time Updates Service
 * Handles real-time job updates, driver location, and notifications
 */

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../lib/structuredLogging');

class RealtimeService {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // userId -> Set of socket IDs
        this.driverLocations = new Map(); // driverId -> { lat, lng, timestamp }
    }

    /**
     * Initialize Socket.io with HTTP server
     */
    initialize(httpServer) {
        this.io = socketIO(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGINS || 'http://localhost:3000',
                methods: ['GET', 'POST'],
            },
            transports: ['websocket', 'polling'],
        });

        // Middleware for authentication
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            try {
                const secret = process.env.JWT_SECRET || 'test-secret';
                const payload = jwt.verify(token, secret);
                socket.user = payload;
                next();
            } catch (error) {
                next(new Error('Invalid token'));
            }
        });

        // Connection handler
        this.io.on('connection', (socket) => {
            const userId = socket.user.sub;
            logger.info('User connected via WebSocket', { userId, socketId: socket.id });

            // Track user sockets
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(socket.id);

            // Join user-specific room
            socket.join(`user:${userId}`);

            // Handle job updates
            socket.on('job:subscribe', (jobId) => {
                socket.join(`job:${jobId}`);
                logger.info('User subscribed to job updates', { userId, jobId });
            });

            socket.on('job:unsubscribe', (jobId) => {
                socket.leave(`job:${jobId}`);
            });

            // Handle driver location updates
            socket.on('driver:location', (data) => {
                const { jobId, latitude, longitude } = data;
                this.driverLocations.set(userId, {
                    lat: latitude,
                    lng: longitude,
                    timestamp: Date.now(),
                    jobId,
                });

                // Broadcast to job participants
                this.io.to(`job:${jobId}`).emit('driver:location:update', {
                    driverId: userId,
                    latitude,
                    longitude,
                    timestamp: Date.now(),
                });

                logger.debug('Driver location updated', { driverId: userId, jobId });
            });

            // Handle nearby driver subscription
            socket.on('drivers:subscribe', (data) => {
                const { jobId, latitude, longitude } = data;
                socket.join(`nearby:${jobId}`);
                logger.info('Shipper subscribed to driver updates', { shipperId: userId, jobId });
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                const userSockets = this.userSockets.get(userId);
                if (userSockets) {
                    userSockets.delete(socket.id);
                    if (userSockets.size === 0) {
                        this.userSockets.delete(userId);
                        this.driverLocations.delete(userId);
                    }
                }
                logger.info('User disconnected from WebSocket', { userId, socketId: socket.id });
            });

            // Error handler
            socket.on('error', (error) => {
                logger.error('WebSocket error', { userId, error: error.message });
            });
        });

        logger.info('WebSocket server initialized');
        return this.io;
    }

    /**
     * Emit job status change to all participants
     */
    emitJobStatusChange(jobId, status, details) {
        this.io.to(`job:${jobId}`).emit('job:status:changed', {
            jobId,
            status,
            ...details,
            timestamp: Date.now(),
        });

        logger.info('Job status change broadcasted', { jobId, status });
    }

    /**
     * Emit job acceptance notification
     */
    emitJobAccepted(jobId, driverId, driverInfo) {
        this.io.to(`job:${jobId}`).emit('job:accepted', {
            jobId,
            driverId,
            driverName: driverInfo.name,
            driverRating: driverInfo.rating,
            vehicleInfo: driverInfo.vehicleInfo,
            timestamp: Date.now(),
        });

        logger.info('Job acceptance broadcasted', { jobId, driverId });
    }

    /**
     * Emit pickup notification
     */
    emitPickupStarted(jobId, driverId, eta) {
        this.io.to(`job:${jobId}`).emit('job:pickup:started', {
            jobId,
            driverId,
            eta,
            timestamp: Date.now(),
        });

        logger.info('Pickup started notification', { jobId, driverId });
    }

    /**
     * Emit delivery started notification
     */
    emitDeliveryStarted(jobId, driverId, eta) {
        this.io.to(`job:${jobId}`).emit('job:delivery:started', {
            jobId,
            driverId,
            eta,
            timestamp: Date.now(),
        });

        logger.info('Delivery started notification', { jobId, driverId });
    }

    /**
     * Emit delivery completed notification
     */
    emitDeliveryCompleted(jobId, driverId, proof) {
        this.io.to(`job:${jobId}`).emit('job:completed', {
            jobId,
            driverId,
            proof,
            timestamp: Date.now(),
        });

        logger.info('Delivery completed notification', { jobId, driverId });
    }

    /**
     * Emit new job available notification to drivers
     */
    emitNewJobAvailable(job, nearbyDriverIds) {
        nearbyDriverIds.forEach((driverId) => {
            this.io.to(`user:${driverId}`).emit('job:available', {
                jobId: job.id,
                pickup: job.pickup,
                dropoff: job.dropoff,
                distance: job.distance,
                estimatedTime: job.timeMinutes,
                price: job.price,
                timestamp: Date.now(),
            });
        });

        logger.info('New job broadcasted to nearby drivers', {
            jobId: job.id,
            driverCount: nearbyDriverIds.length,
        });
    }

    /**
     * Emit rating reminder
     */
    emitRatingReminder(jobId, userId, userType) {
        this.io.to(`user:${userId}`).emit('job:rate:reminder', {
            jobId,
            userType, // 'shipper' or 'driver'
            timestamp: Date.now(),
        });

        logger.info('Rating reminder sent', { jobId, userId });
    }

    /**
     * Emit real-time chat message
     */
    emitChatMessage(jobId, userId, message, senderType) {
        this.io.to(`job:${jobId}`).emit('chat:message', {
            jobId,
            userId,
            senderType,
            message,
            timestamp: Date.now(),
        });

        logger.debug('Chat message broadcasted', { jobId });
    }

    /**
     * Emit system notification
     */
    emitNotification(userId, type, title, message) {
        this.io.to(`user:${userId}`).emit('notification', {
            type,
            title,
            message,
            timestamp: Date.now(),
        });

        logger.info('Notification sent', { userId, type });
    }

    /**
     * Get online drivers
     */
    getOnlineDrivers() {
        return Array.from(this.driverLocations.entries()).map(([driverId, location]) => ({
            driverId,
            ...location,
        }));
    }

    /**
     * Get nearby drivers for a job
     */
    getNearbyDrivers(latitude, longitude, radiusKm = 10) {
        const radiusMeters = radiusKm * 1000;
        const drivers = [];

        this.driverLocations.forEach((location, driverId) => {
            // Haversine distance calculation (simplified)
            const distance = this.calculateDistance(
                latitude,
                longitude,
                location.lat,
                location.lng
            );

            if (distance <= radiusKm) {
                drivers.push({
                    driverId,
                    distance,
                    ...location,
                });
            }
        });

        return drivers.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Calculate distance between two coordinates (Haversine)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Get user socket count
     */
    getUserSocketCount(userId) {
        const sockets = this.userSockets.get(userId);
        return sockets ? sockets.size : 0;
    }

    /**
     * Get total connected users
     */
    getConnectedUserCount() {
        return this.userSockets.size;
    }
}

// Singleton
let instance = null;

function getInstance() {
    if (!instance) {
        instance = new RealtimeService();
    }
    return instance;
}

module.exports = {
    getInstance,
    RealtimeService,
};
