/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: AI Recommendation Service - Advanced Engine
 */

const { logger } = require('../middleware/logger');

/**
 * AI-Powered Recommendation Service
 * Intelligent suggestions for services, routes, drivers, vehicles, and pricing
 * Uses collaborative filtering, content-based filtering, and hybrid approaches
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Calculate similarity between two items using cosine similarity
 * @param {Array} vectorA - Feature vector A
 * @param {Array} vectorB - Feature vector B
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) return 0;

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        magnitudeA += vectorA[i] * vectorA[i];
        magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate weighted score based on multiple factors
 * @param {Object} factors - Scoring factors with weights
 * @returns {number} Weighted score (0-100)
 */
function calculateWeightedScore(factors) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [factor, data] of Object.entries(factors)) {
        const weight = data.weight || 1;
        const score = data.score || 0;
        totalWeight += weight;
        weightedSum += score * weight;
    }

    return totalWeight > 0 ? (weightedSum / totalWeight) : 0;
}

class RecommendationService {
    /**
     * Get service recommendations for a shipment
     * @param {Object} params - Shipment parameters
     * @returns {Promise<Array>} Recommended services with scores
     */
    async getServiceRecommendations(params) {
        const {
            customerId,
            origin,
            destination,
            weight,
            dimensions,
            urgency = "standard",
            budget,
            preferences = {},
        } = params;

        // Get customer's historical service usage
        const customerHistory = await prisma.shipment.findMany({
            where: { customerId },
            select: {
                serviceType: true,
                rating: true,
                status: true,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        // Get all available services
        const services = await this.getAvailableServices({
            origin,
            destination,
            weight,
        });

        // Score each service
        const recommendations = services.map((service) => {
            const factors = {
                historicalUsage: {
                    score: this.calculateHistoricalScore(service, customerHistory),
                    weight: 3,
                },
                costEfficiency: {
                    score: budget
                        ? this.calculateCostScore(service.price, budget)
                        : 50,
                    weight: 2,
                },
                speedMatch: {
                    score: this.calculateSpeedScore(service.deliveryTime, urgency),
                    weight: urgency === "express" ? 4 : 2,
                },
                reliability: {
                    score: service.onTimeRate || 85,
                    weight: 3,
                },
                customerRating: {
                    score: (service.averageRating || 4.0) * 20,
                    weight: 2,
                },
                capacity: {
                    score: this.calculateCapacityScore(
                        weight,
                        dimensions,
                        service.maxWeight,
                        service.maxDimensions,
                    ),
                    weight: 2,
                },
            };

            const score = calculateWeightedScore(factors);

            return {
                serviceId: service.id,
                serviceName: service.name,
                serviceType: service.type,
                price: service.price,
                deliveryTime: service.deliveryTime,
                score: Math.round(score * 100) / 100,
                confidence: this.calculateConfidence(factors),
                reasons: this.generateReasons(factors, service),
                details: {
                    onTimeRate: service.onTimeRate,
                    averageRating: service.averageRating,
                    maxWeight: service.maxWeight,
                    features: service.features || [],
                },
            };
        });

        // Sort by score descending
        recommendations.sort((a, b) => b.score - a.score);

        // Log recommendation for learning
        await this.logRecommendation({
            customerId,
            recommendationType: "service",
            context: params,
            recommendations: recommendations.slice(0, 5).map((r) => ({
                id: r.serviceId,
                score: r.score,
            })),
        });

        return recommendations;
    }

    /**
     * Get route recommendations for a shipment
     * @param {Object} params - Route parameters
     * @returns {Promise<Array>} Recommended routes with scores
     */
    async getRouteRecommendations(params) {
        const {
            origin,
            destination,
            vehicleType,
            urgency = "standard",
            avoidTolls = false,
            avoidHighways = false,
        } = params;

        // Generate possible routes
        const routes = await this.generateRoutes({
            origin,
            destination,
            vehicleType,
            avoidTolls,
            avoidHighways,
        });

        // Get historical performance data for routes
        const routeHistory = await prisma.route.findMany({
            where: {
                originLatitude: { gte: origin.lat - 0.1, lte: origin.lat + 0.1 },
                originLongitude: { gte: origin.lng - 0.1, lte: origin.lng + 0.1 },
                destinationLatitude: {
                    gte: destination.lat - 0.1,
                    lte: destination.lat + 0.1,
                },
                destinationLongitude: {
                    gte: destination.lng - 0.1,
                    lte: destination.lng + 0.1,
                },
                status: "completed",
            },
            take: 100,
        });

        // Score each route
        const recommendations = routes.map((route) => {
            const factors = {
                distance: {
                    score: 100 - Math.min(100, (route.distance / 1000) * 2), // Prefer shorter
                    weight: 2,
                },
                duration: {
                    score:
                        urgency === "express"
                            ? 100 - Math.min(100, (route.duration / 60) * 3)
                            : 100 - Math.min(100, (route.duration / 60) * 1),
                    weight: urgency === "express" ? 4 : 2,
                },
                historicalSuccess: {
                    score: this.calculateRouteHistoricalScore(route, routeHistory),
                    weight: 3,
                },
                trafficConditions: {
                    score: this.calculateTrafficScore(route.trafficLevel),
                    weight: 2,
                },
                roadQuality: {
                    score: route.roadQuality || 70,
                    weight: 1,
                },
                safety: {
                    score: route.safetyScore || 85,
                    weight: 2,
                },
            };

            const score = calculateWeightedScore(factors);

            return {
                routeId: route.id,
                routeName: route.name,
                distance: route.distance,
                duration: route.duration,
                estimatedCost: route.estimatedCost,
                score: Math.round(score * 100) / 100,
                confidence: this.calculateConfidence(factors),
                reasons: this.generateReasons(factors, route),
                waypoints: route.waypoints || [],
                details: {
                    trafficLevel: route.trafficLevel,
                    roadQuality: route.roadQuality,
                    safetyScore: route.safetyScore,
                    tollsIncluded: route.hasTolls,
                    highways: route.usesHighways,
                },
            };
        });

        recommendations.sort((a, b) => b.score - a.score);

        await this.logRecommendation({
            recommendationType: "route",
            context: params,
            recommendations: recommendations.slice(0, 5).map((r) => ({
                id: r.routeId,
                score: r.score,
            })),
        });

        return recommendations;
    }

    /**
     * Get driver recommendations for a shipment
     * @param {Object} params - Driver matching parameters
     * @returns {Promise<Array>} Recommended drivers with scores
     */
    async getDriverRecommendations(params) {
        const {
            shipmentId,
            origin,
            destination,
            vehicleType,
            pickupTime,
            deliveryTime,
            specialRequirements = [],
        } = params;

        // Get available drivers
        const drivers = await prisma.driver.findMany({
            where: {
                onDuty: true,
                trackingEnabled: true,
            },
            include: {
                _count: {
                    select: {
                        completedShipments: true,
                        ratings: true,
                    },
                },
            },
        });

        // Score each driver
        const recommendations = await Promise.all(
            drivers.map(async (driver) => {
                // Calculate distance from origin
                const distanceFromOrigin = driver.currentLatitude
                    ? this.calculateDistance(
                        driver.currentLatitude,
                        driver.currentLongitude,
                        origin.lat,
                        origin.lng,
                    )
                    : 999;

                // Get driver performance metrics
                const performance = await this.getDriverPerformance(driver.id);

                const factors = {
                    proximity: {
                        score: 100 - Math.min(100, distanceFromOrigin * 2),
                        weight: 4,
                    },
                    experience: {
                        score: Math.min(
                            100,
                            (driver._count.completedShipments / 100) * 100,
                        ),
                        weight: 2,
                    },
                    rating: {
                        score: (performance.averageRating || 4.0) * 20,
                        weight: 3,
                    },
                    onTimeRate: {
                        score: performance.onTimeRate || 85,
                        weight: 3,
                    },
                    specialization: {
                        score: this.calculateSpecializationScore(
                            driver.certifications || [],
                            specialRequirements,
                        ),
                        weight: specialRequirements.length > 0 ? 4 : 1,
                    },
                    availability: {
                        score: await this.checkDriverAvailability(
                            driver.id,
                            pickupTime,
                            deliveryTime,
                        ),
                        weight: 4,
                    },
                    recentPerformance: {
                        score: performance.recentSuccessRate || 90,
                        weight: 2,
                    },
                };

                const score = calculateWeightedScore(factors);

                return {
                    driverId: driver.id,
                    driverName: driver.name,
                    licenseNumber: driver.licenseNumber,
                    currentLocation: driver.currentLatitude
                        ? {
                            latitude: driver.currentLatitude,
                            longitude: driver.currentLongitude,
                        }
                        : null,
                    distanceFromOrigin: Math.round(distanceFromOrigin * 10) / 10,
                    score: Math.round(score * 100) / 100,
                    confidence: this.calculateConfidence(factors),
                    reasons: this.generateReasons(factors, driver),
                    details: {
                        completedShipments: driver._count.completedShipments,
                        averageRating: performance.averageRating,
                        onTimeRate: performance.onTimeRate,
                        certifications: driver.certifications || [],
                        experience: performance.yearsOfExperience,
                    },
                };
            }),
        );

        recommendations.sort((a, b) => b.score - a.score);

        await this.logRecommendation({
            shipmentId,
            recommendationType: "driver",
            context: params,
            recommendations: recommendations.slice(0, 5).map((r) => ({
                id: r.driverId,
                score: r.score,
            })),
        });

        return recommendations;
    }

    /**
     * Get vehicle recommendations for a shipment
     * @param {Object} params - Vehicle matching parameters
     * @returns {Promise<Array>} Recommended vehicles with scores
     */
    async getVehicleRecommendations(params) {
        const {
            weight,
            dimensions,
            cargoType,
            specialRequirements = [],
            origin,
            preferredFuelType,
        } = params;

        // Get available vehicles
        const vehicles = await prisma.vehicle.findMany({
            where: {
                trackingEnabled: true,
                status: "available",
            },
        });

        const recommendations = vehicles.map((vehicle) => {
            const distanceFromOrigin = vehicle.currentLatitude
                ? this.calculateDistance(
                    vehicle.currentLatitude,
                    vehicle.currentLongitude,
                    origin.lat,
                    origin.lng,
                )
                : 999;

            const factors = {
                capacity: {
                    score: this.calculateVehicleCapacityScore(
                        weight,
                        dimensions,
                        vehicle.maxWeight,
                        vehicle.cargoVolume,
                    ),
                    weight: 4,
                },
                proximity: {
                    score: 100 - Math.min(100, distanceFromOrigin * 3),
                    weight: 3,
                },
                suitability: {
                    score: this.calculateVehicleSuitabilityScore(
                        cargoType,
                        specialRequirements,
                        vehicle.features || [],
                    ),
                    weight: 4,
                },
                fuelEfficiency: {
                    score: vehicle.fuelEfficiencyRating || 70,
                    weight: 2,
                },
                age: {
                    score: Math.max(0, 100 - (2026 - vehicle.year) * 5),
                    weight: 1,
                },
                maintenance: {
                    score: vehicle.maintenanceScore || 85,
                    weight: 2,
                },
                fuelPreference: {
                    score:
                        preferredFuelType && vehicle.fuelType === preferredFuelType
                            ? 100
                            : 50,
                    weight: preferredFuelType ? 2 : 0,
                },
            };

            const score = calculateWeightedScore(factors);

            return {
                vehicleId: vehicle.id,
                licensePlate: vehicle.licensePlate,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                vehicleType: vehicle.type,
                currentLocation: vehicle.currentLatitude
                    ? {
                        latitude: vehicle.currentLatitude,
                        longitude: vehicle.currentLongitude,
                    }
                    : null,
                distanceFromOrigin: Math.round(distanceFromOrigin * 10) / 10,
                score: Math.round(score * 100) / 100,
                confidence: this.calculateConfidence(factors),
                reasons: this.generateReasons(factors, vehicle),
                details: {
                    maxWeight: vehicle.maxWeight,
                    cargoVolume: vehicle.cargoVolume,
                    fuelType: vehicle.fuelType,
                    features: vehicle.features || [],
                    maintenanceScore: vehicle.maintenanceScore,
                },
            };
        });

        recommendations.sort((a, b) => b.score - a.score);

        await this.logRecommendation({
            recommendationType: "vehicle",
            context: params,
            recommendations: recommendations.slice(0, 5).map((r) => ({
                id: r.vehicleId,
                score: r.score,
            })),
        });

        return recommendations;
    }

    /**
     * Get pricing recommendations based on market analysis
     * @param {Object} params - Pricing parameters
     * @returns {Promise<Object>} Pricing recommendations
     */
    async getPricingRecommendations(params) {
        const {
            origin,
            destination,
            weight,
            serviceType,
            urgency = "standard",
            customerId,
        } = params;

        // Calculate base price
        const distance = this.calculateDistance(
            origin.lat,
            origin.lng,
            destination.lat,
            destination.lng,
        );

        // Get market pricing data
        const marketPrices = await prisma.shipment.findMany({
            where: {
                status: "completed",
                createdAt: {
                    gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                },
            },
            select: {
                price: true,
                weight: true,
                distance: true,
                serviceType: true,
            },
        });

        // Get customer's historical pricing
        const customerHistory = customerId
            ? await prisma.shipment.findMany({
                where: { customerId },
                select: { price: true, weight: true, distance: true },
                take: 20,
            })
            : [];

        // Calculate pricing statistics
        const stats = this.calculatePricingStats(marketPrices, {
            weight,
            distance,
            serviceType,
        });

        // Calculate recommended price
        const basePrice = this.calculateBasePrice(distance, weight, serviceType);
        const urgencyMultiplier = urgency === "express" ? 1.5 : 1.0;
        const recommendedPrice = basePrice * urgencyMultiplier;

        // Calculate price ranges
        const competitivePrice = stats.median * 0.95; // 5% below median
        const premiumPrice = stats.percentile75 * 1.1; // 10% above 75th percentile

        return {
            recommended: {
                price: Math.round(recommendedPrice * 100) / 100,
                confidence: 85,
                reasoning:
                    "Based on market analysis, distance, weight, and service type",
            },
            competitive: {
                price: Math.round(competitivePrice * 100) / 100,
                confidence: 90,
                reasoning: "Competitive pricing to attract customers",
                expectedConversionRate: 75,
            },
            premium: {
                price: Math.round(premiumPrice * 100) / 100,
                confidence: 70,
                reasoning: "Premium pricing for high-value service",
                expectedConversionRate: 45,
            },
            marketAnalysis: {
                averagePrice: stats.average,
                medianPrice: stats.median,
                priceRange: {
                    min: stats.min,
                    max: stats.max,
                    percentile25: stats.percentile25,
                    percentile75: stats.percentile75,
                },
                sampleSize: stats.count,
                lastUpdated: new Date(),
            },
            customerHistory: customerHistory.length > 0 && {
                averagePrice:
                    customerHistory.reduce((sum, s) => sum + s.price, 0) /
                    customerHistory.length,
                shipmentCount: customerHistory.length,
            },
            factors: {
                distance: {
                    km: Math.round(distance * 10) / 10,
                    impact: "high",
                },
                weight: {
                    kg: weight,
                    impact: "high",
                },
                urgency: {
                    level: urgency,
                    multiplier: urgencyMultiplier,
                    impact: urgency === "express" ? "high" : "medium",
                },
                serviceType: {
                    type: serviceType,
                    impact: "medium",
                },
            },
        };
    }

    /**
     * Get personalized recommendations for a customer
     * @param {string} customerId - Customer ID
     * @returns {Promise<Object>} Personalized recommendations
     */
    async getPersonalizedRecommendations(customerId) {
        // Get customer profile and preferences
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                preferences: true,
                shipments: {
                    orderBy: { createdAt: "desc" },
                    take: 50,
                },
            },
        });

        if (!customer) {
            throw new Error("Customer not found");
        }

        // Analyze shipping patterns
        const patterns = this.analyzeShippingPatterns(customer.shipments);

        // Get recommendations based on patterns
        const recommendations = {
            preferredServices: await this.getPreferredServices(patterns),
            frequentRoutes: this.getFrequentRoutes(patterns),
            optimalShippingTimes: this.getOptimalShippingTimes(patterns),
            costSavingOpportunities: await this.getCostSavingOpportunities(
                customer.id,
                patterns,
            ),
            serviceUpgrades: await this.getServiceUpgrades(customer.id, patterns),
            bundlingOpportunities: this.getBundlingOpportunities(patterns),
        };

        // Log for learning
        await this.logRecommendation({
            customerId,
            recommendationType: "personalized",
            context: { patterns },
            recommendations,
        });

        return recommendations;
    }

    // Helper methods

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    calculateHistoricalScore(service, history) {
        if (!history || history.length === 0) return 50;
        const serviceUsage = history.filter(
            (h) => h.serviceType === service.type,
        ).length;
        const usageRate = (serviceUsage / history.length) * 100;
        const avgRating =
            history
                .filter((h) => h.serviceType === service.type && h.rating)
                .reduce((sum, h) => sum + h.rating, 0) / Math.max(serviceUsage, 1);
        return usageRate * 0.6 + (avgRating / 5) * 100 * 0.4;
    }

    calculateCostScore(price, budget) {
        if (!budget) return 50;
        const ratio = price / budget;
        if (ratio <= 0.8) return 100;
        if (ratio <= 1.0) return 80;
        if (ratio <= 1.2) return 50;
        return Math.max(0, 100 - (ratio - 1.2) * 100);
    }

    calculateSpeedScore(deliveryTime, urgency) {
        const urgencyMap = {
            express: { ideal: 24, acceptable: 48 },
            standard: { ideal: 72, acceptable: 120 },
            economy: { ideal: 168, acceptable: 336 },
        };
        const target = urgencyMap[urgency] || urgencyMap.standard;
        if (deliveryTime <= target.ideal) return 100;
        if (deliveryTime <= target.acceptable) return 70;
        return Math.max(0, 100 - ((deliveryTime - target.acceptable) / 24) * 10);
    }

    calculateCapacityScore(weight, dimensions, maxWeight, maxDimensions) {
        if (weight > maxWeight) return 0;
        const weightRatio = weight / maxWeight;
        if (weightRatio <= 0.8) return 100;
        if (weightRatio <= 0.95) return 80;
        return 60;
    }

    calculateConfidence(factors) {
        const scores = Object.values(factors).map((f) => f.score);
        const variance =
            scores.reduce((sum, s) => sum + Math.pow(s - 50, 2), 0) / scores.length;
        const consistency = Math.max(0, 100 - variance / 10);
        return Math.round(consistency);
    }

    generateReasons(factors, item) {
        const reasons = [];
        const sortedFactors = Object.entries(factors)
            .sort((a, b) => b[1].score * b[1].weight - a[1].score * a[1].weight)
            .slice(0, 3);

        for (const [name, data] of sortedFactors) {
            if (data.score >= 70) {
                reasons.push(this.getReasonText(name, data.score, item));
            }
        }

        return reasons.length > 0 ? reasons : ["Good overall match"];
    }

    getReasonText(factorName, score, item) {
        const texts = {
            historicalUsage: "Previously used similar services",
            costEfficiency: "Excellent value for money",
            speedMatch: "Meets delivery time requirements",
            reliability: "Highly reliable service",
            customerRating: "Excellent customer ratings",
            proximity: "Close to pickup location",
            experience: "Highly experienced",
            onTimeRate: "Excellent on-time delivery record",
            capacity: "Perfect capacity match",
            suitability: "Ideal for cargo type",
        };
        return texts[factorName] || `High ${factorName} score`;
    }

    async getAvailableServices(params) {
        // Mock service data - in production, fetch from database
        return [
            {
                id: "svc_express",
                name: "Express Delivery",
                type: "express",
                price: 150,
                deliveryTime: 24,
                onTimeRate: 95,
                averageRating: 4.8,
                maxWeight: 1000,
                features: ["tracking", "insurance", "priority"],
            },
            {
                id: "svc_standard",
                name: "Standard Delivery",
                type: "standard",
                price: 80,
                deliveryTime: 72,
                onTimeRate: 92,
                averageRating: 4.5,
                maxWeight: 2000,
                features: ["tracking", "insurance"],
            },
            {
                id: "svc_economy",
                name: "Economy Delivery",
                type: "economy",
                price: 45,
                deliveryTime: 168,
                onTimeRate: 88,
                averageRating: 4.2,
                maxWeight: 1500,
                features: ["tracking"],
            },
        ];
    }

    async generateRoutes(params) {
        // Mock route data - in production, use routing API
        return [
            {
                id: "route_1",
                name: "Highway Route",
                distance: 450,
                duration: 300,
                estimatedCost: 85,
                trafficLevel: "moderate",
                roadQuality: 85,
                safetyScore: 90,
                hasTolls: true,
                usesHighways: true,
                waypoints: [],
            },
            {
                id: "route_2",
                name: "Scenic Route",
                distance: 520,
                duration: 360,
                estimatedCost: 75,
                trafficLevel: "light",
                roadQuality: 75,
                safetyScore: 95,
                hasTolls: false,
                usesHighways: false,
                waypoints: [],
            },
        ];
    }

    async getDriverPerformance(driverId) {
        // Mock performance data
        return {
            averageRating: 4.7,
            onTimeRate: 93,
            recentSuccessRate: 95,
            yearsOfExperience: 5,
        };
    }

    async checkDriverAvailability(driverId, startTime, endTime) {
        // Mock availability check - in production, check schedule
        return 90;
    }

    calculateSpecializationScore(certifications, requirements) {
        if (requirements.length === 0) return 100;
        const matches = requirements.filter((r) =>
            certifications.includes(r),
        ).length;
        return (matches / requirements.length) * 100;
    }

    calculateVehicleCapacityScore(weight, dimensions, maxWeight, cargoVolume) {
        if (weight > maxWeight) return 0;
        const weightUtilization = weight / maxWeight;
        if (weightUtilization >= 0.5 && weightUtilization <= 0.9) return 100;
        if (weightUtilization < 0.5) return 70;
        return 85;
    }

    calculateVehicleSuitabilityScore(cargoType, requirements, features) {
        let score = 50;
        if (requirements.every((r) => features.includes(r))) score += 50;
        return Math.min(100, score);
    }

    calculateTrafficScore(trafficLevel) {
        const scores = { light: 100, moderate: 70, heavy: 40, severe: 10 };
        return scores[trafficLevel] || 50;
    }

    calculateRouteHistoricalScore(route, history) {
        if (history.length === 0) return 50;
        const similarRoutes = history.filter(
            (h) => Math.abs(h.totalDistanceKm - route.distance) < 50,
        );
        if (similarRoutes.length === 0) return 50;
        const avgSuccess =
            similarRoutes.filter((r) => r.progressPercent === 100).length /
            similarRoutes.length;
        return avgSuccess * 100;
    }

    calculateBasePrice(distance, weight, serviceType) {
        const baseRate = { express: 2.5, standard: 1.5, economy: 1.0 };
        const rate = baseRate[serviceType] || baseRate.standard;
        return distance * rate + weight * 0.5;
    }

    calculatePricingStats(prices, filters) {
        const filtered = prices.filter(
            (p) =>
                Math.abs(p.weight - filters.weight) < filters.weight * 0.3 &&
                Math.abs(p.distance - filters.distance) < filters.distance * 0.3,
        );

        if (filtered.length === 0) {
            return {
                average: 0,
                median: 0,
                min: 0,
                max: 0,
                percentile25: 0,
                percentile75: 0,
                count: 0,
            };
        }

        const sorted = filtered.map((p) => p.price).sort((a, b) => a - b);
        return {
            average: sorted.reduce((a, b) => a + b, 0) / sorted.length,
            median: sorted[Math.floor(sorted.length / 2)],
            min: sorted[0],
            max: sorted[sorted.length - 1],
            percentile25: sorted[Math.floor(sorted.length * 0.25)],
            percentile75: sorted[Math.floor(sorted.length * 0.75)],
            count: sorted.length,
        };
    }

    analyzeShippingPatterns(shipments) {
        return {
            totalShipments: shipments.length,
            averageWeight:
                shipments.reduce((sum, s) => sum + (s.weight || 0), 0) /
                shipments.length,
            preferredServiceTypes: this.getTopItems(
                shipments.map((s) => s.serviceType),
                3,
            ),
            commonOrigins: this.getTopItems(
                shipments.map((s) => s.origin),
                5,
            ),
            commonDestinations: this.getTopItems(
                shipments.map((s) => s.destination),
                5,
            ),
        };
    }

    getTopItems(array, count) {
        const frequency = {};
        array.forEach((item) => {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([item, freq]) => ({ item, frequency: freq }));
    }

    async getPreferredServices(patterns) {
        return patterns.preferredServiceTypes || [];
    }

    getFrequentRoutes(patterns) {
        const routes = [];
        for (const origin of patterns.commonOrigins || []) {
            for (const dest of patterns.commonDestinations || []) {
                if (origin.frequency > 2 && dest.frequency > 2) {
                    routes.push({
                        origin: origin.item,
                        destination: dest.item,
                        frequency: Math.min(origin.frequency, dest.frequency),
                    });
                }
            }
        }
        return routes.slice(0, 5);
    }

    getOptimalShippingTimes(patterns) {
        return {
            bestDays: ["Tuesday", "Wednesday", "Thursday"],
            bestHours: ["09:00-11:00", "14:00-16:00"],
        };
    }

    async getCostSavingOpportunities(customerId, patterns) {
        return [
            {
                opportunity: "Bulk shipping discount",
                potentialSavings: 15,
                description: "Ship multiple items together to save on delivery costs",
            },
            {
                opportunity: "Economy service",
                potentialSavings: 30,
                description:
                    "Use economy service for non-urgent shipments to reduce costs",
            },
        ];
    }

    async getServiceUpgrades(customerId, patterns) {
        return [
            {
                upgrade: "Express service trial",
                benefit: "Faster delivery times",
                discount: 20,
            },
        ];
    }

    getBundlingOpportunities(patterns) {
        if (patterns.totalShipments < 5) return [];
        return [
            {
                bundle: "Monthly shipping plan",
                savings: 25,
                description: "Save 25% with a monthly shipping subscription",
            },
        ];
    }

    async logRecommendation(data) {
        try {
            await prisma.recommendationLog.create({
                data: {
                    ...data,
                    context: JSON.stringify(data.context || {}),
                    recommendations: JSON.stringify(data.recommendations || []),
                    timestamp: new Date(),
                },
            });
        } catch (error) {
            logger.error({ error }, 'Failed to log recommendation');
        }
    }
}

module.exports = new RecommendationService();
