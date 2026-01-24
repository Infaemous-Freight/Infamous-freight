export const AI_LOOKUP_KEYS = {
  ai_chat_1k_tokens:
    process.env.STRIPE_AI_CHAT_1K_TOKENS_LOOKUP_KEY ?? "ai_chat_1k_tokens",
  ai_dispatch:
    process.env.STRIPE_AI_DISPATCH_LOOKUP_KEY ?? "ai_dispatch",
  ai_invoice_audit:
    process.env.STRIPE_AI_INVOICE_AUDIT_LOOKUP_KEY ?? "ai_invoice_audit",
  ai_route_optimization:
    process.env.STRIPE_AI_ROUTE_OPTIMIZATION_LOOKUP_KEY ??
    "ai_route_optimization",
  ai_predictive_eta:
    process.env.STRIPE_AI_PREDICTIVE_ETA_LOOKUP_KEY ?? "ai_predictive_eta",
  ai_fleet_health_scan:
    process.env.STRIPE_AI_FLEET_HEALTH_SCAN_LOOKUP_KEY ??
    "ai_fleet_health_scan",
  ai_fraud_detection:
    process.env.STRIPE_AI_FRAUD_DETECTION_LOOKUP_KEY ??
    "ai_fraud_detection",
  ai_load_match:
    process.env.STRIPE_AI_LOAD_MATCH_LOOKUP_KEY ?? "ai_load_match",
} as const;

export type AiMeteredFeature = keyof typeof AI_LOOKUP_KEYS;
