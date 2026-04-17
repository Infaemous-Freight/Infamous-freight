/**
 * Shipment Validator Service
 * Enforces shipment status state machine and business rules
 *
 * Valid transitions:
 * - CREATED → IN_TRANSIT
 * - IN_TRANSIT → DELIVERED
 * - CREATED|IN_TRANSIT → CANCELLED
 *
 * @module services/shipmentValidator
 */

const {
    SHIPMENT_STATUS: SHARED_SHIPMENT_STATUS,
    SHIPMENT_TRANSITIONS: SHARED_SHIPMENT_TRANSITIONS,
    SHIPMENT_TERMINAL_STATUSES: SHARED_SHIPMENT_TERMINAL_STATUSES,
} = require("@infamous-freight/shared");
const { logger } = require("../middleware/logger");

const SHIPMENT_STATUS = SHARED_SHIPMENT_STATUS || {
    CREATED: "CREATED",
    IN_TRANSIT: "IN_TRANSIT",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
};

/**
 * Valid state transitions for shipments
 * Key: current status, Value: array of allowed next statuses
 */
const VALID_TRANSITIONS = SHARED_SHIPMENT_TRANSITIONS || {
    [SHIPMENT_STATUS.CREATED]: [SHIPMENT_STATUS.IN_TRANSIT, SHIPMENT_STATUS.CANCELLED],
    [SHIPMENT_STATUS.IN_TRANSIT]: [SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.CANCELLED],
    [SHIPMENT_STATUS.DELIVERED]: [],
    [SHIPMENT_STATUS.CANCELLED]: [],
};

/**
 * Terminal statuses - cannot transition FROM these
 * @type {Set<string>}
 */
const TERMINAL_STATUSES = new Set(
    SHARED_SHIPMENT_TERMINAL_STATUSES || [SHIPMENT_STATUS.DELIVERED, SHIPMENT_STATUS.CANCELLED],
);

/**
 * Check if a status transition is valid
 *
 * @param {string} currentStatus - Current shipment status
 * @param {string} newStatus - Desired status
 * @returns {Object} { valid: boolean, error?: string }
 *
 * @example
 * validateStatusTransition('CREATED', 'IN_TRANSIT')
 * // Returns: { valid: true }
 *
 * validateStatusTransition('DELIVERED', 'IN_TRANSIT')
 * // Returns: { valid: false, error: "Cannot transition from DELIVERED to IN_TRANSIT" }
 */
function validateStatusTransition(currentStatus, newStatus) {
    // Same status = no-op (allowed for idempotency)
    if (currentStatus === newStatus) {
        return { valid: true };
    }

    // Check if current status has allowed transitions
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus];

    if (!allowedNextStatuses) {
        return {
            valid: false,
            error: `Unknown status: ${currentStatus}`,
        };
    }

    // Check if transition is in allowed list
    if (!allowedNextStatuses.includes(newStatus)) {
        return {
            valid: false,
            error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedNextStatuses.join(", ")}`,
            current: currentStatus,
            requested: newStatus,
            allowed: allowedNextStatuses,
        };
    }

    return { valid: true };
}

/**
 * Validate shipment for update
 * Checks status transition and business rules
 *
 * @param {Object} shipment - Current shipment data
 * @param {Object} updates - Proposed updates
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateShipmentUpdate(shipment, updates, options = {}) {
    void options;
    const errors = [];

    // Check status transition if status is being updated
    if (updates.status && updates.status !== shipment.status) {
        const transition = validateStatusTransition(shipment.status, updates.status);

        if (!transition.valid) {
            errors.push(transition.error);
            logger.warn("Invalid shipment status transition", {
                shipmentId: shipment.id,
                current: shipment.status,
                requested: updates.status,
                error: transition.error,
            });
        }
    }

    // Check driver assignment rules
    if (
        updates.driverId &&
        updates.driverId !== shipment.driverId &&
        shipment.status === SHIPMENT_STATUS.IN_TRANSIT
    ) {
        // Cannot reassign driver during transit
        errors.push(
            "Cannot reassign driver for shipment in transit"
        );
        logger.warn("Attempted driver reassign during transit", {
            shipmentId: shipment.id,
            currentDriver: shipment.driverId,
            requestedDriver: updates.driverId,
        });
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Check if shipment can be transitioned to a new status
 * Useful for UI/form validation before submission
 *
 * @param {string} currentStatus - Current status
 * @param {string} targetStatus - Target status
 * @returns {boolean}
 */
function canTransition(currentStatus, targetStatus) {
    const result = validateStatusTransition(currentStatus, targetStatus);
    return result.valid;
}

/**
 * Get all valid next statuses for a given status
 *
 * @param {string} status - Current status
 * @returns {string[]} Array of allowed next statuses
 */
function getValidNextStatuses(status) {
    return VALID_TRANSITIONS[status] || [];
}

/**
 * Check if a status is terminal (final)
 * Terminal statuses can't have most transitions from them
 *
 * @param {string} status - Status to check
 * @returns {boolean}
 */
function isTerminalStatus(status) {
    return TERMINAL_STATUSES.has(status);
}

/**
 * Build shipment state machine info for client
 * Useful for UI to show valid action buttons
 *
 * @param {Object} shipment - Shipment object
 * @returns {Object} { current, transitions, isTerminal, actions }
 */
function getShipmentStateInfo(shipment) {
    const validNextStatuses = getValidNextStatuses(shipment.status);

    return {
        current: shipment.status,
        transitions: validNextStatuses,
        isTerminal: isTerminalStatus(shipment.status),
        actions: {
            canAssign:
                shipment.status === SHIPMENT_STATUS.CREATED &&
                !shipment.driverId,
            canStartTransit:
                shipment.status === SHIPMENT_STATUS.CREATED &&
                !!shipment.driverId,
            canDeliver: shipment.status === SHIPMENT_STATUS.IN_TRANSIT,
            canCancel: validNextStatuses.includes(SHIPMENT_STATUS.CANCELLED),
            canReassign:
                [SHIPMENT_STATUS.CREATED].includes(
                    shipment.status
                ),
        },
    };
}

/**
 * Audit log for status changes
 * Use this for compliance and troubleshooting
 *
 * @param {Object} change - Status change details
 * @returns {void}
 */
function logStatusChange(change) {
    logger.info("Shipment status changed", {
        shipmentId: change.shipmentId,
        from: change.fromStatus,
        to: change.toStatus,
        userId: change.userId,
        reason: change.reason,
        timestamp: new Date().toISOString(),
    });
}

module.exports = {
    validateStatusTransition,
    validateShipmentUpdate,
    canTransition,
    getValidNextStatuses,
    isTerminalStatus,
    getShipmentStateInfo,
    logStatusChange,
    VALID_TRANSITIONS,
    TERMINAL_STATUSES,
};
