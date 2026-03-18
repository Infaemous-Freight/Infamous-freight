import { logger } from "../utils/logger.js";

export function startAIApp() {
  logger.info("Infamous Freight AI app started");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startAIApp();
}
