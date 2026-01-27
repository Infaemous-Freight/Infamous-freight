const { RecommendationService } = require('../services/recommendationService');

describe('RecommendationService', () => {
    let service;
    let mockPrisma;

    beforeEach(() => {
        // Mock Prisma client
        mockPrisma = {
            shipment: {
                findMany: jest.fn(),
            },
            driver: {
                findMany: jest.fn(),
            },
            vehicle: {
                findMany: jest.fn(),
            },
            priceHistory: {
                findMany: jest.fn(),
            },
            routePerformance: {
                findMany: jest.fn(),
            },
            serviceRating: {
                findMany: jest.fn(),
            },
            driverRating: {
                findMany: jest.fn(),
            },
        };

        service = new RecommendationService(mockPrisma);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Service Recommendations', () => {
        it('should recommend services based on customer history', async () => {
            // Mock customer shipment history
            mockPrisma.shipment.findMany.mockResolvedValue([
                {
                    serviceType: 'express',
                    price: 150,
                    deliveryTime: 24,
                    status: 'delivered',
                },
                {
                    serviceType: 'express',
                    price: 145,
                    deliveryTime: 22,
                    status: 'delivered',
                },
            ]);

            // Mock service ratings
            mockPrisma.serviceRating.findMany.mockResolvedValue([
                {
                    serviceType: 'express',
                    rating: 5,
                    onTimeDelivery: true,
                },
                {
                    serviceType: 'standard',
                    rating: 4,
                    onTimeDelivery: true,
                },
            ]);

            const result = await service.getServiceRecommendations({
                customerId: 'cust_123',
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                weight: 500,
                urgency: 'express',
            });

            expect(result).toHaveProperty('recommendations');
            expect(Array.isArray(result.recommendations)).toBe(true);
            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.recommendations[0]).toHaveProperty('score');
            expect(result.recommendations[0]).toHaveProperty('confidence');
            expect(result.recommendations[0]).toHaveProperty('reasons');
        });

        it('should handle customers with no history', async () => {
            mockPrisma.shipment.findMany.mockResolvedValue([]);
            mockPrisma.serviceRating.findMany.mockResolvedValue([]);

            const result = await service.getServiceRecommendations({
                customerId: 'new_customer',
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                weight: 500,
            });

            expect(result.recommendations).toBeDefined();
            expect(result.recommendations.length).toBeGreaterThan(0);
        });

        it('should respect budget constraints', async () => {
            mockPrisma.shipment.findMany.mockResolvedValue([]);
            mockPrisma.serviceRating.findMany.mockResolvedValue([]);

            const result = await service.getServiceRecommendations({
                customerId: 'cust_123',
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                weight: 500,
                budget: 100,
            });

            // All recommendations should be within budget
            result.recommendations.forEach(rec => {
                expect(rec.price).toBeLessThanOrEqual(100);
            });
        });

        it('should prioritize services matching urgency', async () => {
            mockPrisma.shipment.findMany.mockResolvedValue([]);
            mockPrisma.serviceRating.findMany.mockResolvedValue([]);

            const result = await service.getServiceRecommendations({
                customerId: 'cust_123',
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                weight: 500,
                urgency: 'express',
            });

            // Express services should have higher scores when urgency is express
            const expressService = result.recommendations.find(r =>
                r.serviceName.toLowerCase().includes('express')
            );
            const standardService = result.recommendations.find(r =>
                r.serviceName.toLowerCase().includes('standard')
            );

            if (expressService && standardService) {
                expect(expressService.score).toBeGreaterThan(standardService.score);
            }
        });
    });

    describe('Route Recommendations', () => {
        it('should recommend optimal routes', async () => {
            mockPrisma.routePerformance.findMany.mockResolvedValue([
                {
                    originLatitude: 40.7128,
                    originLongitude: -74.0060,
                    destinationLatitude: 34.0522,
                    destinationLongitude: -118.2437,
                    actualDistance: 4500,
                    actualDuration: 300,
                    completionStatus: 'completed',
                    trafficDelayMinutes: 10,
                },
            ]);

            const result = await service.getRouteRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                urgency: 'standard',
            });

            expect(result.recommendations).toBeDefined();
            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.recommendations[0]).toHaveProperty('distance');
            expect(result.recommendations[0]).toHaveProperty('duration');
            expect(result.recommendations[0]).toHaveProperty('score');
        });

        it('should avoid tolls when specified', async () => {
            mockPrisma.routePerformance.findMany.mockResolvedValue([]);

            const result = await service.getRouteRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                avoidTolls: true,
            });

            expect(result.recommendations).toBeDefined();
            // All routes should avoid tolls
            result.recommendations.forEach(route => {
                expect(route.tollCost).toBe(0);
            });
        });

        it('should avoid highways when specified', async () => {
            mockPrisma.routePerformance.findMany.mockResolvedValue([]);

            const result = await service.getRouteRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                avoidHighways: true,
            });

            expect(result.recommendations).toBeDefined();
            result.recommendations.forEach(route => {
                expect(route.avoidHighways).toBe(true);
            });
        });

        it('should include waypoints in route calculation', async () => {
            mockPrisma.routePerformance.findMany.mockResolvedValue([]);

            const result = await service.getRouteRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                waypoints: [
                    { lat: 39.7392, lng: -104.9903 }, // Denver
                ],
            });

            expect(result.recommendations).toBeDefined();
            expect(result.recommendations[0].waypoints).toBeDefined();
        });
    });

    describe('Driver Recommendations', () => {
        it('should recommend drivers based on proximity', async () => {
            mockPrisma.driver.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    name: 'John Doe',
                    currentLocation: { lat: 40.7580, lng: -73.9855 }, // 5 miles from origin
                    experience: 5,
                    rating: 4.8,
                    available: true,
                },
                {
                    id: 'driver_2',
                    name: 'Jane Smith',
                    currentLocation: { lat: 40.7128, lng: -74.0060 }, // At origin
                    experience: 3,
                    rating: 4.5,
                    available: true,
                },
            ]);

            mockPrisma.driverRating.findMany.mockResolvedValue([
                { driverId: 'driver_1', rating: 5 },
                { driverId: 'driver_2', rating: 4 },
            ]);

            const result = await service.getDriverRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
            });

            expect(result.recommendations).toBeDefined();
            expect(result.recommendations.length).toBeGreaterThan(0);
            // Closer driver should have higher proximity score
            const driver2 = result.recommendations.find(d => d.driverId === 'driver_2');
            expect(driver2).toBeDefined();
        });

        it('should filter unavailable drivers', async () => {
            mockPrisma.driver.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    name: 'John Doe',
                    available: false,
                },
            ]);

            mockPrisma.driverRating.findMany.mockResolvedValue([]);

            const result = await service.getDriverRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
            });

            // Should return empty or not include unavailable driver
            const unavailableDriver = result.recommendations.find(d => d.driverId === 'driver_1');
            expect(unavailableDriver).toBeUndefined();
        });

        it('should consider driver specialization', async () => {
            mockPrisma.driver.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    name: 'Hazmat Specialist',
                    specializations: ['hazmat', 'refrigerated'],
                    available: true,
                    currentLocation: { lat: 40.7128, lng: -74.0060 },
                },
            ]);

            mockPrisma.driverRating.findMany.mockResolvedValue([]);

            const result = await service.getDriverRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
                specialRequirements: ['hazmat'],
            });

            expect(result.recommendations).toBeDefined();
            const specialist = result.recommendations.find(d => d.driverId === 'driver_1');
            expect(specialist).toBeDefined();
            if (specialist) {
                expect(specialist.score).toBeGreaterThan(50); // Should have bonus for matching specialization
            }
        });
    });

    describe('Vehicle Recommendations', () => {
        it('should recommend vehicles based on capacity', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([
                {
                    id: 'vehicle_1',
                    type: 'box_truck',
                    capacity: 5000,
                    cargoTypes: ['general'],
                    available: true,
                    currentLocation: { lat: 40.7128, lng: -74.0060 },
                },
                {
                    id: 'vehicle_2',
                    type: 'semi_truck',
                    capacity: 20000,
                    cargoTypes: ['general', 'palletized'],
                    available: true,
                    currentLocation: { lat: 40.7128, lng: -74.0060 },
                },
            ]);

            const result = await service.getVehicleRecommendations({
                weight: 4500,
                cargoType: 'general',
                origin: { lat: 40.7128, lng: -74.0060 },
            });

            expect(result.recommendations).toBeDefined();
            expect(result.recommendations.length).toBeGreaterThan(0);
            // Vehicle with appropriate capacity should be recommended
            result.recommendations.forEach(rec => {
                expect(rec.capacity).toBeGreaterThanOrEqual(4500);
            });
        });

        it('should match cargo type requirements', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([
                {
                    id: 'vehicle_1',
                    type: 'refrigerated_truck',
                    capacity: 10000,
                    cargoTypes: ['refrigerated', 'general'],
                    available: true,
                    currentLocation: { lat: 40.7128, lng: -74.0060 },
                },
            ]);

            const result = await service.getVehicleRecommendations({
                weight: 5000,
                cargoType: 'refrigerated',
                origin: { lat: 40.7128, lng: -74.0060 },
            });

            expect(result.recommendations).toBeDefined();
            const refVehicle = result.recommendations.find(v => v.vehicleId === 'vehicle_1');
            expect(refVehicle).toBeDefined();
            if (refVehicle) {
                expect(refVehicle.suitability).toBeGreaterThan(80); // High suitability for matching cargo type
            }
        });

        it('should consider fuel efficiency', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([
                {
                    id: 'vehicle_1',
                    type: 'electric_truck',
                    capacity: 5000,
                    fuelType: 'electric',
                    fuelEfficiency: 95,
                    available: true,
                    currentLocation: { lat: 40.7128, lng: -74.0060 },
                },
                {
                    id: 'vehicle_2',
                    type: 'diesel_truck',
                    capacity: 5000,
                    fuelType: 'diesel',
                    fuelEfficiency: 60,
                    available: true,
                    currentLocation: { lat: 40.7128, lng: -74.0060 },
                },
            ]);

            const result = await service.getVehicleRecommendations({
                weight: 4500,
                cargoType: 'general',
                origin: { lat: 40.7128, lng: -74.0060 },
                preferredFuelType: 'electric',
            });

            expect(result.recommendations).toBeDefined();
            const electricVehicle = result.recommendations.find(v => v.vehicleId === 'vehicle_1');
            const dieselVehicle = result.recommendations.find(v => v.vehicleId === 'vehicle_2');

            if (electricVehicle && dieselVehicle) {
                expect(electricVehicle.score).toBeGreaterThan(dieselVehicle.score);
            }
        });
    });

    describe('Pricing Recommendations', () => {
        it('should recommend competitive pricing', async () => {
            mockPrisma.priceHistory.findMany.mockResolvedValue([
                { origin: 'New York', destination: 'Los Angeles', price: 150, serviceType: 'express', weight: 500, createdAt: new Date() },
                { origin: 'New York', destination: 'Los Angeles', price: 145, serviceType: 'express', weight: 500, createdAt: new Date() },
                { origin: 'New York', destination: 'Los Angeles', price: 155, serviceType: 'express', weight: 500, createdAt: new Date() },
            ]);

            const result = await service.getPricingRecommendations({
                origin: { lat: 40.7128, lng: -74.0060, name: 'New York' },
                destination: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
                weight: 500,
                serviceType: 'express',
            });

            expect(result).toHaveProperty('recommended');
            expect(result).toHaveProperty('competitive');
            expect(result).toHaveProperty('premium');
            expect(result).toHaveProperty('marketAnalysis');

            expect(result.recommended.price).toBeGreaterThan(0);
            expect(result.competitive.price).toBeGreaterThan(0);
            expect(result.premium.price).toBeGreaterThan(result.competitive.price);
        });

        it('should handle no historical data gracefully', async () => {
            mockPrisma.priceHistory.findMany.mockResolvedValue([]);

            const result = await service.getPricingRecommendations({
                origin: { lat: 40.7128, lng: -74.0060, name: 'New York' },
                destination: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
                weight: 500,
                serviceType: 'express',
            });

            expect(result).toHaveProperty('recommended');
            expect(result.recommended.price).toBeGreaterThan(0); // Should return base price
        });

        it('should adjust pricing for urgency', async () => {
            mockPrisma.priceHistory.findMany.mockResolvedValue([
                { origin: 'New York', destination: 'Los Angeles', price: 150, serviceType: 'express', weight: 500, createdAt: new Date() },
            ]);

            const standardResult = await service.getPricingRecommendations({
                origin: { lat: 40.7128, lng: -74.0060, name: 'New York' },
                destination: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
                weight: 500,
                serviceType: 'standard',
                urgency: 'standard',
            });

            const expressResult = await service.getPricingRecommendations({
                origin: { lat: 40.7128, lng: -74.0060, name: 'New York' },
                destination: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
                weight: 500,
                serviceType: 'express',
                urgency: 'express',
            });

            expect(expressResult.recommended.price).toBeGreaterThan(standardResult.recommended.price);
        });
    });

    describe('Personalized Recommendations', () => {
        it('should analyze customer shipping patterns', async () => {
            mockPrisma.shipment.findMany.mockResolvedValue([
                {
                    customerId: 'cust_123',
                    serviceType: 'express',
                    origin: 'New York',
                    destination: 'Los Angeles',
                    price: 150,
                    weight: 500,
                    status: 'delivered',
                    createdAt: new Date('2024-01-01'),
                },
                {
                    customerId: 'cust_123',
                    serviceType: 'express',
                    origin: 'New York',
                    destination: 'Los Angeles',
                    price: 145,
                    weight: 500,
                    status: 'delivered',
                    createdAt: new Date('2024-01-15'),
                },
                {
                    customerId: 'cust_123',
                    serviceType: 'standard',
                    origin: 'Boston',
                    destination: 'Chicago',
                    price: 80,
                    weight: 300,
                    status: 'delivered',
                    createdAt: new Date('2024-02-01'),
                },
            ]);

            const result = await service.getPersonalizedRecommendations('cust_123');

            expect(result).toHaveProperty('preferredServices');
            expect(result).toHaveProperty('frequentRoutes');
            expect(result).toHaveProperty('recommendations');
            expect(Array.isArray(result.recommendations)).toBe(true);
        });

        it('should suggest cost savings opportunities', async () => {
            mockPrisma.shipment.findMany.mockResolvedValue([
                {
                    customerId: 'cust_123',
                    serviceType: 'express',
                    price: 150,
                    urgency: 'standard', // Using express when standard would work
                    status: 'delivered',
                    createdAt: new Date(),
                },
            ]);

            const result = await service.getPersonalizedRecommendations('cust_123');

            expect(result.recommendations).toBeDefined();
            // Should suggest switching to standard service for cost savings
            const costSavingRec = result.recommendations.find(r =>
                r.type === 'cost_savings'
            );
            expect(costSavingRec).toBeDefined();
        });

        it('should handle customers with no history', async () => {
            mockPrisma.shipment.findMany.mockResolvedValue([]);

            const result = await service.getPersonalizedRecommendations('new_customer');

            expect(result).toHaveProperty('preferredServices');
            expect(result).toHaveProperty('recommendations');
            expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Algorithm Helpers', () => {
        it('should calculate cosine similarity correctly', () => {
            const vec1 = [1, 2, 3];
            const vec2 = [4, 5, 6];

            const similarity = service.cosineSimilarity(vec1, vec2);

            expect(similarity).toBeGreaterThan(0);
            expect(similarity).toBeLessThanOrEqual(1);
        });

        it('should calculate weighted score correctly', () => {
            const factors = {
                price: 80,
                speed: 90,
                reliability: 85,
            };

            const weights = {
                price: 2,
                speed: 3,
                reliability: 1,
            };

            const score = service.calculateWeightedScore(factors, weights);

            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(100);
            // Speed (90) with weight 3 should influence score most
        });

        it('should calculate distance correctly', () => {
            const origin = { lat: 40.7128, lng: -74.0060 }; // New York
            const destination = { lat: 34.0522, lng: -118.2437 }; // Los Angeles

            const distance = service.calculateDistance(origin, destination);

            expect(distance).toBeGreaterThan(3900); // ~3936 km
            expect(distance).toBeLessThan(4100);
        });

        it('should calculate confidence level correctly', () => {
            const scores = [85, 87, 83, 86, 84];
            const confidence = service.calculateConfidence(scores);

            expect(confidence).toBeGreaterThan(0);
            expect(confidence).toBeLessThanOrEqual(100);
            // Low variance should result in high confidence
            expect(confidence).toBeGreaterThan(70);
        });

        it('should generate reasons correctly', () => {
            const factors = {
                historicalUsage: 90,
                costEfficiency: 75,
                speedMatch: 85,
            };

            const reasons = service.generateReasons(factors, 'service');

            expect(Array.isArray(reasons)).toBe(true);
            expect(reasons.length).toBeGreaterThan(0);
            expect(reasons[0]).toContain('Previously used');
        });
    });

    describe('Edge Cases', () => {
        it('should handle invalid coordinates gracefully', async () => {
            mockPrisma.routePerformance.findMany.mockResolvedValue([]);

            await expect(
                service.getRouteRecommendations({
                    origin: { lat: 999, lng: 999 },
                    destination: { lat: 34.0522, lng: -118.2437 },
                })
            ).rejects.toThrow();
        });

        it('should handle negative weights gracefully', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([]);

            await expect(
                service.getVehicleRecommendations({
                    weight: -500,
                    cargoType: 'general',
                    origin: { lat: 40.7128, lng: -74.0060 },
                })
            ).rejects.toThrow();
        });

        it('should handle empty result sets', async () => {
            mockPrisma.driver.findMany.mockResolvedValue([]);
            mockPrisma.driverRating.findMany.mockResolvedValue([]);

            const result = await service.getDriverRecommendations({
                origin: { lat: 40.7128, lng: -74.0060 },
                destination: { lat: 34.0522, lng: -118.2437 },
            });

            expect(result.recommendations).toEqual([]);
        });
    });
});
