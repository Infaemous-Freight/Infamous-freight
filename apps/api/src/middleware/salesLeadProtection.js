const DEFAULT_SECRET_HEADER = 'x-sales-lead-secret';
const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_PER_IP = 5;

function parseCsvSet(value) {
  if (!value || typeof value !== 'string') return new Set();
  return new Set(
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function createSalesLeadProtection(options = {}) {
  const secretHeaderName =
    (options.secretHeaderName || process.env.SALES_LEAD_SECRET_HEADER || DEFAULT_SECRET_HEADER)
      .toLowerCase();
  const sharedSecret = options.sharedSecret ?? process.env.SALES_LEAD_SHARED_SECRET ?? '';
  const allowedOrigins =
    options.allowedOrigins || parseCsvSet(process.env.SALES_LEAD_ALLOWED_ORIGINS);
  const windowMs = parsePositiveInt(options.windowMs ?? process.env.SALES_LEAD_THROTTLE_WINDOW_MS, DEFAULT_WINDOW_MS);
  const maxPerIp = parsePositiveInt(options.maxPerIp ?? process.env.SALES_LEAD_THROTTLE_MAX_PER_IP, DEFAULT_MAX_PER_IP);

  const ipRequests = new Map();

  return function salesLeadProtection(req, res, next) {
    if (sharedSecret) {
      const provided = req.headers[secretHeaderName];
      if (provided !== sharedSecret) {
        return res.status(401).json({ error: 'Invalid sales lead secret header' });
      }
    }

    if (allowedOrigins.size > 0) {
      const requestOrigin = req.get('origin');
      if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
        return res.status(403).json({ error: 'Origin not allowed' });
      }
    }

    const ip = getClientIp(req);
    const now = Date.now();
    const existing = ipRequests.get(ip);

    if (!existing || now >= existing.resetAt) {
      ipRequests.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= maxPerIp) {
      return res.status(429).json({ error: 'Too many lead submissions from this IP' });
    }

    existing.count += 1;
    return next();
  };
}

module.exports = {
  createSalesLeadProtection,
  parseCsvSet,
  parsePositiveInt,
};
