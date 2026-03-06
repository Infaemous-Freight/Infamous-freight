export type Role = "ADMIN" | "OPERATOR" | "VIEWER" | "DRIVER";

export type GenesisActionType =
  | "VIEW_LOADBOARD"
  | "RECOMMEND_LOADS"
  | "AUTO_ASSIGN_LOAD"
  | "CLAIM_LOAD"
  | "CREATE_LOAD"
  | "VIEW_SHIPMENTS"
  | "UPDATE_SHIPMENT"
  | "OPTIMIZE_ROUTES";

export interface PolicyContext {
  tenantId: string;
  userId?: string;
  role: Role;
}

export interface PolicyDecision {
  allow: boolean;
  reason?: string;
}

export interface GenesisPolicy {
  decide(action: GenesisActionType, ctx: PolicyContext, meta?: Record<string, unknown>): PolicyDecision;
}
