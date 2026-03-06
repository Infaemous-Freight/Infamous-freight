import type { GenesisPolicy, PolicyDecision, GenesisActionType } from "./types";

export const defaultPolicy: GenesisPolicy = {
  decide(action: GenesisActionType, ctx, meta): PolicyDecision {
    const flags = (meta?.tenantFlags ?? {}) as Record<string, unknown>;

    if (flags.loadboardDisabled === true && (action === "VIEW_LOADBOARD" || action === "RECOMMEND_LOADS")) {
      return { allow: false, reason: "Load board disabled for tenant" };
    }

    if (action === "AUTO_ASSIGN_LOAD" && ctx.role !== "ADMIN" && ctx.role !== "OPERATOR") {
      return { allow: false, reason: "Auto-assign restricted to Admin/Operator" };
    }

    return { allow: true };
  },
};
