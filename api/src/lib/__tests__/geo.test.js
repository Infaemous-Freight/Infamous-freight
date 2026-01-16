/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Unit Tests for Geolocation Module
 */

const { milesBetween, findNearbyDrivers, getLocation } = require('../geo');

describe('Geolocation Module', () => {
    describe('milesBetween', () => {
        it('should return 0 for same location', () => {
            const miles = milesBetween(34.0522, -118.2437, 34.0522, -118.2437);
            expect(miles).toBe(0);
        });

        it('should calculate distance between two locations', () => {
            // LA to Long Beach: ~25 miles
            const miles = milesBetween(34.0522, -118.2437, 33.7701, -118.1937);
            expect(miles).toBeGreaterThan(20);
            expect(miles).toBeLessThan(30);
        });

        it('should be symmetric (A to B = B to A)', () => {
            const miles1 = milesBetween(40.7128, -74.0060, 34.0522, -118.2437);
            const miles2 = milesBetween(34.0522, -118.2437, 40.7128, -74.0060);
            expect(miles1).toBeCloseTo(miles2, 1);
        });

        it('should return positive value', () => {
            const miles = milesBetween(0, 0, 1, 1);
            expect(miles).toBeGreaterThanOrEqual(0);
        });

        it('should handle antipodal points (opposite side of earth)', () => {
            const miles = milesBetween(0, 0, 0, 180);
            expect(miles).toBeCloseTo(12450, 0); // Half of Earth's circumference
        });

        it('should calculate NYC to LA distance (~2450 miles)', () => {
            const miles = milesBetween(40.7128, -74.0060, 34.0522, -118.2437);
            expect(miles).toBeGreaterThan(2400);
            expect(miles).toBeLessThan(2500);
        });

        it('should calculate London to Paris distance (~215 miles)', () => {
            const miles = milesBetween(51.5074, -0.1278, 48.8566, 2.3522);
            expect(miles).toBeGreaterThan(200);
            expect(miles).toBeLessThan(230);
        });

        it('should handle negative longitudes', () => {
            const miles = milesBetween(34.0522, -118.2437, 34.0522, -118.0);
            expect(miles).toBeGreaterThan(0);
        });

        it('should handle equator crossing', () => {
            const miles = milesBetween(10, 0, -10, 0);
            expect(miles).toBeCloseTo(1380, 0); // ~1380 miles between 10N and 10S
        });

        it('should handle precision (close locations)', () => {
            const miles = milesBetween(34.0522, -118.2437, 34.0523, -118.2436);
            expect(miles).toBeLessThan(0.1); // Less than 0.1 miles for very close points
        });
    });

    describe('Haversine formula accuracy', () => {
        it('should match known distances', () => {
            // LA coordinates: 34.0522° N, 118.2437° W
            // SF coordinates: 37.7749° N, 122.4194° W
            // Expected: ~380 miles
            const miles = milesBetween(34.0522, -118.2437, 37.7749, -122.4194);
            expect(miles).toBeGreaterThan(370);
            expect(miles).toBeLessThan(390);
        });

        it('should match another known distance', () => {
            // Chicago to Detroit: ~280 miles
            const miles = milesBetween(41.8781, -87.6298, 42.3314, -83.0458);
            expect(miles).toBeGreaterThan(270);
            expect(miles).toBeLessThan(290);
        });
    });

    describe('Edge cases', () => {
        it('should handle zero latitude', () => {
            const miles = milesBetween(0, 0, 1, 0);
            expect(miles).toBeGreaterThan(0);
        });

        it('should handle zero longitude', () => {
            const miles = milesBetween(0, 0, 0, 1);
            expect(miles).toBeGreaterThan(0);
        });

        it('should handle decimal precision', () => {
            const miles1 = milesBetween(34.05, -118.24, 34.06, -118.25);
            const miles2 = milesBetween(34.052, -118.243, 34.062, -118.253);
            // Should be similar but not identical
            expect(miles1).toBeCloseTo(miles2, 1);
        });

        it('should handle large differences', () => {
            const miles = milesBetween(-90, 0, 90, 180);
            expect(miles).toBeGreaterThan(12000); // Close to Earth diameter
        });
    });

    describe('findNearbyDrivers', () => {
        const mockDrivers = [
            { id: 'driver1', lat: 34.0522, lng: -118.2437, isActive: true },
            { id: 'driver2', lat: 34.0550, lng: -118.2400, isActive: true },
            { id: 'driver3', lat: 34.1000, lng: -118.3000, isActive: true },
            { id: 'driver4', lat: 37.7749, lng: -122.4194, isActive: true }, // SF (380 miles away)
        ];

        it('should find drivers within radius', () => {
            const nearby = findNearbyDrivers(34.0522, -118.2437, mockDrivers, 10);
            expect(nearby.length).toBeGreaterThan(0);
            expect(nearby.some(d => d.id === 'driver1')).toBe(true);
        });

        it('should exclude drivers outside radius', () => {
            const nearby = findNearbyDrivers(34.0522, -118.2437, mockDrivers, 5);
            const hasSFDriver = nearby.some(d => d.id === 'driver4');
            expect(hasSFDriver).toBe(false);
        });

        it('should exclude inactive drivers', () => {
            const drivers = [
                { id: 'driver1', lat: 34.0522, lng: -118.2437, isActive: true },
                { id: 'driver2', lat: 34.0522, lng: -118.2437, isActive: false },
            ];
            const nearby = findNearbyDrivers(34.0522, -118.2437, drivers, 10);
            expect(nearby.some(d => d.id === 'driver2')).toBe(false);
        });

        it('should sort by distance', () => {
            const nearby = findNearbyDrivers(34.0522, -118.2437, mockDrivers, 10);
            for (let i = 1; i < nearby.length; i++) {
                expect(nearby[i].distance).toBeGreaterThanOrEqual(nearby[i - 1].distance);
            }
        });

        it('should return empty array if no drivers found', () => {
            const nearby = findNearbyDrivers(0, 0, mockDrivers, 1);
            expect(Array.isArray(nearby)).toBe(true);
        });

        it('should handle empty driver list', () => {
            const nearby = findNearbyDrivers(34.0522, -118.2437, [], 10);
            expect(nearby.length).toBe(0);
        });
    });

    describe('getLocation', () => {
        it('should return location object with lat and lng', () => {
            const loc = getLocation(34.0522, -118.2437);
            expect(loc).toHaveProperty('lat');
            expect(loc).toHaveProperty('lng');
            expect(loc.lat).toBe(34.0522);
            expect(loc.lng).toBe(-118.2437);
        });

        it('should handle negative coordinates', () => {
            const loc = getLocation(-34.0522, -118.2437);
            expect(loc.lat).toBe(-34.0522);
            expect(loc.lng).toBe(-118.2437);
        });
    });
});
