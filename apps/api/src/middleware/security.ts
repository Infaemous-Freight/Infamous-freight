import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const security = require("./security.js");

export const limiters = security.limiters;
export const rateLimit = security.rateLimit;
export const createLimiter = security.createLimiter;
export const createTunedLimiter = security.createTunedLimiter;
export const rateLimitMetrics = security.rateLimitMetrics;
export const authenticate = security.authenticate;
export const authenticateFlexible = security.authenticateFlexible;
export const requireScope = security.requireScope;
export const requireOrganization = security.requireOrganization;
export const auditLog = security.auditLog;
export const validateUserOwnership = security.validateUserOwnership;

export default security;
