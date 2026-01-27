/**
 * GPS Satellite Tracking Service
 * Real-time location tracking, geofencing, route optimization, and analytics
 * Supports vehicles, drivers, and shipments with live updates
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
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
 * Calculate bearing between two GPS coordinates
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Bearing in degrees (0-360)
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
    const x =
        Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
        Math.sin((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
}

/**
 * Calculate estimated time of arrival based on distance and speed
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} speedKmh - Current speed in km/h
 * @returns {Date} Estimated arrival time
 */
function calculateETA(distanceKm, speedKmh) {
    if (speedKmh <= 0) return null;
    const hoursRemaining = distanceKm / speedKmh;
    const eta = new Date();
    eta.setTime(eta.getTime() + hoursRemaining * 60 * 60 * 1000);
    return eta;
}

class TrackingService {
    /**
     * Update GPS location for a trackable entity (vehicle, driver, shipment)
     * @param {Object} params - Location update parameters
     * @returns {Promise<Object>} Updated location data
     */
    async updateLocation(params) {
        const {
            entityType,
            entityId,
            latitude,
            longitude,
            altitude,
            speed,
            heading,
            accuracy,
            source,
            metadata,
        } = params;

        // Validate coordinates
        if (latitude < -90 || latitude > 90) {
            throw new Error("Invalid latitude. Must be between -90 and 90");
        }
        if (longitude < -180 || longitude > 180) {
            throw new Error("Invalid longitude. Must be between -180 and 180");
        }

        // Get previous location to calculate distance traveled
        const previousLocation = await prisma.location.findFirst({
            where: { entityType, entityId },
            orderBy: { timestamp: "desc" },
        });

        let distanceTraveled = 0;
        let bearing = null;

        if (previousLocation) {
            distanceTraveled = calculateDistance(
                previousLocation.latitude,
                previousLocation.longitude,
                latitude,
                longitude,
            );
            bearing = calculateBearing(
                previousLocation.latitude,
                previousLocation.longitude,
                latitude,
                longitude,
            );
        }

        // Create new location record
        const location = await prisma.location.create({
            data: {
                entityType,
                entityId,
                latitude,
                longitude,
                altitude: altitude || null,
                speed: speed || null,
                heading: heading || bearing,
                accuracy: accuracy || null,
                source: source || "gps",
                metadata: metadata || {},
                timestamp: new Date(),
            },
        });

        // Update tracking summary
        await this.updateTrackingSummary({
            entityType,
            entityId,
            latitude,
            longitude,
            speed,
            distanceTraveled,
        });

        // Check geofences
        await this.checkGeofences(entityType, entityId, latitude, longitude);

        // Update shipment status if tracking a shipment
        if (entityType === "shipment") {
            await this.updateShipmentProgress(entityId, latitude, longitude);
        }

        return {
            location,
            distanceTraveled,
            bearing,
            previousLocation: previousLocation
                ? {
                    latitude: previousLocation.latitude,
                    longitude: previousLocation.longitude,
                    timestamp: previousLocation.timestamp,
                }
                : null,
        };
    }

    /**
     * Update tracking summary with latest location data
     * @param {Object} params - Summary update parameters
     */
    async updateTrackingSummary(params) {
        const { entityType, entityId, latitude, longitude, speed, distanceTraveled } =
            params;

        const existing = await prisma.trackingSummary.findUnique({
            where: {
                entityType_entityId: { entityType, entityId },
            },
        });

        if (existing) {
            await prisma.trackingSummary.update({
                where: {
                    entityType_entityId: { entityType, entityId },
                },
                data: {
                    currentLatitude: latitude,
                    currentLongitude: longitude,
                    currentSpeed: speed || existing.currentSpeed,
                    lastUpdated: new Date(),
                    totalDistanceTraveled: {
                        increment: distanceTraveled || 0,
                    },
                    totalUpdates: {
                        increment: 1,
                    },
                },
            });
        } else {
            await prisma.trackingSummary.create({
                data: {
                    entityType,
                    entityId,
                    currentLatitude: latitude,
                    currentLongitude: longitude,
                    currentSpeed: speed || 0,
                    lastUpdated: new Date(),
                    totalDistanceTraveled: distanceTraveled || 0,
                    totalUpdates: 1,
                },
            });
        }
    }

    /**
     * Get current location for an entity
     * @param {string} entityType - Type of entity (vehicle, driver, shipment)
     * @param {string} entityId - Entity ID
     * @returns {Promise<Object>} Current location data
     */
    async getCurrentLocation(entityType, entityId) {
        const location = await prisma.location.findFirst({
            where: { entityType, entityId },
            orderBy: { timestamp: "desc" },
        });

        if (!location) {
            return null;
        }

        const summary = await prisma.trackingSummary.findUnique({
            where: {
                entityType_entityId: { entityType, entityId },
            },
        });

        // Check if location is stale (>5 minutes old)
        const ageMinutes = (Date.now() - location.timestamp.getTime()) / 1000 / 60;
        const isStale = ageMinutes > 5;

        return {
            ...location,
            summary,
            isStale,
            ageMinutes: Math.round(ageMinutes),
            metadata: location.metadata || {},
        };
    }

    /**
     * Get location history for an entity
     * @param {Object} params - History query parameters
     * @returns {Promise<Array>} Location history
     */
    async getLocationHistory(params) {
        const {
            entityType,
            entityId,
            startTime,
            endTime,
            limit = 1000,
        } = params;

        const where = {
            entityType,
            entityId,
        };

        if (startTime || endTime) {
            where.timestamp = {};
            if (startTime) where.timestamp.gte = new Date(startTime);
            if (endTime) where.timestamp.lte = new Date(endTime);
        }

        const locations = await prisma.location.findMany({
            where,
            orderBy: { timestamp: "desc" },
            take: limit,
        });

        // Calculate total distance traveled
        let totalDistance = 0;
        for (let i = 0; i < locations.length - 1; i++) {
            const current = locations[i];
            const next = locations[i + 1];
            totalDistance += calculateDistance(
                current.latitude,
                current.longitude,
                next.latitude,
                next.longitude,
            );
        }

        return {
            locations,
            totalDistance: Math.round(totalDistance * 100) / 100,
            count: locations.length,
            startTime: locations[locations.length - 1]?.timestamp,
            endTime: locations[0]?.timestamp,
        };
    }

    /**
     * Create a geofence zone
     * @param {Object} params - Geofence parameters
     * @returns {Promise<Object>} Created geofence
     */
    async createGeofence(params) {
        const {
            name,
            type,
            latitude,
            longitude,
            radiusMeters,
            polygon,
            entityType,
            entityId,
            alertOnEnter,
            alertOnExit,
            active,
            metadata,
        } = params;

        // Validate geofence type
        if (type === "circle" && (!latitude || !longitude || !radiusMeters)) {
            throw new Error("Circle geofence requires latitude, longitude, and radiusMeters");
        }
        if (type === "polygon" && (!polygon || polygon.length < 3)) {
            throw new Error("Polygon geofence requires at least 3 points");
        }

        const geofence = await prisma.geofence.create({
            data: {
                name,
                type,
                centerLatitude: latitude || null,
                centerLongitude: longitude || null,
                radiusMeters: radiusMeters || null,
                polygon: polygon || [],
                entityType: entityType || null,
                entityId: entityId || null,
                alertOnEnter: alertOnEnter !== false,
                alertOnExit: alertOnExit !== false,
                active: active !== false,
                metadata: metadata || {},
            },
        });

        return geofence;
    }

    /**
     * Check if a location is inside a geofence
     * @param {string} entityType - Entity type
     * @param {string} entityId - Entity ID
     * @param {number} latitude - Latitude to check
     * @param {number} longitude - Longitude to check
     */
    async checkGeofences(entityType, entityId, latitude, longitude) {
        // Get active geofences for this entity
        const geofences = await prisma.geofence.findMany({
            where: {
                active: true,
                OR: [
                    { entityType: null }, // Global geofences
                    { entityType, entityId }, // Entity-specific geofences
                ],
            },
        });

        for (const geofence of geofences) {
            const isInside = this.isPointInGeofence(
                latitude,
                longitude,
                geofence,
            );

            // Get previous state
            const previousEvent = await prisma.geofenceEvent.findFirst({
                where: {
                    geofenceId: geofence.id,
                    entityType,
                    entityId,
                },
                orderBy: { timestamp: "desc" },
            });

            const wasInside = previousEvent?.eventType === "enter";

            // Detect enter/exit events
            if (isInside && !wasInside && geofence.alertOnEnter) {
                await this.createGeofenceEvent({
                    geofenceId: geofence.id,
                    entityType,
                    entityId,
                    eventType: "enter",
                    latitude,
                    longitude,
                });
            } else if (!isInside && wasInside && geofence.alertOnExit) {
                await this.createGeofenceEvent({
                    geofenceId: geofence.id,
                    entityType,
                    entityId,
                    eventType: "exit",
                    latitude,
                    longitude,
                });
            }
        }
    }

    /**
     * Check if a point is inside a geofence
     * @param {number} latitude - Latitude to check
     * @param {number} longitude - Longitude to check
     * @param {Object} geofence - Geofence definition
     * @returns {boolean} True if point is inside geofence
     */
    isPointInGeofence(latitude, longitude, geofence) {
        if (geofence.type === "circle") {
            const distance = calculateDistance(
                latitude,
                longitude,
                geofence.centerLatitude,
                geofence.centerLongitude,
            );
            return distance * 1000 <= geofence.radiusMeters;
        }

        if (geofence.type === "polygon") {
            return this.isPointInPolygon(latitude, longitude, geofence.polygon);
        }

        return false;
    }

    /**
     * Check if a point is inside a polygon using ray casting algorithm
     * @param {number} latitude - Latitude to check
     * @param {number} longitude - Longitude to check
     * @param {Array} polygon - Polygon points [{lat, lng}, ...]
     * @returns {boolean} True if point is inside polygon
     */
    isPointInPolygon(latitude, longitude, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].lat;
            const yi = polygon[i].lng;
            const xj = polygon[j].lat;
            const yj = polygon[j].lng;

            const intersect =
                yi > longitude !== yj > longitude &&
                latitude < ((xj - xi) * (longitude - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    }

    /**
     * Create a geofence event
     * @param {Object} params - Event parameters
     */
    async createGeofenceEvent(params) {
        const { geofenceId, entityType, entityId, eventType, latitude, longitude } =
            params;

        const event = await prisma.geofenceEvent.create({
            data: {
                geofenceId,
                entityType,
                entityId,
                eventType,
                latitude,
                longitude,
                timestamp: new Date(),
            },
        });

        // Create alert
        const geofence = await prisma.geofence.findUnique({
            where: { id: geofenceId },
        });

        await prisma.trackingAlert.create({
            data: {
                entityType,
                entityId,
                alertType: eventType === "enter" ? "geofence_entry" : "geofence_exit",
                severity: "info",
                message: `${entityType} ${eventType === "enter" ? "entered" : "exited"} geofence: ${geofence.name}`,
                metadata: {
                    geofenceId,
                    geofenceName: geofence.name,
                    latitude,
                    longitude,
                },
                acknowledged: false,
            },
        });

        return event;
    }

    /**
     * Update shipment progress based on current location
     * @param {string} shipmentId - Shipment ID
     * @param {number} latitude - Current latitude
     * @param {number} longitude - Current longitude
     */
    async updateShipmentProgress(shipmentId, latitude, longitude) {
        // Get shipment details with route
        const route = await prisma.route.findFirst({
            where: { shipmentId },
            orderBy: { createdAt: "desc" },
        });

        if (!route || !route.destinationLatitude || !route.destinationLongitude) {
            return;
        }

        // Calculate distance to destination
        const distanceRemaining = calculateDistance(
            latitude,
            longitude,
            route.destinationLatitude,
            route.destinationLongitude,
        );

        // Calculate progress percentage
        const totalDistance = route.totalDistanceKm || distanceRemaining;
        const distanceTraveled = totalDistance - distanceRemaining;
        const progressPercent = Math.min(
            100,
            Math.max(0, (distanceTraveled / totalDistance) * 100),
        );

        // Get current speed from tracking summary
        const summary = await prisma.trackingSummary.findUnique({
            where: {
                entityType_entityId: {
                    entityType: "shipment",
                    entityId: shipmentId,
                },
            },
        });

        const currentSpeed = summary?.currentSpeed || 60; // Default 60 km/h
        const eta = calculateETA(distanceRemaining, currentSpeed);

        // Update route with progress
        await prisma.route.update({
            where: { id: route.id },
            data: {
                distanceRemainingKm: distanceRemaining,
                progressPercent: Math.round(progressPercent * 100) / 100,
                estimatedArrival: eta,
                lastUpdated: new Date(),
            },
        });

        // Create alert if shipment is delayed
        if (eta && route.expectedArrival && eta > route.expectedArrival) {
            const delayMinutes = Math.round((eta - route.expectedArrival) / 1000 / 60);
            if (delayMinutes > 30) {
                // Only alert if delay > 30 minutes
                await prisma.trackingAlert.create({
                    data: {
                        entityType: "shipment",
                        entityId: shipmentId,
                        alertType: "delay",
                        severity: delayMinutes > 60 ? "high" : "medium",
                        message: `Shipment delayed by ${delayMinutes} minutes`,
                        metadata: {
                            delayMinutes,
                            expectedArrival: route.expectedArrival,
                            estimatedArrival: eta,
                            distanceRemaining,
                        },
                        acknowledged: false,
                    },
                });
            }
        }

        // Create alert if approaching destination (within 5 km)
        if (distanceRemaining <= 5 && distanceRemaining > 0) {
            const recentAlerts = await prisma.trackingAlert.findFirst({
                where: {
                    entityType: "shipment",
                    entityId: shipmentId,
                    alertType: "approaching_destination",
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
                    },
                },
            });

            if (!recentAlerts) {
                await prisma.trackingAlert.create({
                    data: {
                        entityType: "shipment",
                        entityId: shipmentId,
                        alertType: "approaching_destination",
                        severity: "info",
                        message: `Shipment is ${Math.round(distanceRemaining * 10) / 10} km from destination`,
                        metadata: {
                            distanceRemaining,
                            eta,
                        },
                        acknowledged: false,
                    },
                });
            }
        }
    }

    /**
     * Get tracking analytics for an entity
     * @param {Object} params - Analytics parameters
     * @returns {Promise<Object>} Analytics data
     */
    async getAnalytics(params) {
        const { entityType, entityId, startTime, endTime } = params;

        const where = {
            entityType,
            entityId,
        };

        if (startTime || endTime) {
            where.timestamp = {};
            if (startTime) where.timestamp.gte = new Date(startTime);
            if (endTime) where.timestamp.lte = new Date(endTime);
        }

        const locations = await prisma.location.findMany({
            where,
            orderBy: { timestamp: "asc" },
        });

        if (locations.length === 0) {
            return {
                totalDistance: 0,
                averageSpeed: 0,
                maxSpeed: 0,
                totalTime: 0,
                stops: [],
                analytics: {},
            };
        }

        // Calculate metrics
        let totalDistance = 0;
        let totalSpeed = 0;
        let speedCount = 0;
        let maxSpeed = 0;
        const stops = [];
        let lastStop = null;

        for (let i = 0; i < locations.length - 1; i++) {
            const current = locations[i];
            const next = locations[i + 1];

            const distance = calculateDistance(
                current.latitude,
                current.longitude,
                next.latitude,
                next.longitude,
            );
            totalDistance += distance;

            if (current.speed !== null) {
                totalSpeed += current.speed;
                speedCount++;
                maxSpeed = Math.max(maxSpeed, current.speed);
            }

            // Detect stops (speed < 5 km/h for > 5 minutes)
            if (current.speed !== null && current.speed < 5) {
                const timeDiff = (next.timestamp - current.timestamp) / 1000 / 60;
                if (timeDiff >= 5) {
                    if (!lastStop || lastStop.endTime < current.timestamp) {
                        lastStop = {
                            startTime: current.timestamp,
                            endTime: next.timestamp,
                            duration: timeDiff,
                            latitude: current.latitude,
                            longitude: current.longitude,
                        };
                        stops.push(lastStop);
                    } else {
                        lastStop.endTime = next.timestamp;
                        lastStop.duration += timeDiff;
                    }
                }
            }
        }

        const totalTime =
            (locations[locations.length - 1].timestamp - locations[0].timestamp) /
            1000 /
            60; // Minutes
        const averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

        return {
            totalDistance: Math.round(totalDistance * 100) / 100,
            averageSpeed: Math.round(averageSpeed * 100) / 100,
            maxSpeed: Math.round(maxSpeed * 100) / 100,
            totalTime: Math.round(totalTime),
            stopCount: stops.length,
            stops: stops.map((stop) => ({
                ...stop,
                duration: Math.round(stop.duration),
            })),
            startLocation: {
                latitude: locations[0].latitude,
                longitude: locations[0].longitude,
                timestamp: locations[0].timestamp,
            },
            endLocation: {
                latitude: locations[locations.length - 1].latitude,
                longitude: locations[locations.length - 1].longitude,
                timestamp: locations[locations.length - 1].timestamp,
            },
        };
    }

    /**
     * Get active tracking alerts
     * @param {Object} params - Alert query parameters
     * @returns {Promise<Array>} Active alerts
     */
    async getAlerts(params) {
        const {
            entityType,
            entityId,
            alertType,
            severity,
            acknowledged,
            limit = 100,
        } = params;

        const where = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (alertType) where.alertType = alertType;
        if (severity) where.severity = severity;
        if (acknowledged !== undefined) where.acknowledged = acknowledged;

        const alerts = await prisma.trackingAlert.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return alerts;
    }

    /**
     * Acknowledge an alert
     * @param {string} alertId - Alert ID
     * @param {string} acknowledgedBy - User who acknowledged the alert
     */
    async acknowledgeAlert(alertId, acknowledgedBy) {
        const alert = await prisma.trackingAlert.update({
            where: { id: alertId },
            data: {
                acknowledged: true,
                acknowledgedAt: new Date(),
                acknowledgedBy,
            },
        });

        return alert;
    }

    /**
     * Get all entities currently being tracked
     * @returns {Promise<Array>} List of tracked entities
     */
    async getTrackedEntities() {
        const summaries = await prisma.trackingSummary.findMany({
            orderBy: { lastUpdated: "desc" },
        });

        return summaries.map((summary) => {
            const ageMinutes =
                (Date.now() - summary.lastUpdated.getTime()) / 1000 / 60;
            return {
                ...summary,
                isActive: ageMinutes <= 5,
                ageMinutes: Math.round(ageMinutes),
            };
        });
    }
}

module.exports = new TrackingService();
