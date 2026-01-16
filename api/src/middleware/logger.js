const pino = require("pino");
const pinoHttp = require("pino-http");

const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const PERF_WARN_THRESHOLD = parseInt(process.env.PERF_WARN_THRESHOLD_MS || "1000", 10);
const PERF_ERROR_THRESHOLD = parseInt(process.env.PERF_ERROR_THRESHOLD_MS || "5000", 10);

const logger = pino({
  level: LOG_LEVEL,
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

const httpLogger = pinoHttp({
  logger,
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration_ms',
  },
});

function correlationMiddleware(req, _res, next) {
  req.correlationId =
    req.headers["x-correlation-id"] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // Surface correlation ID to downstream services and clients
  req.setHeader?.("x-correlation-id", req.correlationId);
  _res?.setHeader?.("x-correlation-id", req.correlationId);
  req.startTime = Date.now();
  next();
}

function performanceMiddleware(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = duration > PERF_ERROR_THRESHOLD ? 'error' : duration > PERF_WARN_THRESHOLD ? 'warn' : 'info';

    const logEntry = {
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      duration_ms: duration,
      correlationId: req.correlationId,
      user: req.user?.sub,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 100),
    };

    // Add performance level info
    if (duration > PERF_ERROR_THRESHOLD) {
      logEntry.performance = 'critical';
    } else if (duration > PERF_WARN_THRESHOLD) {
      logEntry.performance = 'slow';
    }

    logger[logLevel](logEntry, `request [${res.statusCode}]`);
  });
  next();
}

module.exports = {
  httpLogger,
  logger,
  correlationMiddleware,
  performanceMiddleware,
  LOG_LEVEL,
  PERF_WARN_THRESHOLD,
  PERF_ERROR_THRESHOLD,
};
