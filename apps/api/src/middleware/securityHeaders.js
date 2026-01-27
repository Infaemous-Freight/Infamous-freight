const helmet = require("helmet");
const { logger } = require("./logger");

function securityHeaders(app) {
  // Comprehensive security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: [
            "'self'",
            ...String(process.env.CORS_ORIGINS || "http://localhost:3000")
              .split(",")
              .map((o) => o.trim()),
          ],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests:
            process.env.NODE_ENV === "production" ? [] : [],
          reportUri: process.env.CSP_REPORT_URI
            ? [process.env.CSP_REPORT_URI]
            : [],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: {
        maxAge: 63072000, // 2 years
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
    }),
  );

  // SameSite cookie protection (Strict by default)
  app.use((req, res, next) => {
    const oldSet = res.set.bind(res);
    res.set = function (key, val) {
      if (key?.toLowerCase() === "set-cookie") {
        val = Array.isArray(val) ? val : [val];
        val = val.map((v) => {
          if (!v.includes("SameSite")) {
            v += "; SameSite=Strict; Secure; HttpOnly";
          }
          return v;
        });
      }
      return oldSet(key, val);
    };
    next();
  });

  // Additional OWASP headers
  app.use((req, res, next) => {
    // Prevent browsers from MIME-sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");

    // Enable XSS protection
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Prevent information disclosure
    res.setHeader("Server", "Server"); // Generic, don't reveal Express

    // Strict Transport Security
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );

    // Require HTTPS for all cookies
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Expect-CT", "max-age=86400, enforce");
    }

    next();
  });
}

function handleCSPViolation(req, res) {
  const violation = req.body;
  logger.warn(
    {
      type: "csp-violation",
      violatedDirective: violation["violated-directive"],
      blockedURI: violation["blocked-uri"],
      originalPolicy: violation["original-policy"],
      sourceFile: violation["source-file"],
      lineNumber: violation["line-number"],
      columnNumber: violation["column-number"],
    },
    "CSP Violation",
  );
  res.status(204).end();
}

module.exports = {
  securityHeaders,
  handleCSPViolation,
};
