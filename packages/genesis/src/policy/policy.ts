import { defaultPolicy } from "./defaultPolicy";
import type { GenesisActionType, GenesisPolicy, PolicyContext } from "./types";

export function enforcePolicy(
  policy: GenesisPolicy | undefined,
  action: GenesisActionType,
  ctx: PolicyContext,
  meta?: Record<string, unknown>,
) {
  const p = policy ?? defaultPolicy;
  const d = p.decide(action, ctx, meta);
  if (!d.allow) throw new Error(`Forbidden by policy: ${d.reason ?? action}`);
}
