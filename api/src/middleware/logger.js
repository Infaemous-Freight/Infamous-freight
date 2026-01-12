const pino = require("pino");
const pinoHttp = require("pino-http");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

const httpLogger = pinoHttp({ logger });

function correlationMiddleware(req, _res, next) {
  req.correlationId =
    req.headers["x-correlation-id"] || `${Date.now()}-${Math.random()}`;
  next();
}

function performanceMiddleware(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        duration,
      },
      "request",
    );
  });
  next();
}

module.exports = {
  httpLogger,
  logger,
  correlationMiddleware,
  performanceMiddleware,
};
