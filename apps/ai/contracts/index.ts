/**
 * AI Role Contracts and Core Interfaces
 *
 * This module defines the core contracts and interfaces that all AI roles must implement.
 * These contracts ensure consistency, auditability, and safety across all AI agents.
 */

/**
 * Base context for all AI role decisions
 */
export interface RoleContext {
  /** Unique identifier for the user making the request */
  userId: string;

  /** Unique identifier for this request (for tracing) */
  requestId: string;

  /** Timestamp when the request was initiated */
  timestamp: Date;

  /** Additional metadata specific to the request */
  metadata?: Record<string, unknown>;
}

/**
 * Confidence score for AI decisions
 * Range: 0.0 (no confidence) to 1.0 (absolute confidence)
 */
export interface ConfidenceScore {
  /** Numerical confidence value between 0 and 1 */
  value: number;

  /** Human-readable reasoning for this confidence level */
  reasoning: string;

  /** Factors that contributed to this confidence score */
  factors?: {
    dataQuality?: number;
    modelCertainty?: number;
    historicalAccuracy?: number;
    contextCompleteness?: number;
  };
}

/**
 * Guardrail violation details
 */
export interface GuardrailViolation {
  /** Type of guardrail that was violated */
  type: "boundary" | "policy" | "safety" | "data-access";

  /** Severity of the violation */
  severity: "low" | "medium" | "high" | "critical";

  /** Description of what was violated */
  description: string;

  /** Suggested remediation */
  remediation?: string;
}

/**
 * Decision log entry for audit trail
 */
export interface DecisionLog {
  /** Unique identifier for this decision */
  decisionId: string;

  /** Timestamp when decision was made */
  timestamp: Date;

  /** AI role that made the decision */
  role: string;

  /** User context */
  userId: string;

  /** Request identifier for tracing */
  requestId: string;

  /** Action that was decided upon */
  action: string;

  /** Input parameters that informed the decision */
  input: Record<string, unknown>;

  /** Confidence score for this decision */
  confidence: ConfidenceScore;

  /** Recommendation or action taken */
  recommendation: Record<string, unknown>;

  /** Whether this requires human review */
  requiresHumanReview: boolean;

  /** Any guardrail violations detected */
  guardrailViolations?: GuardrailViolation[];

  /** Outcome of the decision (if executed) */
  outcome?: {
    status: "success" | "failure" | "escalated" | "overridden";
    message?: string;
    error?: string;
  };

  /** Human override information (if applicable) */
  humanOverride?: HumanOverride;
}

/**
 * Human override of an AI decision
 */
export interface HumanOverride {
  /** Timestamp of the override */
  timestamp: Date;

  /** User who performed the override */
  overrideBy: string;

  /** Reason for the override */
  reason: string;

  /** New action taken instead of AI recommendation */
  newAction?: Record<string, unknown>;

  /** Whether this should be used to retrain the model */
  feedbackForTraining: boolean;
}

/**
 * Result of an AI role decision
 */
export interface DecisionResult {
  /** Unique identifier for this decision */
  decisionId: string;

  /** Confidence score for the decision */
  confidence: ConfidenceScore;

  /** Recommended action or decision */
  recommendation: Record<string, unknown>;

  /** Whether this decision requires human review before execution */
  requiresHumanReview: boolean;

  /** Any guardrail violations that were detected */
  guardrailViolations: GuardrailViolation[];

  /** Additional metadata about the decision */
  metadata?: Record<string, unknown>;
}

/**
 * Input parameters for an AI role decision
 */
export interface DecisionInput {
  /** Type of action being requested */
  action: string;

  /** Parameters specific to this action */
  parameters: Record<string, unknown>;

  /** Optional constraints on the decision */
  constraints?: Record<string, unknown>;
}

/**
 * Core contract that all AI roles must implement
 */
export interface RoleContract {
  /** Name of the AI role */
  readonly name: string;

  /** Version of this role implementation */
  readonly version: string;

  /** Description of what this role does */
  readonly description: string;

  /** Confidence threshold below which human review is required */
  readonly confidenceThreshold: number;

  /** List of actions this role can perform */
  readonly capabilities: string[];

  /**
   * Main decision-making function
   * @param input - The decision input parameters
   * @param context - The request context
   * @returns The decision result with confidence and recommendations
   */
  decide(input: DecisionInput, context: RoleContext): Promise<DecisionResult>;

  /**
   * Check if the proposed action violates any guardrails
   * @param input - The decision input parameters
   * @param context - The request context
   * @returns Array of any guardrail violations detected
   */
  checkGuardrails(
    input: DecisionInput,
    context: RoleContext,
  ): Promise<GuardrailViolation[]>;

  /**
   * Calculate confidence score for a decision
   * @param input - The decision input parameters
   * @param context - The request context
   * @returns The confidence score with reasoning
   */
  calculateConfidence(
    input: DecisionInput,
    context: RoleContext,
  ): Promise<ConfidenceScore>;
}

/**
 * Factory function type for creating role instances
 */
export type RoleFactory = () => RoleContract;

/**
 * Role registry for managing available AI roles
 */
export interface RoleRegistry {
  /** Register a new AI role */
  register(role: RoleContract): void;

  /** Get a role by name */
  getRole(name: string): RoleContract | undefined;

  /** List all registered roles */
  listRoles(): RoleContract[];

  /** Check if a role is registered */
  hasRole(name: string): boolean;
}
