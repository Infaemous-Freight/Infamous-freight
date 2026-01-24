// Advanced Security Hardening Middleware
// Prevents $100K+ breach costs through comprehensive protection layers
// Implements OWASP Top 10 security best practices

const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const xss = require('xss');
const sqlstring = require('sqlstring');
const { logger } = require('./logger');

/**
 * Advanced rate limiting by user tier, IP, and endpoint
 */
const createAdvancedLimiter = (config) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    freeTier = 50,
    starterTier = 200,
    proTier = 1000,
    enterpriseTier = 5000,
  } = config;

  return rateLimit({
    windowMs,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.sub || req.ip;
    },
    max: (req) => {
      // Tier-based rate limits
      if (!req.user) return 100; // Unauthenticated
      
      const tier = req.user.tier;
      switch (tier) {
        case 'free': return freeTier;
        case 'starter': return starterTier;
        case 'pro': return proTier;
        case 'enterprise': return enterpriseTier;
        default: return freeTier;
      }
    },
    message: (req) => ({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(windowMs / 1000),
      tier: req.user?.tier || 'free',
      upgrade: 'https://app.infamous-freight.com/pricing',
    }),
    standardHeaders: true, // Return RateLimit-* headers
    legacyHeaders: false,  // Disable X-RateLimit-* headers
    handler: (req, res) => {
      // Log rate limit violations
      logger.warn({
        user: req.user?.sub || 'anonymous',
        ip: req.ip,
        path: req.path,
        tier: req.user?.tier || 'free',
      }, 'Rate limit exceeded');
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000),
        tier: req.user?.tier || 'free',
        upgrade: 'https://app.infamous-freight.com/pricing',
      });
    },
  });
};

/**
 * Endpoint-specific rate limiters
 */
const rateLimiters = {
  // API endpoints: Tier-based limits
  api: createAdvancedLimiter({
    windowMs: 15 * 60 * 1000,
    freeTier: 50,
    starterTier: 200,
    proTier: 1000,
    enterpriseTier: 5000,
  }),
  
  // Authentication endpoints: Strict limits
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many authentication attempts. Try again in 15 minutes.' },
  }),
  
  // AI endpoints: Premium limits
  ai: createAdvancedLimiter({
    windowMs: 60 * 1000, // 1 minute
    freeTier: 5,
    starterTier: 20,
    proTier: 100,
    enterpriseTier: 500,
  }),
  
  // Payment endpoints: Moderate limits
  payment: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    message: { error: 'Too many payment requests. Contact support if this is legitimate.' },
  }),
  
  // Export endpoints: Low limits
  export: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { error: 'Export limit reached. Try again in 1 hour.' },
  }),
};

/**
 * SQL Injection Protection Layer
 */
function sanitizeSQLInput(input) {
  if (typeof input !== 'string') return input;
  
  // Use sqlstring to escape SQL
  return sqlstring.escape(input).replace(/^'|'$/g, '');
}

function validateSQLInput(req, res, next) {
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\bor\b|\band\b).*?=.*?/i,           // OR/AND with equals
    /union.*?select/i,                     // UNION SELECT
    /insert\s+into/i,                      // INSERT INTO
    /delete\s+from/i,                      // DELETE FROM
    /drop\s+(table|database)/i,            // DROP TABLE/DATABASE
    /;.*?(select|insert|update|delete)/i,  // Multiple statements
    /--/,                                   // SQL comments
    /\/\*/,                                 // Block comments
    /xp_cmdshell/i,                        // SQL Server command execution
  ];

  const checkInput = (input) => {
    if (typeof input !== 'string') return false;
    return sqlPatterns.some(pattern => pattern.test(input));
  };

  const checkObject = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (checkInput(key) || checkInput(value)) return true;
      if (typeof value === 'object' && value !== null) {
        if (checkObject(value)) return true;
      }
    }
    return false;
  };

  // Check all request inputs
  const suspicious = 
    checkObject(req.body || {}) ||
    checkObject(req.query || {}) ||
    checkObject(req.params || {});

  if (suspicious) {
    logger.error({
      user: req.user?.sub || 'anonymous',
      ip: req.ip,
      path: req.path,
      body: req.body,
      query: req.query,
    }, 'SQL injection attempt detected');

    return res.status(400).json({
      error: 'Invalid input detected',
    });
  }

  next();
}

/**
 * XSS Protection Layer
 */
function sanitizeXSS(input) {
  if (typeof input !== 'string') return input;
  
  // Use xss library for comprehensive sanitization
  return xss(input, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
}

function protectXSS(req, res, next) {
  // Sanitize all string inputs
  const sanitizeObject = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        obj[key] = sanitizeXSS(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitizeObject(value);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
}

/**
 * NoSQL Injection Protection
 */
function validateNoSQLInput(req, res, next) {
  // Check for NoSQL injection patterns (MongoDB, etc.)
  const noSQLPatterns = [
    /\$where/i,        // $where operator
    /\$ne/i,           // $ne operator (not equal)
    /\$gt/i,           // $gt operator (greater than)
    /\$lt/i,           // $lt operator (less than)
    /\$regex/i,        // $regex operator
    /\{.*?\}/,         // Object notation
  ];

  const checkInput = (input) => {
    if (typeof input !== 'string') return false;
    return noSQLPatterns.some(pattern => pattern.test(input));
  };

  const checkObject = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (checkInput(key) || checkInput(value)) return true;
      if (typeof value === 'object' && value !== null) {
        if (checkObject(value)) return true;
      }
    }
    return false;
  };

  const suspicious = 
    checkObject(req.body || {}) ||
    checkObject(req.query || {}) ||
    checkObject(req.params || {});

  if (suspicious) {
    logger.error({
      user: req.user?.sub || 'anonymous',
      ip: req.ip,
      path: req.path,
    }, 'NoSQL injection attempt detected');

    return res.status(400).json({
      error: 'Invalid input detected',
    });
  }

  next();
}

/**
 * CSRF Protection (for session-based auth)
 */
function validateCSRFToken(req, res, next) {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip if using JWT (already has bearer token)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  // Validate CSRF token from header or body
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || token !== sessionToken) {
    logger.error({
      user: req.user?.sub || 'anonymous',
      ip: req.ip,
      path: req.path,
    }, 'CSRF validation failed');

    return res.status(403).json({
      error: 'CSRF validation failed',
    });
  }

  next();
}

/**
 * IP Whitelist/Blacklist
 */
class IPFilter {
  constructor() {
    this.blacklist = new Set();
    this.whitelist = new Set();
  }

  addToBlacklist(ip) {
    this.blacklist.add(ip);
    logger.info({ ip }, 'Added to blacklist');
  }

  addToWhitelist(ip) {
    this.whitelist.add(ip);
    logger.info({ ip }, 'Added to whitelist');
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip;

      // Check whitelist first
      if (this.whitelist.size > 0 && !this.whitelist.has(ip)) {
        return res.status(403).json({
          error: 'Access denied - IP not whitelisted',
        });
      }

      // Check blacklist
      if (this.blacklist.has(ip)) {
        logger.warn({ ip }, 'Blocked blacklisted IP');
        return res.status(403).json({
          error: 'Access denied',
        });
      }

      next();
    };
  }
}

const ipFilter = new IPFilter();

/**
 * Request signature validation (for API keys)
 */
function validateRequestSignature(req, res, next) {
  // Only validate if API key is present
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return next();

  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];

  if (!signature || !timestamp) {
    return res.status(401).json({
      error: 'Missing signature or timestamp',
    });
  }

  // Check timestamp (prevent replay attacks)
  const age = Date.now() - parseInt(timestamp, 10);
  if (age > 5 * 60 * 1000) { // 5 minutes
    return res.status(401).json({
      error: 'Request expired',
    });
  }

  // Validate signature
  const crypto = require('crypto');
  const payload = `${req.method}:${req.path}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac('sha256', apiKey)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.error({
      ip: req.ip,
      path: req.path,
    }, 'Invalid request signature');

    return res.status(401).json({
      error: 'Invalid signature',
    });
  }

  next();
}

/**
 * Input size limits
 */
function limitInputSize(maxBodySize = '100kb', maxFieldSize = 1000) {
  return (req, res, next) => {
    // Check overall body size (handled by body-parser)
    // Check individual field sizes
    const checkSize = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && value.length > maxFieldSize) {
          return res.status(400).json({
            error: `Field ${fullPath} exceeds maximum size of ${maxFieldSize} characters`,
          });
        }
        
        if (typeof value === 'object' && value !== null) {
          const result = checkSize(value, fullPath);
          if (result) return result;
        }
      }
    };

    if (req.body) {
      const result = checkSize(req.body);
      if (result) return result;
    }

    next();
  };
}

/**
 * Security headers middleware
 */
function securityHeaders(req, res, next) {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * Comprehensive security middleware stack
 */
function securityStack() {
  return [
    securityHeaders,
    validateSQLInput,
    validateNoSQLInput,
    protectXSS,
    limitInputSize('100kb', 1000),
    // Add more as needed
  ];
}

module.exports = {
  rateLimiters,
  createAdvancedLimiter,
  validateSQLInput,
  sanitizeSQLInput,
  protectXSS,
  sanitizeXSS,
  validateNoSQLInput,
  validateCSRFToken,
  ipFilter,
  validateRequestSignature,
  limitInputSize,
  securityHeaders,
  securityStack,
};

// Usage in routes:
/*
const { rateLimiters, securityStack } = require('./middleware/securityHardening');

// Apply to all routes
app.use(securityStack());

// Specific rate limiting
router.post('/api/ai/generate', rateLimiters.ai, async (req, res) => {
  // AI endpoint with tier-based limits
});

router.post('/api/export/csv', rateLimiters.export, async (req, res) => {
  // Export endpoint with low limits
});
*/
