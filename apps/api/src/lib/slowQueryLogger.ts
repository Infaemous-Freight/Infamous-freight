import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const slowQueryLogger = require("./slowQueryLogger.cjs") as {
  attachSlowQueryLogger: (prisma: unknown) => unknown;
  SLOW_QUERY_THRESHOLD_MS: number;
};

export const attachSlowQueryLogger = slowQueryLogger.attachSlowQueryLogger;
export const SLOW_QUERY_THRESHOLD_MS = slowQueryLogger.SLOW_QUERY_THRESHOLD_MS;

export default slowQueryLogger;
