/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Unit Tests for Pricing Module
 */

const { computePriceUsd } = require('../pricing');

describe('Pricing Module', () => {
    describe('computePriceUsd', () => {
        const basePrice = 5.0;
        const pricePerMile = 1.5;
        const pricePerMinute = 0.25;

        beforeEach(() => {
            process.env.STRIPE_PRICE_BASE = basePrice.toString();
            process.env.STRIPE_PRICE_PER_MILE = pricePerMile.toString();
            process.env.STRIPE_PRICE_PER_MINUTE = pricePerMinute.toString();
        });

        it('should calculate base price with no distance or time', () => {
            const price = computePriceUsd(0, 0);
            expect(price).toBe(basePrice);
        });

        it('should include distance calculation', () => {
            const miles = 10;
            const price = computePriceUsd(miles, 0);
            expect(price).toBe(basePrice + miles * pricePerMile);
            expect(price).toBe(20); // 5 + 10*1.5
        });

        it('should include time calculation', () => {
            const minutes = 30;
            const price = computePriceUsd(0, minutes);
            expect(price).toBe(basePrice + minutes * pricePerMinute);
            expect(price).toBe(12.5); // 5 + 30*0.25
        });

        it('should combine distance and time', () => {
            const miles = 5;
            const minutes = 20;
            const price = computePriceUsd(miles, minutes);
            expect(price).toBe(basePrice + miles * pricePerMile + minutes * pricePerMinute);
            expect(price).toBe(15); // 5 + 5*1.5 + 20*0.25
        });

        it('should apply BASIC plan discount (no discount)', () => {
            const price = computePriceUsd(10, 30, 'BASIC');
            const baseComputePrice = basePrice + 10 * pricePerMile + 30 * pricePerMinute;
            expect(price).toBe(baseComputePrice);
        });

        it('should apply PLUS plan discount (10%)', () => {
            const price = computePriceUsd(10, 30, 'PLUS');
            const baseComputePrice = basePrice + 10 * pricePerMile + 30 * pricePerMinute;
            expect(price).toBeCloseTo(baseComputePrice * 0.9, 2);
        });

        it('should apply PRO plan discount (20%)', () => {
            const price = computePriceUsd(10, 30, 'PRO');
            const baseComputePrice = basePrice + 10 * pricePerMile + 30 * pricePerMinute;
            expect(price).toBeCloseTo(baseComputePrice * 0.8, 2);
        });

        it('should apply ENTERPRISE plan discount (30%)', () => {
            const price = computePriceUsd(10, 30, 'ENTERPRISE');
            const baseComputePrice = basePrice + 10 * pricePerMile + 30 * pricePerMinute;
            expect(price).toBeCloseTo(baseComputePrice * 0.7, 2);
        });

        it('should treat unknown plan as BASIC (no discount)', () => {
            const price = computePriceUsd(10, 30, 'UNKNOWN');
            const basicPrice = computePriceUsd(10, 30, 'BASIC');
            expect(price).toBe(basicPrice);
        });

        it('should handle decimal distances', () => {
            const price = computePriceUsd(5.5, 0);
            expect(price).toBeCloseTo(basePrice + 5.5 * pricePerMile, 2);
        });

        it('should return positive price', () => {
            const price = computePriceUsd(100, 120, 'PRO');
            expect(price).toBeGreaterThan(0);
        });

        it('should round to 2 decimal places for currency', () => {
            const price = computePriceUsd(3.33, 7.77);
            expect(price.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
        });

        it('should handle zero miles and minutes', () => {
            const price = computePriceUsd(0, 0, 'PLUS');
            expect(price).toBeCloseTo(basePrice * 0.9, 2);
        });

        it('should handle large distances', () => {
            const price = computePriceUsd(1000, 0);
            expect(price).toBeCloseTo(basePrice + 1000 * pricePerMile);
        });
    });

    describe('Price comparison edge cases', () => {
        beforeEach(() => {
            process.env.STRIPE_PRICE_BASE = '5';
            process.env.STRIPE_PRICE_PER_MILE = '1.5';
            process.env.STRIPE_PRICE_PER_MINUTE = '0.25';
        });

        it('should be deterministic (same input = same output)', () => {
            const price1 = computePriceUsd(10, 30, 'PLUS');
            const price2 = computePriceUsd(10, 30, 'PLUS');
            expect(price1).toBe(price2);
        });

        it('should increase with distance', () => {
            const price1 = computePriceUsd(5, 0);
            const price2 = computePriceUsd(10, 0);
            expect(price2).toBeGreaterThan(price1);
        });

        it('should increase with time', () => {
            const price1 = computePriceUsd(0, 10);
            const price2 = computePriceUsd(0, 20);
            expect(price2).toBeGreaterThan(price1);
        });

        it('higher plan should result in lower price', () => {
            const basicPrice = computePriceUsd(10, 30, 'BASIC');
            const plusPrice = computePriceUsd(10, 30, 'PLUS');
            const proPrice = computePriceUsd(10, 30, 'PRO');

            expect(basicPrice).toBeGreaterThan(plusPrice);
            expect(plusPrice).toBeGreaterThan(proPrice);
        });
    });
});
