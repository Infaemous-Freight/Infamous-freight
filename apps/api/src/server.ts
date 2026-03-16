/**
 * server.ts — Infamous Freight API HTTP Server
 *
 * Boot order:
 *   1. Env validation (fails fast if misconfigured)
 *   2. Logger
 *   3. Express app creation
 *   4. HTTP server bind
 *   5. Graceful shutdown hooks
 */
import http from "node:http";
import { env } from "./env.js";
import { logger } from "./lib/logger.js";
import { createApp } from "./app.js";

const app = createApp();
const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      pid: process.pid,
    },
    "🚀 Infamous Freight API listening"
  );
});

function shutdown(signal: string) {
  logger.info({ signal }, "Received shutdown signal — draining connections");
  server.close((err) => {
    if (err) {
      logger.error(err, "Error during server shutdown");
      process.exit(1);
    }
    logger.info("Server closed cleanly");
    process.exit(0);
  });

  // Force exit after 10s if connections don't drain
  setTimeout(() => {
    logger.warn("Forced shutdown after 10s timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.fatal(err, "Uncaught exception — exiting");
  process.exit(1);
});

export default server;
