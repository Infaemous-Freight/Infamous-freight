/**
 * AI Observability and Logging
 *
 * This module provides logging utilities for AI role decisions, confidence scores,
 * and human overrides. All functions are designed to support audit trails and
 * compliance requirements.
 */

import { logger } from "../utils/logger";
import type { DecisionLog, ConfidenceScore, HumanOverride, GuardrailViolation } from "../contracts";

const MAX_LOG_ENTRIES = 1000;
const decisionLogStore: DecisionLog[] = [];
const confidenceLogStore: Array<{
  decisionId: string;
  role: string;
  confidence: ConfidenceScore;
  timestamp: Date;
}> = [];
const overrideLogStore: Array<{
  decisionId: string;
  role: string;
  override: HumanOverride;
}> = [];
const guardrailLogStore: Array<{
  decisionId: string;
  role: string;
  violation: GuardrailViolation;
  timestamp: Date;
}> = [];

function addToStore<T>(store: T[], entry: T) {
  store.push(entry);
  if (store.length > MAX_LOG_ENTRIES) {
    store.splice(0, store.length - MAX_LOG_ENTRIES);
  }
}

/**
 * Log an AI decision to the audit trail
 *
 * @param log - The decision log entry to record
 * @returns Promise that resolves when the log is written
 *
 * @example
 * ```typescript
 * await logDecision({
 *   decisionId: 'dec-123',
 *   timestamp: new Date(),
 *   role: 'dispatch-operator',
 *   userId: 'user-456',
 *   requestId: 'req-789',
 *   action: 'assign-driver',
 *   input: { shipmentId: 'ship-001' },
 *   confidence: { value: 0.92, reasoning: 'High historical accuracy' },
 *   recommendation: { driverId: 'driver-42' },
 *   requiresHumanReview: false,
 * });
 * ```
 */
export async function logDecision(log: DecisionLog): Promise<void> {
  const logEntry = {
    timestamp: log.timestamp.toISOString(),
    level: "info",
    type: "ai-decision",
    decisionId: log.decisionId,
    role: log.role,
    userId: log.userId,
    requestId: log.requestId,
    action: log.action,
    confidence: log.confidence.value,
    confidenceReasoning: log.confidence.reasoning,
    requiresHumanReview: log.requiresHumanReview,
    guardrailViolations: log.guardrailViolations?.length || 0,
    outcome: log.outcome?.status,
  };

  // Write to structured log aggregation (Elasticsearch, CloudWatch, Datadog)
  logger.aiDecision(logEntry);

  addToStore(decisionLogStore, log);
}

/**
 * Log confidence score calculation details
 *
 * @param decisionId - Unique identifier for the decision
 * @param role - Name of the AI role
 * @param confidence - The confidence score to log
 * @returns Promise that resolves when the log is written
 *
 * @example
 * ```typescript
 * await logConfidence('dec-123', 'fleet-intel', {
 *   value: 0.87,
 *   reasoning: 'Based on 3 months of vehicle data',
 *   factors: {
 *     dataQuality: 0.95,
 *     modelCertainty: 0.85,
 *     historicalAccuracy: 0.82
 *   }
 * });
 * ```
 */
export async function logConfidence(
  decisionId: string,
  role: string,
  confidence: ConfidenceScore,
): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: "debug",
    type: "ai-confidence",
    decisionId,
    role,
    confidenceValue: confidence.value,
    reasoning: confidence.reasoning,
    factors: confidence.factors,
  };

  // Track confidence distributions and monitor for drift
  logger.aiConfidence(logEntry);

  addToStore(confidenceLogStore, {
    decisionId,
    role,
    confidence,
    timestamp: new Date(),
  });
}

/**
 * Flag a human override of an AI decision
 *
 * @param decisionId - Unique identifier for the original decision
 * @param role - Name of the AI role that made the decision
 * @param override - Details of the human override
 * @returns Promise that resolves when the override is recorded
 *
 * @example
 * ```typescript
 * await flagOverride('dec-123', 'dispatch-operator', {
 *   timestamp: new Date(),
 *   overrideBy: 'user-789',
 *   reason: 'Driver requested different route',
 *   newAction: { routeId: 'alt-route-5' },
 *   feedbackForTraining: true
 * });
 * ```
 */
export async function flagOverride(
  decisionId: string,
  role: string,
  _override: HumanOverride,
): Promise<void> {
  const logEntry = {
    timestamp: override.timestamp.toISOString(),
    level: "warn",
    type: "ai-override",
    decisionId,
    role,
    overrideBy: override.overrideBy,
    reason: override.reason,
    feedbackForTraining: override.feedbackForTraining,
  };

  // Track override rates and flag for model improvement
  logger.aiOverride(logEntry);

  addToStore(overrideLogStore, { decisionId, role, override });

  // If this override should inform training, queue it for review
  if (override.feedbackForTraining) {
    await queueForTraining(decisionId, role, override);
  }
}

/**
 * Log a guardrail violation
 *
 * @param decisionId - Unique identifier for the decision
 * @param role - Name of the AI role
 * @param violations - Array of guardrail violations
 * @returns Promise that resolves when violations are logged
 */
export async function logGuardrailViolations(
  decisionId: string,
  role: string,
  violations: GuardrailViolation[],
): Promise<void> {
  for (const violation of violations) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: violation.severity === "critical" || violation.severity === "high" ? "error" : "warn",
      type: "ai-guardrail-violation",
      decisionId,
      role,
      violationType: violation.type,
      severity: violation.severity,
      description: violation.description,
      remediation: violation.remediation,
    };

    // Alert and track guardrail violations
    logger.aiGuardrail(logEntry);

    addToStore(guardrailLogStore, {
      decisionId,
      role,
      violation,
      timestamp: new Date(),
    });

    // Critical violations should trigger immediate alerts
    if (violation.severity === "critical") {
      await alertSecurityTeam(decisionId, role, violation);
    }
  }
}

/**
 * Queue a decision for model training (private helper)
 */
async function queueForTraining(
  decisionId: string,
  role: string,
  _override: HumanOverride,
): Promise<void> {
  // Add decision to training queue for data scientists
  logger.info("Training queue", {
    type: "training-queue",
    decisionId,
    role,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Alert security team of critical guardrail violation (private helper)
 */
async function alertSecurityTeam(
  decisionId: string,
  role: string,
  violation: GuardrailViolation,
): Promise<void> {
  // Trigger security team alerts (PagerDuty, Slack, email)
  logger.error("Security alert - critical guardrail violation", undefined, {
    type: "security-alert",
    decisionId,
    role,
    violation: violation.description,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get decision logs for a specific time range (query utility)
 *
 * @param startTime - Start of time range
 * @param endTime - End of time range
 * @param filters - Optional filters for role, userId, etc.
 * @returns Promise resolving to array of decision logs
 */
export async function queryDecisionLogs(
  startTime: Date,
  endTime: Date,
  filters?: {
    role?: string;
    userId?: string;
    requiresHumanReview?: boolean;
    minConfidence?: number;
    maxConfidence?: number;
  },
): Promise<DecisionLog[]> {
  // Query centralized audit log store
  logger.debug("Query decision logs", {
    type: "query-logs",
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    filters,
  });
  return decisionLogStore.filter((log) => {
    const timestamp = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);

    if (timestamp < startTime || timestamp > endTime) return false;
    if (filters?.role && log.role !== filters.role) return false;
    if (filters?.userId && log.userId !== filters.userId) return false;
    if (
      typeof filters?.requiresHumanReview === "boolean" &&
      log.requiresHumanReview !== filters.requiresHumanReview
    ) {
      return false;
    }
    if (
      typeof filters?.minConfidence === "number" &&
      log.confidence.value < filters.minConfidence
    ) {
      return false;
    }
    if (
      typeof filters?.maxConfidence === "number" &&
      log.confidence.value > filters.maxConfidence
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Get aggregate statistics for AI decisions
 *
 * @param role - Optional role name to filter by
 * @param timeRange - Time range for statistics
 * @returns Promise resolving to statistics object
 */
export async function getDecisionStats(
  role?: string,
  timeRange?: { start: Date; end: Date },
): Promise<{
  totalDecisions: number;
  averageConfidence: number;
  overrideRate: number;
  guardrailViolations: number;
  byOutcome: Record<string, number>;
}> {
  // Aggregate metrics from audit logs
  logger.debug("Decision statistics", {
    type: "decision-stats",
    role,
    timeRange: timeRange
      ? {
          start: timeRange.start.toISOString(),
          end: timeRange.end.toISOString(),
        }
      : undefined,
  });
  const filtered = decisionLogStore.filter((log) => {
    if (role && log.role !== role) return false;
    if (timeRange) {
      const timestamp = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
      if (timestamp < timeRange.start || timestamp > timeRange.end) return false;
    }
    return true;
  });

  const totalDecisions = filtered.length;
  const averageConfidence = totalDecisions
    ? filtered.reduce((sum, log) => sum + log.confidence.value, 0) / totalDecisions
    : 0;

  const overrides = overrideLogStore.filter((entry) => !role || entry.role === role);

  const guardrails = guardrailLogStore.filter((entry) => !role || entry.role === role);

  const byOutcome = filtered.reduce<Record<string, number>>((acc, log) => {
    const key = log.outcome?.status || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    totalDecisions,
    averageConfidence,
    overrideRate: totalDecisions ? overrides.length / totalDecisions : 0,
    guardrailViolations: guardrails.length,
    byOutcome,
  };
}
