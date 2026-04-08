import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rateLimitMetrics = require("./rateLimitMetrics.cjs") as {
  recordHit: (name: string, key?: string) => void;
  recordBlocked: (name: string, key?: string) => void;
  recordSuccess: (name: string) => void;
  snapshot: () => Record<string, unknown>;
  reset: () => void;
};

export const recordHit = rateLimitMetrics.recordHit;
export const recordBlocked = rateLimitMetrics.recordBlocked;
export const recordSuccess = rateLimitMetrics.recordSuccess;
export const snapshot = rateLimitMetrics.snapshot;
export const reset = rateLimitMetrics.reset;

export default rateLimitMetrics;
