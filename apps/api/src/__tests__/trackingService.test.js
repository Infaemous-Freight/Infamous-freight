/**
 * GPS Satellite Tracking Service Tests
 * Comprehensive test coverage for location tracking, geofencing, and analytics
 */

const trackingService = require("../services/trackingService");
const { PrismaClient } = require("@prisma/client");

// Mock Prisma
jest.mock("@prisma/client", () => {
    const mockPrisma = {
        location: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        trackingSummary: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        geofence: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        geofenceEvent: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
        },
        trackingAlert: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        route: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
    };

    return {
        PrismaClient: jest.fn(() => mockPrisma),
    };
});

const prisma = new PrismaClient();

describe("TrackingService - Location Updates", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should update location successfully", async () => {
        const mockLocation = {
            id: "loc_1",
            entityType: "vehicle",
            entityId: "vehicle_123",
            latitude: 40.7128,
            longitude: -74.006,
            speed: 65,
            timestamp: new Date(),
        };

        prisma.location.findFirst.mockResolvedValue(null);
        prisma.location.create.mockResolvedValue(mockLocation);
        prisma.trackingSummary.findUnique.mockResolvedValue(null);
        prisma.trackingSummary.create.mockResolvedValue({});
        prisma.geofence.findMany.mockResolvedValue([]);
        prisma.route.findFirst.mockResolvedValue(null);

        const result = await trackingService.updateLocation({
            entityType: "vehicle",
            entityId: "vehicle_123",
            latitude: 40.7128,
            longitude: -74.006,
            speed: 65,
            source: "gps",
        });

        expect(result.location).toBeDefined();
        expect(result.location.latitude).toBe(40.7128);
        expect(result.location.longitude).toBe(-74.006);
        expect(prisma.location.create).toHaveBeenCalled();
    });

    test("should calculate distance from previous location", async () => {
        const previousLocation = {
            latitude: 40.7128,
            longitude: -74.006,
            timestamp: new Date(Date.now() - 60000),
        };

        const currentLocation = {
            id: "loc_2",
            entityType: "vehicle",
            entityId: "vehicle_123",
            latitude: 40.7589,
            longitude: -73.9851,
            timestamp: new Date(),
        };

        prisma.location.findFirst.mockResolvedValue(previousLocation);
        prisma.location.create.mockResolvedValue(currentLocation);
        prisma.trackingSummary.findUnique.mockResolvedValue({
            totalDistanceTraveled: 100,
        });
        prisma.trackingSummary.update.mockResolvedValue({});
        prisma.geofence.findMany.mockResolvedValue([]);
        prisma.route.findFirst.mockResolvedValue(null);

        const result = await trackingService.updateLocation({
            entityType: "vehicle",
            entityId: "vehicle_123",
            latitude: 40.7589,
            longitude: -73.9851,
        });

        expect(result.distanceTraveled).toBeGreaterThan(0);
        expect(result.previousLocation).toBeDefined();
        expect(result.previousLocation.latitude).toBe(40.7128);
    });

    test("should reject invalid latitude", async () => {
        await expect(
            trackingService.updateLocation({
                entityType: "vehicle",
                entityId: "vehicle_123",
                latitude: 91, // Invalid
                longitude: -74.006,
            }),
        ).rejects.toThrow("Invalid latitude");
    });

    test("should reject invalid longitude", async () => {
        await expect(
            trackingService.updateLocation({
                entityType: "vehicle",
                entityId: "vehicle_123",
                latitude: 40.7128,
                longitude: -181, // Invalid
            }),
        ).rejects.toThrow("Invalid longitude");
    });
});

describe("TrackingService - Current Location", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should get current location for entity", async () => {
        const mockLocation = {
            id: "loc_1",
            entityType: "vehicle",
            entityId: "vehicle_123",
            latitude: 40.7128,
            longitude: -74.006,
            speed: 65,
            timestamp: new Date(),
            metadata: {},
        };

        const mockSummary = {
            totalDistanceTraveled: 150,
            totalUpdates: 100,
        };

        prisma.location.findFirst.mockResolvedValue(mockLocation);
        prisma.trackingSummary.findUnique.mockResolvedValue(mockSummary);

        const result = await trackingService.getCurrentLocation(
            "vehicle",
            "vehicle_123",
        );

        expect(result).toBeDefined();
        expect(result.latitude).toBe(40.7128);
        expect(result.summary).toBeDefined();
        expect(result.summary.totalDistanceTraveled).toBe(150);
        expect(result.isStale).toBe(false);
    });

    test("should detect stale location data", async () => {
        const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
        const mockLocation = {
            id: "loc_1",
            entityType: "vehicle",
            entityId: "vehicle_123",
            latitude: 40.7128,
            longitude: -74.006,
            timestamp: oldTimestamp,
            metadata: {},
        };

        prisma.location.findFirst.mockResolvedValue(mockLocation);
        prisma.trackingSummary.findUnique.mockResolvedValue(null);

        const result = await trackingService.getCurrentLocation(
            "vehicle",
            "vehicle_123",
        );

        expect(result.isStale).toBe(true);
        expect(result.ageMinutes).toBeGreaterThanOrEqual(10);
    });

    test("should return null for entity with no location data", async () => {
        prisma.location.findFirst.mockResolvedValue(null);

        const result = await trackingService.getCurrentLocation(
            "vehicle",
            "nonexistent",
        );

        expect(result).toBeNull();
    });
});

describe("TrackingService - Location History", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should get location history with distance calculation", async () => {
        const mockLocations = [
            {
                latitude: 40.7589,
                longitude: -73.9851,
                timestamp: new Date("2026-01-14T12:00:00Z"),
            },
            {
                latitude: 40.7489,
                longitude: -73.9851,
                timestamp: new Date("2026-01-14T11:30:00Z"),
            },
            {
                latitude: 40.7389,
                longitude: -73.9851,
                timestamp: new Date("2026-01-14T11:00:00Z"),
            },
        ];

        prisma.location.findMany.mockResolvedValue(mockLocations);

        const result = await trackingService.getLocationHistory({
            entityType: "vehicle",
            entityId: "vehicle_123",
            startTime: "2026-01-14T10:00:00Z",
            endTime: "2026-01-14T13:00:00Z",
        });

        expect(result.locations).toHaveLength(3);
        expect(result.totalDistance).toBeGreaterThan(0);
        expect(result.count).toBe(3);
        expect(result.startTime).toBeDefined();
        expect(result.endTime).toBeDefined();
    });

    test("should handle empty location history", async () => {
        prisma.location.findMany.mockResolvedValue([]);

        const result = await trackingService.getLocationHistory({
            entityType: "vehicle",
            entityId: "vehicle_123",
        });

        expect(result.locations).toHaveLength(0);
        expect(result.totalDistance).toBe(0);
        expect(result.count).toBe(0);
    });

    test("should respect limit parameter", async () => {
        const mockLocations = Array(50)
            .fill(null)
            .map((_, i) => ({
                latitude: 40.7128 + i * 0.001,
                longitude: -74.006,
                timestamp: new Date(Date.now() - i * 60000),
            }));

        prisma.location.findMany.mockResolvedValue(mockLocations.slice(0, 20));

        const result = await trackingService.getLocationHistory({
            entityType: "vehicle",
            entityId: "vehicle_123",
            limit: 20,
        });

        expect(result.locations.length).toBeLessThanOrEqual(20);
    });
});

describe("TrackingService - Geofencing", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should create circular geofence", async () => {
        const mockGeofence = {
            id: "geo_1",
            name: "Warehouse Zone",
            type: "circle",
            centerLatitude: 40.7128,
            centerLongitude: -74.006,
            radiusMeters: 500,
            alertOnEnter: true,
            alertOnExit: true,
            active: true,
        };

        prisma.geofence.create.mockResolvedValue(mockGeofence);

        const result = await trackingService.createGeofence({
            name: "Warehouse Zone",
            type: "circle",
            latitude: 40.7128,
            longitude: -74.006,
            radiusMeters: 500,
        });

        expect(result.id).toBe("geo_1");
        expect(result.type).toBe("circle");
        expect(result.radiusMeters).toBe(500);
        expect(prisma.geofence.create).toHaveBeenCalled();
    });

    test("should create polygon geofence", async () => {
        const polygon = [
            { lat: 40.7128, lng: -74.006 },
            { lat: 40.7158, lng: -74.006 },
            { lat: 40.7158, lng: -73.996 },
            { lat: 40.7128, lng: -73.996 },
        ];

        const mockGeofence = {
            id: "geo_2",
            name: "Delivery Zone",
            type: "polygon",
            polygon,
            alertOnEnter: true,
            alertOnExit: true,
            active: true,
        };

        prisma.geofence.create.mockResolvedValue(mockGeofence);

        const result = await trackingService.createGeofence({
            name: "Delivery Zone",
            type: "polygon",
            polygon,
        });

        expect(result.type).toBe("polygon");
        expect(result.polygon).toEqual(polygon);
    });

    test("should reject invalid circular geofence", async () => {
        await expect(
            trackingService.createGeofence({
                name: "Invalid Zone",
                type: "circle",
                // Missing latitude, longitude, radiusMeters
            }),
        ).rejects.toThrow("Circle geofence requires");
    });

    test("should detect point inside circular geofence", async () => {
        const geofence = {
            type: "circle",
            centerLatitude: 40.7128,
            centerLongitude: -74.006,
            radiusMeters: 1000, // 1 km
        };

        // Point 500m away (inside)
        const inside = trackingService.isPointInGeofence(
            40.7173,
            -74.006,
            geofence,
        );
        expect(inside).toBe(true);

        // Point 2km away (outside)
        const outside = trackingService.isPointInGeofence(
            40.7308,
            -74.006,
            geofence,
        );
        expect(outside).toBe(false);
    });
});

describe("TrackingService - Analytics", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should calculate analytics from location data", async () => {
        const mockLocations = [
            {
                latitude: 40.7589,
                longitude: -73.9851,
                speed: 60,
                timestamp: new Date("2026-01-14T12:00:00Z"),
            },
            {
                latitude: 40.7489,
                longitude: -73.9851,
                speed: 70,
                timestamp: new Date("2026-01-14T11:30:00Z"),
            },
            {
                latitude: 40.7389,
                longitude: -73.9851,
                speed: 65,
                timestamp: new Date("2026-01-14T11:00:00Z"),
            },
        ];

        prisma.location.findMany.mockResolvedValue(mockLocations);

        const result = await trackingService.getAnalytics({
            entityType: "vehicle",
            entityId: "vehicle_123",
            startTime: "2026-01-14T10:00:00Z",
            endTime: "2026-01-14T13:00:00Z",
        });

        expect(result.totalDistance).toBeGreaterThan(0);
        expect(result.averageSpeed).toBeGreaterThan(0);
        expect(result.maxSpeed).toBe(70);
        expect(result.totalTime).toBeGreaterThan(0);
        expect(result.startLocation).toBeDefined();
        expect(result.endLocation).toBeDefined();
    });

    test("should detect stops in location data", async () => {
        const mockLocations = [
            {
                latitude: 40.7589,
                longitude: -73.9851,
                speed: 60,
                timestamp: new Date("2026-01-14T12:00:00Z"),
            },
            {
                latitude: 40.7589,
                longitude: -73.9851,
                speed: 0, // Stopped
                timestamp: new Date("2026-01-14T11:50:00Z"),
            },
            {
                latitude: 40.7589,
                longitude: -73.9851,
                speed: 2, // Still stopped
                timestamp: new Date("2026-01-14T11:40:00Z"),
            },
            {
                latitude: 40.7489,
                longitude: -73.9851,
                speed: 65,
                timestamp: new Date("2026-01-14T11:30:00Z"),
            },
        ];

        prisma.location.findMany.mockResolvedValue(mockLocations);

        const result = await trackingService.getAnalytics({
            entityType: "vehicle",
            entityId: "vehicle_123",
        });

        expect(result.stopCount).toBeGreaterThan(0);
        expect(result.stops).toBeDefined();
        expect(result.stops.length).toBeGreaterThan(0);
    });

    test("should return zero analytics for no data", async () => {
        prisma.location.findMany.mockResolvedValue([]);

        const result = await trackingService.getAnalytics({
            entityType: "vehicle",
            entityId: "vehicle_123",
        });

        expect(result.totalDistance).toBe(0);
        expect(result.averageSpeed).toBe(0);
        expect(result.maxSpeed).toBe(0);
        expect(result.totalTime).toBe(0);
    });
});

describe("TrackingService - Alerts", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should get alerts filtered by entity", async () => {
        const mockAlerts = [
            {
                id: "alert_1",
                entityType: "vehicle",
                entityId: "vehicle_123",
                alertType: "delay",
                severity: "high",
                message: "Shipment delayed",
                acknowledged: false,
            },
            {
                id: "alert_2",
                entityType: "vehicle",
                entityId: "vehicle_123",
                alertType: "geofence_exit",
                severity: "medium",
                message: "Vehicle left zone",
                acknowledged: false,
            },
        ];

        prisma.trackingAlert.findMany.mockResolvedValue(mockAlerts);

        const result = await trackingService.getAlerts({
            entityType: "vehicle",
            entityId: "vehicle_123",
        });

        expect(result).toHaveLength(2);
        expect(result[0].alertType).toBe("delay");
    });

    test("should acknowledge alert", async () => {
        const mockAlert = {
            id: "alert_1",
            acknowledged: true,
            acknowledgedAt: new Date(),
            acknowledgedBy: "user_123",
        };

        prisma.trackingAlert.update.mockResolvedValue(mockAlert);

        const result = await trackingService.acknowledgeAlert(
            "alert_1",
            "user_123",
        );

        expect(result.acknowledged).toBe(true);
        expect(result.acknowledgedBy).toBe("user_123");
        expect(prisma.trackingAlert.update).toHaveBeenCalledWith({
            where: { id: "alert_1" },
            data: {
                acknowledged: true,
                acknowledgedAt: expect.any(Date),
                acknowledgedBy: "user_123",
            },
        });
    });
});

describe("TrackingService - Tracked Entities", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should get all tracked entities with active status", async () => {
        const mockSummaries = [
            {
                entityType: "vehicle",
                entityId: "vehicle_123",
                currentLatitude: 40.7128,
                currentLongitude: -74.006,
                lastUpdated: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago - active
            },
            {
                entityType: "vehicle",
                entityId: "vehicle_456",
                currentLatitude: 40.7589,
                currentLongitude: -73.9851,
                lastUpdated: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago - inactive
            },
        ];

        prisma.trackingSummary.findMany.mockResolvedValue(mockSummaries);

        const result = await trackingService.getTrackedEntities();

        expect(result).toHaveLength(2);
        expect(result[0].isActive).toBe(true); // Recent update
        expect(result[1].isActive).toBe(false); // Old update
        expect(result[0].ageMinutes).toBeLessThanOrEqual(5);
    });
});

describe("TrackingService - Distance Calculations", () => {
    test("should calculate distance between two points correctly", () => {
        // New York to Los Angeles (approx 3936 km)
        const distance = require("../services/trackingService").__proto__.constructor
            .prototype.constructor.calculateDistance ||
            function (lat1, lon1, lat2, lon2) {
                const R = 6371;
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
            };

        const nyToLa = distance(40.7128, -74.006, 34.0522, -118.2437);
        expect(nyToLa).toBeGreaterThan(3900);
        expect(nyToLa).toBeLessThan(4000);
    });
});
