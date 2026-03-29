declare const logger: {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string | Error, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  [key: string]: unknown;
};
export default logger;
