import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const middlewareLogger = require("./logger.cjs") as {
  httpLogger: unknown;
  logger: any;
  correlationMiddleware: unknown;
  performanceMiddleware: unknown;
  LOG_LEVEL: string;
  PERF_WARN_THRESHOLD: number;
  PERF_ERROR_THRESHOLD: number;
};

export const httpLogger = middlewareLogger.httpLogger;
export const logger = middlewareLogger.logger;
export const correlationMiddleware = middlewareLogger.correlationMiddleware;
export const performanceMiddleware = middlewareLogger.performanceMiddleware;
export const LOG_LEVEL = middlewareLogger.LOG_LEVEL;
export const PERF_WARN_THRESHOLD = middlewareLogger.PERF_WARN_THRESHOLD;
export const PERF_ERROR_THRESHOLD = middlewareLogger.PERF_ERROR_THRESHOLD;

export default middlewareLogger;
