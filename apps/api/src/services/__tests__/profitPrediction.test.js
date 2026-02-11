const { predictProfit } = require("../profitPrediction");

describe("predictProfit", () => {
  it("returns null when origin/destination and explicit distance are missing", () => {
    expect(predictProfit({})).toBeNull();
    expect(predictProfit({ origin: { lat: 34, lng: -118 } })).toBeNull();
  });

  it("falls back to safe minimum mpg when mpg is <= 0", () => {
    const withZeroMpg = predictProfit({
      distanceMiles: 200,
      ratePerMile: 3,
      mpg: 0,
      fuelPricePerGallon: 4,
    });

    const withNegativeMpg = predictProfit({
      distanceMiles: 200,
      ratePerMile: 3,
      mpg: -10,
      fuelPricePerGallon: 4,
    });

    expect(withZeroMpg.assumptions.mpg).toBe(3);
    expect(withNegativeMpg.assumptions.mpg).toBe(3);
    expect(withZeroMpg.totalCost).toBe(withNegativeMpg.totalCost);
  });

  it("clamps extreme economic and route inputs to bounded heuristic values", () => {
    const result = predictProfit({
      distanceMiles: 999999,
      ratePerMile: 999,
      mpg: 999,
      fuelPricePerGallon: 999,
    });

    expect(result.distanceMiles).toBe(5000);
    expect(result.assumptions.ratePerMile).toBe(20);
    expect(result.assumptions.mpg).toBe(15);
    expect(result.assumptions.fuelPricePerGallon).toBe(15);
  });

  it("rounds currency and margin outputs to 2 decimal places", () => {
    const result = predictProfit({
      distanceMiles: 100.555,
      ratePerMile: 2.333,
      mpg: 8.8,
      fuelPricePerGallon: 3.333,
      baseCost: 12.345,
      driverCostPerMile: 0.456,
      maintenanceCostPerMile: 0.123,
    });

    expect(result.distanceMiles).toBe(100.56);
    expect(result.grossRevenue).toBe(234.29);
    expect(result.totalCost).toBe(111.33);
    expect(result.netProfit).toBe(122.96);
    expect(result.profitMarginPct).toBe(52.48);
  });

  it("computes distance from origin/destination coordinates when distance is omitted", () => {
    const result = predictProfit({
      origin: { lat: 34.0522, lng: -118.2437 },
      destination: { lat: 36.1699, lng: -115.1398 },
      ratePerMile: 3,
    });

    expect(result.distanceMiles).toBeGreaterThan(220);
    expect(result.distanceMiles).toBeLessThan(240);
  });
});
