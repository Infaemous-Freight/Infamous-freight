// Reuse centralized rate limiters from security middleware to avoid
// duplicating rate-limiting implementations and configuration.
// `security.js` exports `limiters` (general, auth, billing, ai).
// We alias those here for convenience.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { limiters } = require('./security');

export const authLimiter = limiters.auth;

// For tracking endpoints (e.g., frequent pings), reuse the general limiter
// from the centralized configuration to keep behavior consistent.
export const trackingLimiter = limiters.general;

export const generalLimiter = limiters.general;
