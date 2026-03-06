import type { Intent } from "./intents";

export function detectIntent(input: string): Intent {
  const t = (input ?? "").toLowerCase();
  if (/(auto|assign)/.test(t) && /(best|top)/.test(t) && /(load|loads)/.test(t)) return "AUTO_ASSIGN_BEST_LOAD";
  if (/(recommend|suggest)/.test(t) && /(load|loads)/.test(t)) return "RECOMMEND_LOADS";
  if (/(loadboard|load board)/.test(t)) return "OPEN_LOADBOARD";
  if (/(shipment|track|eta)/.test(t)) return "TRACK_SHIPMENTS";
  if (/(route|optimi)/.test(t)) return "OPTIMIZE_ROUTES";
  if (/(help|\?)/.test(t)) return "HELP";
  return "UNKNOWN";
}
