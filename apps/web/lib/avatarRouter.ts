export type Avatar = "genesis" | "infinity_operator" | "crimson_oracle" | "chaos_spark";

export type Context = {
  commandMode: boolean;
  view: "home" | "chat" | "dashboard" | "billing" | "onboarding";
  event?: "milestone" | "upgrade" | "override" | "win" | "risk" | "forecast";
};

export function pickAvatar(ctx: Context): Avatar {
  // Genesis: rare, event-based
  if (ctx.event === "override" || ctx.event === "milestone" || ctx.event === "upgrade") return "genesis";

  // Command Mode: Infinity Operator dominates
  if (ctx.commandMode) return "infinity_operator";

  // Data contexts
  if (ctx.view === "dashboard" || ctx.event === "risk" || ctx.event === "forecast") return "crimson_oracle";

  // Engagement contexts
  if (ctx.view === "onboarding" || ctx.event === "win") return "chaos_spark";

  // Default
  return "infinity_operator";
}
