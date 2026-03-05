const {
  buildCommandPlan,
  calculateCarrierScore,
  detectIntent,
  executePlan,
  predictRatePerMile,
} = require("../aiFreightCommandEngine");

describe("aiFreightCommandEngine", () => {
  it("detects find carrier intent from natural language", () => {
    const intent = detectIntent("Find cheapest carrier for Dallas to Atlanta tomorrow");
    expect(intent.type).toBe("FIND_CARRIER");
  });

  it("builds a command plan from incoming prompt", () => {
    const plan = buildCommandPlan("Predict delivery delay for shipment IF-1202");
    expect(plan.intent).toBe("TRACK_SHIPMENT");
    expect(plan.tools[0].name).toBe("predictDelay");
  });

  it("calculates carrier score using weighted model", () => {
    const score = calculateCarrierScore({
      onTimeRate: 90,
      tenderAcceptance: 95,
      safetyScore: 92,
      priceCompetitiveness: 80,
      serviceRating: 85,
    });

    expect(score).toBeCloseTo(89.15, 2);
  });

  it("produces autonomous freight pricing output", () => {
    const prediction = predictRatePerMile({
      distanceMiles: 740,
      fuelPricePerGallon: 3.9,
      seasonalityIndex: 1.03,
      marketCapacityIndex: 0.95,
      carrierDemandIndex: 1.08,
      historicalSpotRatePerMile: 2.48,
    });

    expect(prediction.predictedRatePerMile).toBeGreaterThan(2);
    expect(prediction.confidenceScore).toBeGreaterThanOrEqual(0.52);
    expect(prediction.confidenceScore).toBeLessThanOrEqual(0.96);
  });

  it("executes carrier plan and returns score output", () => {
    const result = executePlan(
      {
        tools: [{ name: "findCarrier", arguments: { lane: "DAL-ATL" } }],
      },
      {
        carrierMetrics: {
          onTimeRate: 96,
          tenderAcceptance: 91,
          safetyScore: 95,
          priceCompetitiveness: 88,
          serviceRating: 92,
        },
      },
    );

    expect(result.summary).toBe("Carrier shortlist generated");
    expect(result.outputs[0].carrierScore).toBeGreaterThan(90);
  });

  it("executes rate prediction plan and returns pricing output", () => {
    const result = executePlan(
      {
        tools: [
          {
            name: "predictRate",
            arguments: {
              distanceMiles: 740,
              fuelPricePerGallon: 3.9,
              seasonalityIndex: 1.03,
              marketCapacityIndex: 0.95,
              carrierDemandIndex: 1.08,
              historicalSpotRatePerMile: 2.48,
            },
          },
        ],
      },
      {},
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result.outputs)).toBe(true);
    expect(result.outputs.length).toBeGreaterThan(0);
    expect(result.outputs[0].predictedRatePerMile).toBeGreaterThan(0);
  });

  it("executes delay prediction plan and returns tracking output", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    const result = executePlan(
      {
        tools: [
          {
            name: "predictDelay",
            arguments: {
              shipmentId: "IF-1202",
            },
          },
        ],
      },
      {},
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result.outputs)).toBe(true);
    expect(result.outputs.length).toBeGreaterThan(0);
    expect(typeof result.outputs[0]).toBe("object");

    jest.useRealTimers();
  });

  it("executes default plan branch for unknown tool", () => {
    const result = executePlan(
      {
        tools: [{ name: "unknownTool", arguments: {} }],
      },
      {},
    );

    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });
});
