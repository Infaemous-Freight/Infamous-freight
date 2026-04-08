import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rateLimitMetrics = require("./rateLimitMetrics.js");

export const recordHit = rateLimitMetrics.recordHit;
export const recordBlocked = rateLimitMetrics.recordBlocked;
export const recordSuccess = rateLimitMetrics.recordSuccess;
export const getMetrics = rateLimitMetrics.getMetrics;
export const resetMetrics = rateLimitMetrics.resetMetrics;

export default rateLimitMetrics;
