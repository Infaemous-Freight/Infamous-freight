/**
 * Structured Logger — Pino
 * JSON logging in production, pretty-printed in development.
 */

import pino, { type Logger } from "pino";

const isDev = process.env.NODE_ENV === "development";

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),

  base: {
    service: process.env.SERVICE_NAME ?? "infamous-freight-worker",
    version: process.env.npm_package_version ?? "unknown",
    env: process.env.NODE_ENV ?? "development",
  },

  messageKey: "message",
  timestamp: pino.stdTimeFunctions.isoTime,

  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },

  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname,service,version,env",
        },
      }
    : undefined,
});
