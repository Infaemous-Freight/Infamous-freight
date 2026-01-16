/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Job State Machine - Valid Status Transitions
 */

/**
 * Valid job status transitions
 * Prevents invalid state changes
 */
const VALID_TRANSITIONS = {
    DRAFT: ["REQUIRES_PAYMENT", "CANCELED"],
    REQUIRES_PAYMENT: ["OPEN", "CANCELED"],
    OPEN: ["ACCEPTED", "CANCELED"],
    ACCEPTED: ["PICKED_UP", "CANCELED"],
    PICKED_UP: ["DELIVERED", "CANCELED"],
    DELIVERED: ["COMPLETED"],
    COMPLETED: [], // Terminal state
    CANCELED: [], // Terminal state
};

/**
 * Check if a status transition is valid
 * @param {string} currentStatus - Current job status
 * @param {string} newStatus - Desired new status
 * @returns {boolean} True if transition is allowed
 */
function canTransition(currentStatus, newStatus) {
    return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

/**
 * Get allowed next statuses for current state
 * @param {string} currentStatus - Current job status
 * @returns {string[]} Array of allowed next statuses
 */
function getAllowedTransitions(currentStatus) {
    return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate and throw if transition is invalid
 * @param {string} currentStatus - Current job status
 * @param {string} newStatus - Desired new status
 * @throws {Error} If transition is not allowed
 */
function validateTransition(currentStatus, newStatus) {
    if (!canTransition(currentStatus, newStatus)) {
        throw new Error(
            `Invalid status transition: ${currentStatus} -> ${newStatus}. ` +
            `Allowed transitions: ${getAllowedTransitions(currentStatus).join(", ") || "none"}`
        );
    }
}

module.exports = {
    VALID_TRANSITIONS,
    canTransition,
    getAllowedTransitions,
    validateTransition,
};
