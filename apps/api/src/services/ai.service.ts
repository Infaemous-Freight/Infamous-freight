import type { AICommandRequest, AICommandResponse } from "@infamous/shared";

export function processAICommand(req: AICommandRequest): AICommandResponse {
  const text = req.input.trim().toLowerCase();

  if (text.includes("load") && (text.includes("best") || text.includes("recommend"))) {
    return {
      avatarState: "suggesting",
      action: { type: "NAVIGATE", payload: { to: "loadboard" } },
      message: "Opening Load Board — I’ll sort by profitability and shortest deadhead."
    };
  }

  if (text.includes("optimize") && text.includes("route")) {
    return {
      avatarState: "suggesting",
      action: { type: "NAVIGATE", payload: { to: "routes" } },
      message: "Routing is up — I’ll generate the most efficient path with your constraints."
    };
  }

  if (text.includes("track") && text.includes("shipment")) {
    return {
      avatarState: "idle",
      action: { type: "NAVIGATE", payload: { to: "shipments" } },
      message: "Shipments screen open — tap a shipment for live status and timeline."
    };
  }

  return {
    avatarState: "idle",
    message:
      "Command received. Try: “recommend best loads”, “optimize route”, or “track shipment”."
  };
}
