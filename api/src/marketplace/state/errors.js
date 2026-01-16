/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Job State Machine Error Types (CommonJS)
 */

class JobTransitionError extends Error {
    constructor(code, message, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = "JobTransitionError";
    }

    toJSON() {
        return {
            error: this.code,
            message: this.message,
            status: this.status,
        };
    }
}

const JOB_TRANSITION_CODES = {
    JOB_NOT_FOUND: "JOB_NOT_FOUND",
    DRIVER_NOT_FOUND: "DRIVER_NOT_FOUND",
    SHIPPER_NOT_FOUND: "SHIPPER_NOT_FOUND",

    ILLEGAL_TRANSITION: "ILLEGAL_TRANSITION",
    ALREADY_ASSIGNED: "ALREADY_ASSIGNED",
    NOT_ASSIGNED: "NOT_ASSIGNED",
    HOLD_EXPIRED: "HOLD_EXPIRED",
    HOLD_ACTOR_MISMATCH: "HOLD_ACTOR_MISMATCH",

    PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
    POD_INCOMPLETE: "POD_INCOMPLETE",
    POD_PHOTO_REQUIRED: "POD_PHOTO_REQUIRED",
    POD_SIGNATURE_REQUIRED: "POD_SIGNATURE_REQUIRED",
    POD_OTP_REQUIRED: "POD_OTP_REQUIRED",

    NOT_ALLOWED: "NOT_ALLOWED",
    INSUFFICIENT_SCOPE: "INSUFFICIENT_SCOPE",

    CANCEL_NOT_ALLOWED: "CANCEL_NOT_ALLOWED",
    MISSING_REQUIRED_DATA: "MISSING_REQUIRED_DATA",
    MISSING_HELD_UNTIL: "MISSING_HELD_UNTIL",
    MISSING_HELD_BY_DRIVER_ID: "MISSING_HELD_BY_DRIVER_ID",

    TRANSACTION_FAILED: "TRANSACTION_FAILED",
    VERSION_CONFLICT: "VERSION_CONFLICT",

    INTERNAL_ERROR: "INTERNAL_ERROR",
};

module.exports = { JobTransitionError, JOB_TRANSITION_CODES };
