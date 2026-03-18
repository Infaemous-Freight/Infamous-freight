import { logger } from "./lib/logger.js";

export async function startWorker() {
  logger.info("Infamous Freight worker started");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void startWorker();
}
