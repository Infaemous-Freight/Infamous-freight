const {
  calculateBrokerScore,
  calculateLaneProfitability,
} = require("../../services/profitabilityEngine");

describe("profitabilityEngine", () => {
  test("calculates weighted broker score", () => {
    const score = calculateBrokerScore({
      paymentScore: 90,
      creditScore: 80,
      userReportsScore: 70,
      disputeScore: 60,
    });

    expect(score).toBe(81);
  });

  test("calculates lane recommendation", () => {
    const result = calculateLaneProfitability({
      rate: 2500,
      mileage: 1000,
      fuelPrice: 4,
      mpg: 8,
      detentionHours: 2,
      brokerScore: 85,
    });

    expect(result.netProfit).toBe(1870);
    expect(result.recommendation).toBe("ACCEPT");
  });

  test("handles invalid and non-numeric inputs safely", () => {
    const callWithInvalidInputs = () =>
      calculateLaneProfitability({
        rate: "abc",
        mileage: null,
        fuelPrice: undefined,
        mpg: "not-a-number",
        detentionHours: NaN,
        brokerScore: "90",
      });

    const result = callWithInvalidInputs();

    expect(result).toBeDefined();
    expect(typeof result.netProfit).toBe("number");
    expect(Number.isNaN(result.netProfit)).toBe(false);
    expect(Number.isFinite(result.netProfit)).toBe(true);
    expect(typeof result.recommendation).toBe("string");
    expect(["ACCEPT", "REVIEW", "REJECT"]).toContain(result.recommendation);
  });

  test("handles edge numeric values (negative, zero, very large)", () => {
    const negativeResult = calculateLaneProfitability({
      rate: -1000,
      mileage: -500,
      fuelPrice: -3,
      mpg: -5,
      detentionHours: -1,
      brokerScore: -10,
    });

    expect(typeof negativeResult.netProfit).toBe("number");
    expect(Number.isNaN(negativeResult.netProfit)).toBe(false);
    expect(typeof negativeResult.recommendation).toBe("string");
    expect(["ACCEPT", "REVIEW", "REJECT"]).toContain(negativeResult.recommendation);

    const zeroResult = calculateLaneProfitability({
      rate: 0,
      mileage: 0,
      fuelPrice: 0,
      mpg: 0,
      detentionHours: 0,
      brokerScore: 0,
    });

    expect(typeof zeroResult.netProfit).toBe("number");
    expect(Number.isNaN(zeroResult.netProfit)).toBe(false);
    expect(typeof zeroResult.recommendation).toBe("string");
    expect(["ACCEPT", "REVIEW", "REJECT"]).toContain(zeroResult.recommendation);

    const largeResult = calculateLaneProfitability({
      rate: 1_000_000,
      mileage: 10_000,
      fuelPrice: 10,
      mpg: 3,
      detentionHours: 48,
      brokerScore: 100,
    });

    expect(typeof largeResult.netProfit).toBe("number");
    expect(Number.isNaN(largeResult.netProfit)).toBe(false);
    expect(Number.isFinite(largeResult.netProfit)).toBe(true);
    expect(typeof largeResult.recommendation).toBe("string");
    expect(["ACCEPT", "REVIEW", "REJECT"]).toContain(largeResult.recommendation);
  });

  test("applies recommendation thresholds around net profit of 500", () => {
    // These rates are chosen to exercise the business rule boundaries.
    const justBelowAccept = calculateLaneProfitability({
      rate: 1125,
      mileage: 1000,
      fuelPrice: 4,
      mpg: 8,
      detentionHours: 2,
      brokerScore: 85,
    });

    const atAcceptThreshold = calculateLaneProfitability({
      rate: 1130,
      mileage: 1000,
      fuelPrice: 4,
      mpg: 8,
      detentionHours: 2,
      brokerScore: 85,
    });

    const justAboveAccept = calculateLaneProfitability({
      rate: 1135,
      mileage: 1000,
      fuelPrice: 4,
      mpg: 8,
      detentionHours: 2,
      brokerScore: 85,
    });

    expect(["REVIEW", "REJECT"]).toContain(justBelowAccept.recommendation);
    expect(atAcceptThreshold.recommendation).toBe("ACCEPT");
    expect(atAcceptThreshold.netProfit).toBeGreaterThanOrEqual(500);
    expect(justAboveAccept.recommendation).toBe("ACCEPT");
  });

  test("applies recommendation thresholds around net profit of 200", () => {
    const justBelowReview = calculateLaneProfitability({
      rate: 825,
      mileage: 1000,
      fuelPrice: 4,
      mpg: 8,
      detentionHours: 2,
      brokerScore: 85,
    });

    const atReviewThreshold = calculateLaneProfitability({
      rate: 830,
      mileage: 1000,
      fuelPrice: 4,
      mpg: 8,
      detentionHours: 2,
      brokerScore: 85,
    });

    const justAboveReview = calculateLaneProfitability({
      rate: 835,
      mileage: 1000,
      fuelPrice: 4,
      mpg: 8,
      detentionHours: 2,
      brokerScore: 85,
    });

    expect(justBelowReview.recommendation).toBe("REJECT");
    expect(atReviewThreshold.recommendation).toBe("REVIEW");
    expect(atReviewThreshold.netProfit).toBeGreaterThanOrEqual(200);
    expect(["REVIEW", "ACCEPT"]).toContain(justAboveReview.recommendation);
  });

  test("protects against division by zero in MPG calculation", () => {
    const result = calculateLaneProfitability({
      rate: 1000,
      mileage: 500,
      fuelPrice: 4,
      mpg: 0,
      detentionHours: 1,
      brokerScore: 80,
    });

    expect(typeof result.netProfit).toBe("number");
    expect(Number.isNaN(result.netProfit)).toBe(false);
    expect(Number.isFinite(result.netProfit)).toBe(true);
    expect(typeof result.recommendation).toBe("string");
    expect(["ACCEPT", "REVIEW", "REJECT"]).toContain(result.recommendation);
  });
});
