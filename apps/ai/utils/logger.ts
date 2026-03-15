/**
 * AI Logger for TypeScript modules
 *
 * Structured logging for AI observability with proper typing
 */

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  type: string;
  [key: string]: any;
}

class AILogger {
  private log(entry: LogEntry): void {
    // In production, send to log aggregation service (Datadog, CloudWatch, etc.)
    // For now, format as structured JSON for stdout
    const formatted = JSON.stringify(entry);

    // Use console for compatibility (will be replaced by proper log transport in production)
    switch (entry.level) {
      case "error":
        // eslint-disable-next-line no-console
        console.error(formatted);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(formatted);
        break;
      case "info":
      case "debug":
      default:
        // eslint-disable-next-line no-console
        console.log(formatted);
        break;
    }
  }

  info(message: string, data?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      type: "ai",
      message,
      ...data,
    });
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      type: "ai",
      message,
      ...data,
    });
  }

  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "error",
      type: "ai",
      message,
      error: error?.message,
      stack: error?.stack,
      ...data,
    });
  }

  debug(message: string, data?: Record<string, any>): void {
    // In development, always log debug messages
    // In production, this would check LOG_LEVEL from env
    this.log({
      timestamp: new Date().toISOString(),
      level: "debug",
      type: "ai",
      message,
      ...data,
    });
  }

  aiDecision(data: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      type: "ai-decision",
      ...data,
    });
  }

  aiConfidence(data: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "debug",
      type: "ai-confidence",
      ...data,
    });
  }

  aiOverride(data: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      type: "ai-override",
      ...data,
    });
  }

  aiGuardrail(data: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      type: "guardrail-violation",
      ...data,
    });
  }

  security(data: Record<string, any>): void {
    this.log({
      ...data,
      timestamp: new Date().toISOString(),
      level: "warn",
      type: "security-event",
    });
  }

  performance(metric: string, durationMs: number, data?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      type: "performance",
      metric,
      durationMs,
      ...data,
    });
  }

}

export const logger = new AILogger();
