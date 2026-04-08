import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const queryMetrics = require("./queryMetrics.cjs") as {
  recordQuery: (payload: {
    model?: string;
    action?: string;
    duration: number;
    args?: unknown;
    error?: Error;
  }) => void;
  getSlowQueries: (limit?: number) => unknown[];
  clearSlowQueries: () => void;
  clear: () => void;
  DEFAULT_THRESHOLD: number;
};

export const recordQuery = queryMetrics.recordQuery;
export const getSlowQueries = queryMetrics.getSlowQueries;
export const clearSlowQueries = queryMetrics.clearSlowQueries;
export const clear = queryMetrics.clear;
export const DEFAULT_THRESHOLD = queryMetrics.DEFAULT_THRESHOLD;

export default queryMetrics;
