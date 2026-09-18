export type FreightPricingRole = 'shipper' | 'carrier' | 'dispatch' | 'platform';

export type FreightPricingConfig = {
  defaultMarginPercent: number;
  minimumMarginDollars: number;
  dispatchFeePercent: number;
  dispatchManagedFeePercent: number;
  carrierProMonthly: number;
  carrierProPlusMonthly: number;
  starterMonthly: number;
  professionalMonthly: number;
  enterpriseMonthly: number;
};

export const DEFAULT_FREIGHT_PRICING: FreightPricingConfig = {
  // Configurable until Infamous Freight's final regulated business role is confirmed.
  defaultMarginPercent: 12,
  minimumMarginDollars: 150,
  dispatchFeePercent: 5,
  dispatchManagedFeePercent: 7,
  carrierProMonthly: 29,
  carrierProPlusMonthly: 79,
  starterMonthly: 99,
  professionalMonthly: 249,
  enterpriseMonthly: 499,
};

export type FreightQuoteInput = {
  carrierCost: number;
  accessorials?: number;
  marginPercent?: number;
  minimumMarginDollars?: number;
};

export type FreightQuote = {
  carrierCost: number;
  accessorials: number;
  marginDollars: number;
  customerPrice: number;
  marginPercent: number;
};

export function calculateFreightQuote(
  input: FreightQuoteInput,
  config: FreightPricingConfig = DEFAULT_FREIGHT_PRICING,
): FreightQuote {
  const carrierCost = Math.max(0, Number(input.carrierCost) || 0);
  const accessorials = Math.max(0, Number(input.accessorials) || 0);
  const marginPercent = Math.max(0, Number(input.marginPercent ?? config.defaultMarginPercent) || 0);
  const minimumMarginDollars = Math.max(0, Number(input.minimumMarginDollars ?? config.minimumMarginDollars) || 0);
  const marginBase = carrierCost + accessorials;
  const percentageMargin = marginBase * (marginPercent / 100);
  const marginDollars = Math.max(minimumMarginDollars, percentageMargin);
  const customerPrice = marginBase + marginDollars;

  return {
    carrierCost,
    accessorials,
    marginDollars: roundMoney(marginDollars),
    customerPrice: roundMoney(customerPrice),
    marginPercent: marginBase > 0 ? roundMoney((marginDollars / marginBase) * 100) : 0,
  };
}

export function calculateDispatchFee(
  grossLoadRevenue: number,
  managed = false,
  config: FreightPricingConfig = DEFAULT_FREIGHT_PRICING,
): number {
  const revenue = Math.max(0, Number(grossLoadRevenue) || 0);
  const rate = managed ? config.dispatchManagedFeePercent : config.dispatchFeePercent;
  return roundMoney(revenue * (rate / 100));
}

export function getPlatformPlans(config: FreightPricingConfig = DEFAULT_FREIGHT_PRICING) {
  return {
    starter: { monthly: config.starterMonthly, annual: config.starterMonthly * 10, description: 'Small dispatch operation' },
    professional: { monthly: config.professionalMonthly, annual: config.professionalMonthly * 10, description: 'Multi-user dispatch and AI operations' },
    enterprise: { monthly: config.enterpriseMonthly, annual: config.enterpriseMonthly * 10, description: 'Larger teams, API access and custom workflows' },
  };
}

export function getCarrierPlans(config: FreightPricingConfig = DEFAULT_FREIGHT_PRICING) {
  return {
    free: { monthly: 0, description: 'Verified carrier onboarding and eligible load access' },
    pro: { monthly: config.carrierProMonthly, description: 'Priority load alerts, filters, analytics and AI assistance' },
    proPlus: { monthly: config.carrierProPlusMonthly, description: 'Advanced dispatch workflows, analytics and priority support' },
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
