/**
 * ROI Calculator Service (Phase 21.4)
 * 
 * Calculates savings/ROI for enterprises
 * Formula:
 * - Current cost per load = avg broker fee + dispatch cost
 * - Infamous cost = platform fee + driver pay
 * - Savings = current - infamous
 */

// ============================================
// Cost Calculation
// ============================================

export interface RoiInput {
  currentBrokerFeePercent?: number;  // 8-12% typically
  currentDispatchCostPerLoad?: number; // $5-15 typically
  currentDriverPayPercent?: number;   // 65-75% of load
  
  estimatedLoadsPerMonth: number;
  averageLoadPrice: number;
  
  // Optional: customization
  plan?: "STARTER" | "GROWTH" | "PRO" | "ENTERPRISE";
  timezone?: string;
}

export interface RoiOutput {
  currentCostPerLoad: number;
  currentMonthlyLoadCost: number;
  currentMonthlyDispatchCost: number;
  currentMonthlyTotalCost: number;
  
  infamousCostPerLoad: number;
  infamousMonthlyPlatformFee: number;
  infamousMonthlyDriverPay: number;
  infamousMonthlyTotalCost: number;
  
  monthlySavings: number;
  annualSavings: number;
  savingsPercent: number;
  paybackMonths: number;
  
  breakdownCurrentByLoad: {
    brokerFee: number;
    dispatchCost: number;
    driverPay: number;
  };
  
  breakdownInfamousByLoad: {
    platformFee: number;
    driverPay: number;
  };
}

/**
 * Calculate ROI for a prospect
 */
export function calculateRoi(input: RoiInput): RoiOutput {
  // Defaults (industry standards)
  const brokerFeePercent = input.currentBrokerFeePercent || 0.10; // 10%
  const dispatchCostPerLoad = input.currentDispatchCostPerLoad || 8; // $8/load
  const currentDriverPayPercent = input.currentDriverPayPercent || 0.70; // 70%
  
  const loadsPerMonth = input.estimatedLoadsPerMonth;
  const avgLoadPrice = input.averageLoadPrice;
  const plan = input.plan || "STARTER";
  
  // ============================================
  // CURRENT COST (competitor's cost)
  // ============================================
  
  // Per load costs
  const brokerFeePerLoad = avgLoadPrice * brokerFeePercent;
  const driverPayCurrentPerLoad = avgLoadPrice * currentDriverPayPercent;
  const totalCurrentCostPerLoad =
    brokerFeePerLoad + dispatchCostPerLoad + driverPayCurrentPerLoad;
  
  // Monthly costs
  const currentMonthlyLoadCost = loadsPerMonth * brokerFeePerLoad;
  const currentMonthlyDispatchCost = loadsPerMonth * dispatchCostPerLoad;
  const currentMonthlyDriverPayCost = loadsPerMonth * driverPayCurrentPerLoad;
  const currentMonthlyTotalCost =
    currentMonthlyLoadCost +
    currentMonthlyDispatchCost +
    currentMonthlyDriverPayCost;
  
  // ============================================
  // INFAMOUS COST
  // ============================================
  
  // Get plan-specific pricing
  const planPricing = getPlanPricing(plan);
  const platformFeePerLoad = planPricing.platformFeePerLoad;
  const monthlyBase = planPricing.monthlyBase;
  
  // Driver pay is same (70% of load value)
  const driverPayInfamousPerLoad = avgLoadPrice * currentDriverPayPercent;
  const totalInfamousCostPerLoad =
    platformFeePerLoad + driverPayInfamousPerLoad;
  
  // Monthly costs
  const infamousMonthlyPlatformFee =
    loadsPerMonth * platformFeePerLoad + monthlyBase;
  const infamousMonthlyDriverPayCost =
    loadsPerMonth * driverPayInfamousPerLoad;
  const infamousMonthlyTotalCost =
    infamousMonthlyPlatformFee + infamousMonthlyDriverPayCost;
  
  // ============================================
  // SAVINGS CALCULATION
  // ============================================
  
  const monthlySavings =
    currentMonthlyTotalCost - infamousMonthlyTotalCost;
  const annualSavings = monthlySavings * 12;
  const savingsPercent =
    currentMonthlyTotalCost > 0
      ? (monthlySavings / currentMonthlyTotalCost) * 100
      : 0;
  
  // Payback period (implementation costs, training, etc. - ~$5k typical)
  const implementationCost = 5000;
  const paybackMonths =
    monthlySavings > 0
      ? Math.ceil(implementationCost / monthlySavings)
      : 999;
  
  return {
    currentCostPerLoad: totalCurrentCostPerLoad,
    currentMonthlyLoadCost,
    currentMonthlyDispatchCost,
    currentMonthlyTotalCost,
    
    infamousCostPerLoad: totalInfamousCostPerLoad,
    infamousMonthlyPlatformFee,
    infamousMonthlyDriverPay: infamousMonthlyDriverPayCost,
    infamousMonthlyTotalCost,
    
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    annualSavings: Math.round(annualSavings * 100) / 100,
    savingsPercent: Math.round(savingsPercent * 100) / 100,
    paybackMonths,
    
    breakdownCurrentByLoad: {
      brokerFee: brokerFeePerLoad,
      dispatchCost: dispatchCostPerLoad,
      driverPay: driverPayCurrentPerLoad,
    },
    
    breakdownInfamousByLoad: {
      platformFee: platformFeePerLoad,
      driverPay: driverPayInfamousPerLoad,
    },
  };
}

// ============================================
// Plan Pricing Reference
// ============================================

interface PlanPricing {
  name: string;
  monthlyBase: number;
  jobQuota: number;
  platformFeePerLoad: number;
  overagePrice?: number;
}

function getPlanPricing(plan: string): PlanPricing {
  // These align with Phase 7 pricing
  const planPricingMap: Record<string, PlanPricing> = {
    STARTER: {
      name: "Starter",
      monthlyBase: 29,
      jobQuota: 10,
      platformFeePerLoad: 5, // Simplified: actual = $base + %
      overagePrice: 1.5,
    },
    GROWTH: {
      name: "Growth",
      monthlyBase: 99,
      jobQuota: 100,
      platformFeePerLoad: 3.5, // Lower per-load with higher volume
      overagePrice: 1.25,
    },
    PRO: {
      name: "Pro",
      monthlyBase: 249,
      jobQuota: 999999,
      platformFeePerLoad: 2.5,
      overagePrice: 0,
    },
    ENTERPRISE: {
      name: "Enterprise",
      monthlyBase: 0,
      jobQuota: 999999,
      platformFeePerLoad: 2, // Lowest per-load, unlimited jobs
      overagePrice: 0,
    },
  };

  return planPricingMap[plan] || planPricingMap["STARTER"];
}

// ============================================
// Scenario Analysis
// ============================================

export interface ScenarioInput {
  loadsPerMonth: number[];
  averagePriceRange: {
    min: number;
    max: number;
  };
}

export interface ScenarioResult {
  scenario: string;
  annualSavings: number;
  roi: number;
}

/**
 * Compare multiple scenarios
 */
export function compareScenarios(
  input: ScenarioInput,
  plan: string = "GROWTH"
): ScenarioResult[] {
  const scenarios: ScenarioResult[] = [];

  for (const loads of input.loadsPerMonth) {
    for (const price of [
      input.averagePriceRange.min,
      (input.averagePriceRange.min + input.averagePriceRange.max) / 2,
      input.averagePriceRange.max,
    ]) {
      const roi = calculateRoi({
        estimatedLoadsPerMonth: loads,
        averageLoadPrice: price,
        plan: plan as any,
      });

      scenarios.push({
        scenario: `${loads} loads/month @ $${price}`,
        annualSavings: roi.annualSavings,
        roi: (roi.annualSavings / 5000) * 100, // 5k implementation cost
      });
    }
  }

  return scenarios;
}

// ============================================
// Export for Frontend
// ============================================

export const INDUSTRY_DEFAULTS = {
  brokerFeePercent: 0.10,
  dispatchCostPerLoad: 8,
  driverPayPercent: 0.70,
  implementationCost: 5000,
};

export const LOAD_PRICE_RANGES = {
  LOCAL_DELIVERY: { min: 50, max: 200 },
  REGIONAL: { min: 200, max: 800 },
  LONG_HAUL: { min: 800, max: 3000 },
  SPECIALTY: { min: 1000, max: 5000 },
};

export default {
  calculateRoi,
  compareScenarios,
  INDUSTRY_DEFAULTS,
  LOAD_PRICE_RANGES,
  getPlanPricing,
};
