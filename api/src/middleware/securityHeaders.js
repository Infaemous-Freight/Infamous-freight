const helmet = require("helmet");

function securityHeaders(app) {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
}

function handleCSPViolation(req, res) {
  res.status(204).end();
}

module.exports = {
  securityHeaders,
  handleCSPViolation,
};
