/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Job State Machine Error Types
 */

/**
 * Standardized error for job state transitions.
 * All transitionJob() failures return this, ensuring consistent API error handling.
 */
export class JobTransitionError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number = 400) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "JobTransitionError";

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, JobTransitionError.prototype);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      status: this.status,
    };
  }
}

/**
 * Common error codes for job transitions (for client-side i18n or circuit breaker logic)
 */
export const JOB_TRANSITION_CODES = {
  // Not found / validation
  JOB_NOT_FOUND: "JOB_NOT_FOUND",
  DRIVER_NOT_FOUND: "DRIVER_NOT_FOUND",
  SHIPPER_NOT_FOUND: "SHIPPER_NOT_FOUND",

  // Transition rules
  ILLEGAL_TRANSITION: "ILLEGAL_TRANSITION",
  ALREADY_ASSIGNED: "ALREADY_ASSIGNED",
  NOT_ASSIGNED: "NOT_ASSIGNED",
  HOLD_EXPIRED: "HOLD_EXPIRED",
  HOLD_ACTOR_MISMATCH: "HOLD_ACTOR_MISMATCH",

  // Prerequisites
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  POD_INCOMPLETE: "POD_INCOMPLETE",
  POD_PHOTO_REQUIRED: "POD_PHOTO_REQUIRED",
  POD_SIGNATURE_REQUIRED: "POD_SIGNATURE_REQUIRED",
  POD_OTP_REQUIRED: "POD_OTP_REQUIRED",

  // Permissions
  NOT_ALLOWED: "NOT_ALLOWED",
  INSUFFICIENT_SCOPE: "INSUFFICIENT_SCOPE",

  // State conflicts
  CANCEL_NOT_ALLOWED: "CANCEL_NOT_ALLOWED",
  MISSING_REQUIRED_DATA: "MISSING_REQUIRED_DATA",
  MISSING_HELD_UNTIL: "MISSING_HELD_UNTIL",
  MISSING_HELD_BY_DRIVER_ID: "MISSING_HELD_BY_DRIVER_ID",

  // Database / atomicity
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  VERSION_CONFLICT: "VERSION_CONFLICT",

  // Internal
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
