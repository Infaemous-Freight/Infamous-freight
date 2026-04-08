import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const logger = require("./logger.cjs") as {
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  http?: (...args: unknown[]) => void;
  aiDecision?: (...args: unknown[]) => void;
  aiConfidence?: (...args: unknown[]) => void;
  aiOverride?: (...args: unknown[]) => void;
  aiGuardrail?: (...args: unknown[]) => void;
  security?: (...args: unknown[]) => void;
  performance?: (...args: unknown[]) => void;
};

export default logger;
