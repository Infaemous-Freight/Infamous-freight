export type AiCoreMode = 'public_assistant' | 'operator_assistant' | 'automation_recommendation';

export type AiCoreRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type AiCoreDecision = {
  allowed: boolean;
  riskLevel: AiCoreRiskLevel;
  requiresHumanReview: boolean;
  reasons: string[];
  blockedActions: string[];
};

export type AiCoreFreightContext = {
  mode: AiCoreMode;
  tenantId?: string;
  userRole?: string;
  workflow?: string;
  shipmentId?: string;
  quoteRequestId?: string;
  loadId?: string;
};

export type AiCoreRecommendation<T = Record<string, unknown>> = {
  provider: 'genesis';
  mode: AiCoreMode;
  riskLevel: AiCoreRiskLevel;
  requiresHumanReview: boolean;
  confidence: number;
  reasons: string[];
  blockedActions: string[];
  suggestedActions: string[];
  data: T;
};

export const INFAMOUS_FREIGHT_AI_CORE_VERSION = '2026.06.05';

export const INFAMOUS_FREIGHT_AI_CORE_NAME = 'Genesis AI Core';

export const INFAMOUS_FREIGHT_AI_SYSTEM_PROMPT = `
You are Genesis, the Infamous Freight AI Core.

Mission:
Help Infamous Freight shippers, carriers, brokers, dispatchers, drivers, and operators move freight faster with safer quote intake, shipment visibility, carrier matching, dispatch support, exception triage, billing support, and operational intelligence.

Operating principles:
- Be practical, concise, and freight-domain specific.
- Treat public visitors, authenticated operators, and automation workflows differently based on available context.
- Never invent shipment statuses, tracking events, prices, rates, account details, certifications, insurance status, legal conclusions, compliance determinations, or payment status.
- Do not make binding commitments, dispatch decisions, carrier approvals, payment changes, bank/account changes, legal claims, insurance guarantees, or compliance guarantees.
- For any action that affects a customer, carrier, shipment, quote, load, billing record, document status, compliance status, or dispatch workflow, require human review unless a future explicitly approved automation policy says otherwise.
- When data is missing, identify the missing fields and recommend the next safest workflow step.
- If a request involves private account data, live shipment details, billing, documents, or internal operations, direct the user to authenticated workflows or an Infamous Freight operator.
- Log recommendations and preserve auditability.
`.trim();

export const AI_CORE_BLOCKED_ACTIONS = [
  'approve_carrier',
  'reject_carrier',
  'book_load_without_operator',
  'dispatch_driver_without_operator',
  'send_binding_rate_confirmation',
  'change_payment_method',
  'change_bank_account',
  'release_payment',
  'mark_compliance_verified',
  'mark_insurance_verified',
  'provide_legal_advice',
  'provide_insurance_guarantee',
  'provide_hazmat_compliance_clearance',
  'invent_tracking_status',
  'invent_quote_price',
] as const;

const HIGH_RISK_PATTERNS = [
  /bank|routing|account number|wire|ach|payment method|payout/i,
  /approve.*carrier|carrier.*approved|insurance verified|authority verified/i,
  /dispatch.*driver|assign.*driver|book.*load|rate confirmation/i,
  /hazmat|hazardous|oversize|overweight|permit|escort/i,
  /legal|lawsuit|court|insurance claim|liability/i,
];

const MEDIUM_RISK_PATTERNS = [
  /quote|rate|price|margin|carrier cost|shipper rate/i,
  /tracking|shipment status|delivery status|eta/i,
  /detention|accessorial|invoice|billing/i,
  /pod|proof of delivery|document/i,
];

export function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeAiCoreText(value: unknown, maxLength = 4_000): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function classifyAiCoreRisk(text: string): AiCoreRiskLevel {
  const normalized = normalizeAiCoreText(text, 12_000);

  if (HIGH_RISK_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return 'high';
  }

  if (MEDIUM_RISK_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return 'medium';
  }

  return 'low';
}

export function evaluateAiCoreDecision(args: {
  text?: string;
  mode: AiCoreMode;
  requestedAction?: string;
  forceReview?: boolean;
}): AiCoreDecision {
  const riskLevel = classifyAiCoreRisk(`${args.text ?? ''} ${args.requestedAction ?? ''}`);
  const requestedAction = normalizeAiCoreText(args.requestedAction, 120);
  const blockedActions: string[] = [];
  const reasons: string[] = [];

  if (requestedAction && AI_CORE_BLOCKED_ACTIONS.includes(requestedAction as (typeof AI_CORE_BLOCKED_ACTIONS)[number])) {
    blockedActions.push(requestedAction);
    reasons.push('requested_action_blocked_by_ai_core_policy');
  }

  if (riskLevel === 'high') {
    reasons.push('high_risk_freight_or_account_context');
  } else if (riskLevel === 'medium') {
    reasons.push('operational_context_requires_review');
  } else {
    reasons.push('low_risk_assistance_context');
  }

  const requiresHumanReview = Boolean(
    args.forceReview ||
    args.mode !== 'public_assistant' ||
    riskLevel === 'medium' ||
    riskLevel === 'high' ||
    riskLevel === 'critical' ||
    blockedActions.length > 0,
  );

  return {
    allowed: blockedActions.length === 0,
    riskLevel,
    requiresHumanReview,
    reasons,
    blockedActions,
  };
}

export function buildAiCoreRecommendation<T = Record<string, unknown>>(args: {
  mode: AiCoreMode;
  confidence: number;
  reasons: string[];
  suggestedActions: string[];
  data: T;
  riskText?: string;
  requestedAction?: string;
  forceReview?: boolean;
}): AiCoreRecommendation<T> {
  const decision = evaluateAiCoreDecision({
    text: args.riskText,
    mode: args.mode,
    requestedAction: args.requestedAction,
    forceReview: args.forceReview,
  });

  return {
    provider: 'genesis',
    mode: args.mode,
    riskLevel: decision.riskLevel,
    requiresHumanReview: decision.requiresHumanReview,
    confidence: clampConfidence(args.confidence),
    reasons: [...args.reasons, ...decision.reasons],
    blockedActions: decision.blockedActions,
    suggestedActions: args.suggestedActions,
    data: args.data,
  };
}

export function getAiCorePublicDisclosure(): string {
  return 'Genesis can explain services and draft recommendations, but human Infamous Freight review is required for quotes, bookings, dispatch, compliance, billing, and account-specific decisions.';
}
