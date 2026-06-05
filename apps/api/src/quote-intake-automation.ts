export type QuoteIntakePriority = 'urgent' | 'high' | 'standard' | 'review';

export type QuoteIntakeAutomationInput = {
  brokerName: string;
  originCity: string;
  destCity: string;
  freightType: string;
  weight: number;
  pickupDate: string;
  shipperRate: number;
  carrierCost: number;
  deliveryDeadline?: string;
  contactEmail?: string;
};

export type QuoteIntakeValidationResult =
  | { ok: true; input: QuoteIntakeAutomationInput }
  | { ok: false; missing: string[]; invalid: string[] };

export type GenesisPrioritization = {
  provider: 'genesis';
  mode: 'local_scoring';
  score: number;
  priority: QuoteIntakePriority;
  reasons: string[];
};

export type NotificationQueueItem = {
  channel: 'in_app';
  topic: 'quote_intake';
  recipientRole: 'owner' | 'admin' | 'dispatcher';
  priority: QuoteIntakePriority;
  dedupeKey: string;
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getPositiveNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isValidDate(value: string): boolean {
  return value.length > 0 && !Number.isNaN(Date.parse(value));
}

function getHoursUntil(isoDate: string): number {
  return (new Date(isoDate).getTime() - Date.now()) / 36e5;
}

function getPriority(score: number, marginPercent: number, hoursUntilPickup: number): QuoteIntakePriority {
  if (marginPercent < 8 || hoursUntilPickup < 0) return 'review';
  if (score >= 80) return 'urgent';
  if (score >= 55) return 'high';
  return 'standard';
}

export function validateQuoteIntakePayload(payload: Record<string, unknown>): QuoteIntakeValidationResult {
  const brokerName = getString(payload.brokerName);
  const originCity = getString(payload.originCity);
  const destCity = getString(payload.destCity);
  const freightType = getString(payload.freightType);
  const pickupDate = getString(payload.pickupDate);
  const deliveryDeadline = getString(payload.deliveryDeadline);
  const contactEmail = getString(payload.contactEmail);
  const weight = getPositiveNumber(payload.weight);
  const shipperRate = getPositiveNumber(payload.shipperRate);
  const carrierCost = getPositiveNumber(payload.carrierCost);

  const missing: string[] = [];
  const invalid: string[] = [];

  if (!brokerName) missing.push('brokerName');
  if (!originCity) missing.push('originCity');
  if (!destCity) missing.push('destCity');
  if (!freightType) missing.push('freightType');
  if (!pickupDate) missing.push('pickupDate');
  if (weight === null) missing.push('weight');
  if (shipperRate === null) missing.push('shipperRate');
  if (carrierCost === null) missing.push('carrierCost');

  if (pickupDate && !isValidDate(pickupDate)) invalid.push('pickupDate');
  if (deliveryDeadline && !isValidDate(deliveryDeadline)) invalid.push('deliveryDeadline');
  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) invalid.push('contactEmail');
  if (shipperRate !== null && carrierCost !== null && shipperRate <= carrierCost) {
    invalid.push('shipperRate');
  }
  if (pickupDate && deliveryDeadline && isValidDate(pickupDate) && isValidDate(deliveryDeadline)) {
    if (new Date(deliveryDeadline).getTime() <= new Date(pickupDate).getTime()) {
      invalid.push('deliveryDeadline');
    }
  }

  if (missing.length > 0 || invalid.length > 0) {
    return { ok: false, missing, invalid };
  }

  return {
    ok: true,
    input: {
      brokerName,
      originCity,
      destCity,
      freightType,
      weight: weight as number,
      pickupDate,
      shipperRate: shipperRate as number,
      carrierCost: carrierCost as number,
      ...(deliveryDeadline ? { deliveryDeadline } : {}),
      ...(contactEmail ? { contactEmail } : {}),
    },
  };
}

export function prioritizeQuoteWithGenesis(input: QuoteIntakeAutomationInput): GenesisPrioritization {
  const profitMargin = input.shipperRate - input.carrierCost;
  const marginPercent = (profitMargin / input.shipperRate) * 100;
  const hoursUntilPickup = getHoursUntil(input.pickupDate);
  const reasons: string[] = [];
  let score = 20;

  if (marginPercent >= 25) {
    score += 30;
    reasons.push('strong_margin');
  } else if (marginPercent >= 15) {
    score += 20;
    reasons.push('healthy_margin');
  } else if (marginPercent < 8) {
    score -= 10;
    reasons.push('thin_margin_review');
  }

  if (hoursUntilPickup <= 24) {
    score += 30;
    reasons.push('pickup_within_24h');
  } else if (hoursUntilPickup <= 72) {
    score += 15;
    reasons.push('pickup_within_72h');
  }

  if (input.weight >= 40000) {
    score += 10;
    reasons.push('heavy_load');
  }

  if (/hazmat|oversize|overweight/i.test(input.freightType)) {
    score -= 15;
    reasons.push('special_handling_review');
  }

  score = Math.max(0, Math.min(100, score));
  const priority = getPriority(score, marginPercent, hoursUntilPickup);

  return {
    provider: 'genesis',
    mode: 'local_scoring',
    score,
    priority,
    reasons: reasons.length > 0 ? reasons : ['standard_quote_intake'],
  };
}

export function buildQuoteIntakeNotifications(args: {
  tenantId: string;
  quoteRequestId: string;
  brokerName: string;
  originCity: string;
  destCity: string;
  priority: QuoteIntakePriority;
}): NotificationQueueItem[] {
  return ['dispatcher', 'admin'].map((recipientRole) => ({
    channel: 'in_app',
    topic: 'quote_intake',
    recipientRole: recipientRole as 'admin' | 'dispatcher',
    priority: args.priority,
    dedupeKey: `${args.tenantId}:quote_intake:${args.quoteRequestId}:${recipientRole}`,
    message: `New ${args.priority} quote intake from ${args.brokerName}: ${args.originCity} to ${args.destCity}.`,
  }));
}
