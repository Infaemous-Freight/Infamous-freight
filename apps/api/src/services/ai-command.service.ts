// Validation schema for commands is defined at the route layer; this service
// is responsible only for parsing validated commands into intents.
export type ParsedIntent =
  | { type: "PRICE_LOAD"; origin: string; destination: string }
  | { type: "FIND_CARRIER"; origin: string; destination: string }
  | { type: "PREDICT_DELAY"; shipmentId: string }
  | { type: "UNKNOWN"; raw: string };

export class AICommandService {
  parse(command: string): ParsedIntent {
    const normalized = command.trim().toLowerCase();

    const laneMatch =
      normalized.match(/(?:from)\s+([a-z\s]+)\s+(?:to)\s+([a-z\s]+)/i) ||
      normalized.match(/([a-z\s]+)\s*->\s*([a-z\s]+)/i);

    if (normalized.includes("price") || normalized.includes("quote")) {
      if (laneMatch) {
        return {
          type: "PRICE_LOAD",
          origin: laneMatch[1].trim(),
          destination: laneMatch[2].trim()
        };
      }
    }

    if (normalized.includes("carrier") || normalized.includes("book")) {
      if (laneMatch) {
        return {
          type: "FIND_CARRIER",
          origin: laneMatch[1].trim(),
          destination: laneMatch[2].trim()
        };
      }
    }

    const shipmentMatch = normalized.match(/shipment\s+([a-z0-9-_]+)/i);
    if (normalized.includes("delay") && shipmentMatch) {
      return {
        type: "PREDICT_DELAY",
        shipmentId: shipmentMatch[1]
      };
    }

    return {
      type: "UNKNOWN",
      raw: command
    };
  }
}
