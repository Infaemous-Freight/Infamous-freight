/**
 * Lane profitability + broker risk scoring utilities
 */

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function calculateBrokerScore(data = {}) {
  return (
    toNumber(data.paymentScore) * 0.4 +
    toNumber(data.creditScore) * 0.3 +
    toNumber(data.userReportsScore) * 0.2 +
    toNumber(data.disputeScore) * 0.1
  );
}

function calculateLaneProfitability(input = {}) {
  const rate = toNumber(input.rate);
  const mileage = toNumber(input.mileage);
  const fuelPrice = toNumber(input.fuelPrice);
  const mpg = Math.max(toNumber(input.mpg, 1), 1);
  const detentionHours = toNumber(input.detentionHours);
  const brokerScore = toNumber(input.brokerScore, 100);

  const fuelCost = (mileage / mpg) * fuelPrice;
  const detentionCost = detentionHours * 50;
  const riskPenalty = (100 - brokerScore) * 2;
  const netProfit = rate - fuelCost - detentionCost - riskPenalty;

  let recommendation = "ACCEPT";
  if (netProfit < 500) recommendation = "NEGOTIATE";
  if (netProfit < 200) recommendation = "DECLINE";

  return {
    fuelCost,
    detentionCost,
    riskPenalty,
    netProfit,
    recommendation,
  };
}

module.exports = {
  calculateBrokerScore,
  calculateLaneProfitability,
};
