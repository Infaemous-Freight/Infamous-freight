/**
 * Real-Time WebSocket Service
 * Live GPS tracking, order updates, and driver notifications via Socket.IO
 * @module services/realtime
 */

const io = require("socket.io");
const jwt = require("jsonwebtoken");

class RealtimeService {
    constructor() {
        this.io = null;
        this.activeDrivers = new Map(); // driverId -> {socketId, location, shipmentId}
        this.activeShipments = new Map(); // shipmentId -> {location, status, driver}
    }

    // Initialize Socket.IO server
    initialize(httpServer) {
        this.io = new io.Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGINS || "*",
                credentials: true,
            },
            path: "/socket.io",
        });

        this.setupConnectionHandlers();
        return this.io;
    }

    // Setup connection and event handlers
    setupConnectionHandlers() {
        this.io.on("connection", (socket) => {
            socket.on("driver:connect", (data) =>
                this.onDriverConnect(socket, data),
            );
            socket.on("driver:location", (data) =>
                this.onLocationUpdate(socket, data),
            );
            socket.on("shipment:track", (data) =>
                this.onShipmentTrack(socket, data),
            );
            socket.on("disconnect", () => this.onDisconnect(socket));
        });
    }

    // Driver connects and starts broadcasting location
    onDriverConnect(socket, { token, driverId, shipmentId }) {
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) throw new Error("JWT secret not configured");

            const decoded = jwt.verify(token, secret);

            socket.userId = decoded.sub;
            socket.driverId = driverId;
            socket.shipmentId = shipmentId;
            socket.join(`driver:${driverId}`);
            socket.join(`shipment:${shipmentId}`);

            this.activeDrivers.set(driverId, {
                socketId: socket.id,
                location: null,
                shipmentId,
                connectedAt: new Date(),
            });

            // Notify shipment watchers
            socket.emit("driver:connected", {
                driverId,
                message: "Driver is now live tracking",
            });

            this.io
                .to(`shipment:${shipmentId}`)
                .emit("driver:status", { status: "live", driverId });
        } catch (err) {
            socket.emit("error", { message: "Authentication failed" });
            socket.disconnect();
        }
    }

    // Driver sends GPS location update
    onLocationUpdate(socket, { latitude, longitude, timestamp }) {
        const driverId = socket.driverId;
        const shipmentId = socket.shipmentId;

        if (!driverId || !shipmentId) return;

        const locationUpdate = {
            driverId,
            latitude,
            longitude,
            timestamp: timestamp || new Date().toISOString(),
            accuracy: "high",
        };

        // Update active driver location
        const driver = this.activeDrivers.get(driverId);
        if (driver) {
            driver.location = { latitude, longitude, timestamp };
        }

        // Update shipment location
        if (!this.activeShipments.has(shipmentId)) {
            this.activeShipments.set(shipmentId, {
                locations: [],
                driverId,
                status: "in_transit",
            });
        }

        const shipment = this.activeShipments.get(shipmentId);
        shipment.locations.push(locationUpdate);

        // Broadcast to all watchers of this shipment
        this.io.to(`shipment:${shipmentId}`).emit("location:update", {
            shipmentId,
            ...locationUpdate,
            eta: this.calculateETA(shipment.locations),
        });

        // Broadcast to driver's followers
        this.io.to(`driver:${driverId}`).emit("driver:location", locationUpdate);
    }

    // Customer tracks a shipment
    onShipmentTrack(socket, { shipmentId, token }) {
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) throw new Error("JWT secret not configured");

            jwt.verify(token, secret);

            socket.join(`shipment:${shipmentId}`);

            const shipment = this.activeShipments.get(shipmentId);

            socket.emit("shipment:tracking", {
                shipmentId,
                status: shipment ? shipment.status : "pending",
                location: shipment ? shipment.locations[shipment.locations.length - 1] : null,
                watchersCount: this.io.sockets.adapter.rooms.get(`shipment:${shipmentId}`)
                    ?.size || 0,
            });
        } catch (err) {
            socket.emit("error", { message: "Invalid tracking token" });
        }
    }

    // Handle disconnection
    onDisconnect(socket) {
        const driverId = socket.driverId;
        const shipmentId = socket.shipmentId;

        if (driverId) {
            this.activeDrivers.delete(driverId);

            this.io.to(`shipment:${shipmentId}`).emit("driver:status", {
                status: "offline",
                driverId,
            });
        }
    }

    // Calculate ETA based on location history
    calculateETA(locations, destinationCoords = null) {
        if (locations.length < 2) return null;

        const recent = locations.slice(-5); // Last 5 location points
        const distances = [];

        for (let i = 1; i < recent.length; i++) {
            const dist = this.haversineDistance(
                recent[i - 1].latitude,
                recent[i - 1].longitude,
                recent[i].latitude,
                recent[i].longitude,
            );
            distances.push(dist);
        }

        const avgSpeed = distances.reduce((a, b) => a + b, 0) / distances.length;
        const remainingDistance = destinationCoords
            ? this.haversineDistance(
                recent[recent.length - 1].latitude,
                recent[recent.length - 1].longitude,
                destinationCoords.lat,
                destinationCoords.lng,
            )
            : 50; // Default 50 km

        const estimatedMinutes = Math.ceil((remainingDistance / avgSpeed) * 60);

        return new Date(Date.now() + estimatedMinutes * 60000).toISOString();
    }

    // Haversine formula for distance calculation
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
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

    // Get active driver status
    getDriverStatus(driverId) {
        return this.activeDrivers.get(driverId) || null;
    }

    // Get shipment tracking status
    getShipmentStatus(shipmentId) {
        return this.activeShipments.get(shipmentId) || null;
    }

    // Get all active drivers
    getActiveDrivers() {
        return Array.from(this.activeDrivers.entries()).map(([id, data]) => ({
            driverId: id,
            ...data,
        }));
    }

    // Broadcast message to shipment watchers
    broadcastToShipment(shipmentId, event, data) {
        this.io.to(`shipment:${shipmentId}`).emit(event, data);
    }
}

module.exports = new RealtimeService();
