import { enforcePolicy } from "../policy/policy";
import type { GenesisPolicy, PolicyContext, Role } from "../policy/types";
import { detectIntent } from "./nlp";
import { rankLoads, type LoadCandidate } from "./scoring/loadScore";

export interface AICommandResponse {
  avatarState: "idle" | "suggesting" | "alert" | "critical";
  message: string;
  action?: { type: string; payload?: Record<string, unknown> };
}

export interface GenesisCommandInput {
  input: string;
  context?: Record<string, unknown>;
  candidates?: { loads?: LoadCandidate[] };
}

export interface CommandRouterDeps {
  role: Role;
  policy: GenesisPolicy;
  policyCtx: PolicyContext;
}

export function routeCommand(deps: CommandRouterDeps, req: GenesisCommandInput): AICommandResponse {
  const intent = detectIntent(req.input);

  switch (intent) {
    case "RECOMMEND_LOADS": {
      enforcePolicy(deps.policy, "RECOMMEND_LOADS", deps.policyCtx, req.context);
      return { avatarState: "suggesting", message: "I can recommend top loads now." };
    }
    case "AUTO_ASSIGN_BEST_LOAD": {
      enforcePolicy(deps.policy, "AUTO_ASSIGN_LOAD", deps.policyCtx, req.context);
      const loads = (req.candidates?.loads ?? []) as LoadCandidate[];
      const ranked = rankLoads(loads, {
        minRatePerMileCents:
          typeof req.context?.minRatePerMileCents === "number" ? (req.context.minRatePerMileCents as number) : undefined,
        avoidDeadheadOverMi:
          typeof req.context?.avoidDeadheadOverMi === "number" ? (req.context.avoidDeadheadOverMi as number) : undefined,
      });
      const best = ranked[0];
      if (!best) return { avatarState: "idle", message: "No OPEN loads available to auto-assign." };
      return {
        avatarState: "suggesting",
        action: { type: "AUTO_ASSIGN_LOAD", payload: { loadId: best.id, reason: best.reasons.slice(0, 3), score: best.score } },
        message: `Best load selected (${best.id}). Ready to claim/assign with one tap.`,
      };
    }
    default:
      return { avatarState: "idle", message: "Command acknowledged." };
  }
}
