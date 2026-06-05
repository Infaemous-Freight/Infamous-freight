import { randomUUID } from 'crypto';

export type LoadIntakePayload = Record<string, unknown>;

export type LoadIntakeValidationResult =
  | { ok: true; value: NormalizedLoadIntake }
  | { ok: false; issues: string[] };

export type GenesisPriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export type GenesisPriorityScore = {
  score: number;
  level: GenesisPriorityLevel;
  reasons: string[];
};

export type NormalizedLoadIntake = {
  brokerName: string;
  brokerMc?: string;
  originCity: string;
  originState: string;
  originLat: number;
  originLng: number;
  destCity: string;
  destState: string;
  destLat: number;
  destLng: number;
  distance: number;
  rate: number;
  ratePerMile: number;
  equipmentType: string;
  weight: number;
  pickupDate: string;
  deliveryDate?: string;
  status: string;
  notes?: string;
  shipperName?: string;
  shipperEmail?: string;
  specialInstructions?: string;
};

export type LoadIntakeResult = {
  intakeId: string;
  load: Record<string, unknown>;
  priority: GenesisPriorityScore;
  notification: {
    id: string;
    status: 'queued';
    channel: 'dispatcher_queue';
  };
};

const VALID_EQUIPMENT_TYPES = new Set([
  'dry_van',
  'reefer',
  'flatbed',
  'box_truck',
  'cargo_van',
  'sprinter_van',
  'step_deck',
  'lowboy',
  'tanker',
  'intermodal',
  'other',
]);

function normalizeEquipmentType(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function getString(payload: LoadIntakePayload, field: string): string | null {
  const value = payload[field];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getOptionalString(payload: LoadIntakePayload, field: string): string | undefined {
  return getString(payload, field) ?? undefined;
}

function getNumber(payload: LoadIntakePayload, field: string): number | null {
  const value = payload[field];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isValidDate(value: string): boolean {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
}

function getDate(payload: LoadIntakePayload, field: string): string | null {
  const value = getString(payload, field);
  return value && isValidDate(value) ? new Date(value).toISOString() : null;
}

function pushMissing(issues: string[], field: string) {
  issues.push(`${field} is required.`);
}

function pushInvalid(issues: string[], field: string, message: string) {
  issues.push(`${field} ${message}`);
}

export function validateLoadIntakePayload(payload: LoadIntakePayload): LoadIntakeValidationResult {
  const issues: string[] = [];

  const brokerName = getString(payload, 'brokerName');
  const originCity = getString(payload, 'originCity');
  const originState = getString(payload, 'originState');
  const originLat = getNumber(payload, 'originLat');
  const originLng = getNumber(payload, 'originLng');
  const destCity = getString(payload, 'destCity');
  const destState = getString(payload, 'destState');
  const destLat = getNumber(payload, 'destLat');
  const destLng = getNumber(payload, 'destLng');
  const distance = getNumber(payload, 'distance');
  const rate = getNumber(payload, 'rate');
  const weight = getNumber(payload, 'weight');
  const equipmentTypeRaw = getString(payload, 'equipmentType');
  const pickupDate = getDate(payload, 'pickupDate');
  const deliveryDate = getDate(payload, 'deliveryDate');

  if (!brokerName) pushMissing(issues, 'brokerName');
  if (!originCity) pushMissing(issues, 'originCity');
  if (!originState) pushMissing(issues, 'originState');
  if (originLat === null) pushMissing(issues, 'originLat');
  if (originLng === null) pushMissing(issues, 'originLng');
  if (!destCity) pushMissing(issues, 'destCity');
  if (!destState) pushMissing(issues, 'destState');
  if (destLat === null) pushMissing(issues, 'destLat');
  if (destLng === null) pushMissing(issues, 'destLng');
  if (distance === null) pushMissing(issues, 'distance');
  if (rate === null) pushMissing(issues, 'rate');
  if (weight === null) pushMissing(issues, 'weight');
  if (!equipmentTypeRaw) pushMissing(issues, 'equipmentType');
  if (!pickupDate) pushMissing(issues, 'pickupDate');

  if (originLat !== null && (originLat < -90 || originLat > 90)) pushInvalid(issues, 'originLat', 'must be between -90 and 90.');
  if (destLat !== null && (destLat < -90 || destLat > 90)) pushInvalid(issues, 'destLat', 'must be between -90 and 90.');
  if (originLng !== null && (originLng < -180 || originLng > 180)) pushInvalid(issues, 'originLng', 'must be between -180 and 180.');
  if (destLng !== null && (destLng < -180 || destLng > 180)) pushInvalid(issues, 'destLng', 'must be between -180 and 180.');
  if (distance !== null && distance <= 0) pushInvalid(issues, 'distance', 'must be greater than 0.');
  if (rate !== null && rate <= 0) pushInvalid(issues, 'rate', 'must be greater than 0.');
  if (weight !== null && weight <= 0) pushInvalid(issues, 'weight', 'must be greater than 0.');
  if (weight !== null && weight > 200_000) pushInvalid(issues, 'weight', 'must not exceed 200000 pounds.');

  const equipmentType = equipmentTypeRaw ? normalizeEquipmentType(equipmentTypeRaw) : null;
  if (equipmentType && !VALID_EQUIPMENT_TYPES.has(equipmentType)) {
    pushInvalid(issues, 'equipmentType', 'must be a supported freight equipment type.');
  }

  if (pickupDate && deliveryDate && Date.parse(deliveryDate) < Date.parse(pickupDate)) {
    pushInvalid(issues, 'deliveryDate', 'must be on or after pickupDate.');
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const normalizedDistance = Math.round(distance as number);
  const normalizedRate = rate as number;
  const normalizedRatePerMile = Number((normalizedRate / normalizedDistance).toFixed(2));

  return {
    ok: true,
    value: {
      brokerName: brokerName as string,
      brokerMc: getOptionalString(payload, 'brokerMc'),
      originCity: originCity as string,
      originState: (originState as string).toUpperCase(),
      originLat: originLat as number,
      originLng: originLng as number,
      destCity: destCity as string,
      destState: (destState as string).toUpperCase(),
      destLat: destLat as number,
      destLng: destLng as number,
      distance: normalizedDistance,
      rate: Number(normalizedRate.toFixed(2)),
      ratePerMile: normalizedRatePerMile,
      equipmentType: equipmentType as string,
      weight: Math.round(weight as number),
      pickupDate: pickupDate as string,
      deliveryDate: deliveryDate ?? undefined,
      status: getOptionalString(payload, 'status') ?? 'intake_pending',
      notes: getOptionalString(payload, 'notes'),
      shipperName: getOptionalString(payload, 'shipperName'),
      shipperEmail: getOptionalString(payload, 'shipperEmail'),
      specialInstructions: getOptionalString(payload, 'specialInstructions'),
    },
  };
}

export function calculateGenesisPriority(input: NormalizedLoadIntake, now = new Date()): GenesisPriorityScore {
  const reasons: string[] = [];
  let score = 30;
  const pickupMs = Date.parse(input.pickupDate);
  const hoursUntilPickup = (pickupMs - now.getTime()) / 3_600_000;

  if (hoursUntilPickup <= 12) {
    score += 30;
    reasons.push('pickup_within_12_hours');
  } else if (hoursUntilPickup <= 24) {
    score += 22;
    reasons.push('pickup_within_24_hours');
  } else if (hoursUntilPickup <= 48) {
    score += 14;
    reasons.push('pickup_within_48_hours');
  }

  if (input.ratePerMile >= 4) {
    score += 18;
    reasons.push('premium_rate_per_mile');
  } else if (input.ratePerMile >= 3) {
    score += 10;
    reasons.push('strong_rate_per_mile');
  }

  if (input.equipmentType === 'reefer' || input.equipmentType === 'flatbed' || input.equipmentType === 'tanker') {
    score += 10;
    reasons.push('specialized_equipment');
  }

  if (input.weight >= 44_000) {
    score += 8;
    reasons.push('heavy_load');
  }

  if (input.specialInstructions) {
    score += 6;
    reasons.push('special_instructions_present');
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  const level: GenesisPriorityLevel = normalizedScore >= 85
    ? 'critical'
    : normalizedScore >= 70
      ? 'high'
      : normalizedScore >= 45
        ? 'medium'
        : 'low';

  if (reasons.length === 0) {
    reasons.push('standard_intake');
  }

  return { score: normalizedScore, level, reasons };
}

export function createQueuedDispatcherNotification(priority: GenesisPriorityScore) {
  return {
    id: randomUUID(),
    status: 'queued' as const,
    channel: 'dispatcher_queue' as const,
    type: 'load_intake_created',
    priorityLevel: priority.level,
  };
}
