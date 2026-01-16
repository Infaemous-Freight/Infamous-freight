/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Unit Tests for Pricing Module
 */

const { computePriceUsd } = require("../pricing");

describe("Pricing Module", () => {
  describe("computePriceUsd", () => {
    const basePrice = 5.0;
    const pricePerMile = 1.5;
    const pricePerMinute = 0.25;

    beforeEach(() => {
      process.env.PRICE_BASE_USD = basePrice.toString();
      process.env.PRICE_PER_MILE_USD = pricePerMile.toString();
      process.env.PRICE_PER_MINUTE_USD = pricePerMinute.toString();
      process.env.PRICE_MINIMUM_USD = "0";
    });

    it("should calculate base price with no distance or time", () => {
      const price = computePriceUsd({ estimatedMiles: 0, estimatedMinutes: 0 });
      expect(price).toBe(basePrice);
    });

    it("should include distance calculation", () => {
      const miles = 10;
      const price = computePriceUsd({
        estimatedMiles: miles,
        estimatedMinutes: 0,
      });
      expect(price).toBe(basePrice + miles * pricePerMile);
      expect(price).toBe(20); // 5 + 10*1.5
    });

    it("should include time calculation", () => {
      const minutes = 30;
      const price = computePriceUsd({
        estimatedMiles: 0,
        estimatedMinutes: minutes,
      });
      expect(price).toBe(basePrice + minutes * pricePerMinute);
      expect(price).toBe(12.5); // 5 + 30*0.25
    });

    it("should combine distance and time", () => {
      const miles = 5;
      const minutes = 20;
      const price = computePriceUsd({
        estimatedMiles: miles,
        estimatedMinutes: minutes,
      });
      const expectedPrice =
        basePrice + miles * pricePerMile + minutes * pricePerMinute; // 5 + 7.5 + 5 = 17.5
      expect(price).toBe(expectedPrice);
    });

    it("should apply BASIC plan discount (no discount)", () => {
      const price = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "BASIC",
      });
      const baseComputePrice =
        basePrice + 10 * pricePerMile + 30 * pricePerMinute;
      expect(price).toBe(baseComputePrice);
    });

    it("should apply STARTER plan discount (10%)", () => {
      const price = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "STARTER",
      });
      const baseComputePrice =
        basePrice + 10 * pricePerMile + 30 * pricePerMinute;
      expect(price).toBeCloseTo(baseComputePrice * 0.9, 2);
    });

    it("should apply PRO plan discount (20%)", () => {
      const price = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "PRO",
      });
      const baseComputePrice =
        basePrice + 10 * pricePerMile + 30 * pricePerMinute;
      expect(price).toBeCloseTo(baseComputePrice * 0.8, 2);
    });

    it("should apply ENTERPRISE plan discount (30%)", () => {
      const price = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "ENTERPRISE",
      });
      const baseComputePrice =
        basePrice + 10 * pricePerMile + 30 * pricePerMinute;
      expect(price).toBeCloseTo(baseComputePrice * 0.7, 2);
    });

    it("should treat unknown plan as BASIC (no discount)", () => {
      const price = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "UNKNOWN",
      });
      const basicPrice = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "BASIC",
      });
      expect(price).toBe(basicPrice);
    });

    it("should handle decimal distances", () => {
      const price = computePriceUsd({
        estimatedMiles: 5.5,
        estimatedMinutes: 0,
      });
      expect(price).toBeCloseTo(basePrice + 5.5 * pricePerMile, 2);
    });

    it("should return positive price", () => {
      const price = computePriceUsd({
        estimatedMiles: 100,
        estimatedMinutes: 120,
        shipperPlanTier: "PRO",
      });
      expect(price).toBeGreaterThan(0);
    });

    it("should round to 2 decimal places for currency", () => {
      const price = computePriceUsd({
        estimatedMiles: 3.33,
        estimatedMinutes: 7.77,
      });
      expect(price.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(
        2,
      );
    });

    it("should handle zero miles and minutes", () => {
      const price = computePriceUsd({
        estimatedMiles: 0,
        estimatedMinutes: 0,
        shipperPlanTier: "STARTER",
      });
      expect(price).toBeCloseTo(basePrice * 0.9, 2);
    });

    it("should handle large distances", () => {
      const price = computePriceUsd({
        estimatedMiles: 1000,
        estimatedMinutes: 0,
      });
      expect(price).toBeCloseTo(basePrice + 1000 * pricePerMile);
    });
  });

  describe("Price comparison edge cases", () => {
    beforeEach(() => {
      process.env.PRICE_BASE_USD = "5";
      process.env.PRICE_PER_MILE_USD = "1.5";
      process.env.PRICE_PER_MINUTE_USD = "0.25";
      process.env.PRICE_MINIMUM_USD = "0";
    });

    it("should be deterministic (same input = same output)", () => {
      const price1 = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "STARTER",
      });
      const price2 = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "STARTER",
      });
      expect(price1).toBe(price2);
    });

    it("should increase with distance", () => {
      const price1 = computePriceUsd({
        estimatedMiles: 5,
        estimatedMinutes: 0,
      });
      const price2 = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 0,
      });
      expect(price2).toBeGreaterThan(price1);
    });

    it("should increase with time", () => {
      const price1 = computePriceUsd({
        estimatedMiles: 0,
        estimatedMinutes: 10,
      });
      const price2 = computePriceUsd({
        estimatedMiles: 0,
        estimatedMinutes: 20,
      });
      expect(price2).toBeGreaterThan(price1);
    });

    it("higher plan should result in lower price", () => {
      const basicPrice = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "BASIC",
      });
      const starterPrice = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "STARTER",
      });
      const proPrice = computePriceUsd({
        estimatedMiles: 10,
        estimatedMinutes: 30,
        shipperPlanTier: "PRO",
      });

      expect(basicPrice).toBeGreaterThan(starterPrice);
      expect(starterPrice).toBeGreaterThan(proPrice);
    });
  });
});
