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
});
