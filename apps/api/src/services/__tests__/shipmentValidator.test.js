/**
 * Unit tests for Shipment Validator Service
 * Tests state machine transitions and business rules
 *
 * @test src/services/shipmentValidator.js
 */

const {
    validateStatusTransition,
    validateShipmentUpdate,
    canTransition,
    getValidNextStatuses,
    isTerminalStatus,
    getShipmentStateInfo,
} = require("../services/shipmentValidator");
const { SHIPMENT_STATUSES } = require("@infamous-freight/shared");

describe("Shipment Validator Service", () => {
    describe("validateStatusTransition", () => {
        test("allows valid transition PENDING → ASSIGNED", () => {
            const result = validateStatusTransition(
                SHIPMENT_STATUSES.PENDING,
                SHIPMENT_STATUSES.ASSIGNED
            );

            expect(result.valid).toBe(true);
        });

        test("allows valid transition ASSIGNED → IN_TRANSIT", () => {
            const result = validateStatusTransition(
                SHIPMENT_STATUSES.ASSIGNED,
                SHIPMENT_STATUSES.IN_TRANSIT
            );

            expect(result.valid).toBe(true);
        });

        test("allows valid transition IN_TRANSIT → DELIVERED", () => {
            const result = validateStatusTransition(
                SHIPMENT_STATUSES.IN_TRANSIT,
                SHIPMENT_STATUSES.DELIVERED
            );

            expect(result.valid).toBe(true);
        });

        test("allows cancellation from any non-terminal status", () => {
            const statuses = [
                SHIPMENT_STATUSES.PENDING,
                SHIPMENT_STATUSES.ASSIGNED,
                SHIPMENT_STATUSES.IN_TRANSIT,
            ];

            statuses.forEach((status) => {
                const result = validateStatusTransition(
                    status,
                    SHIPMENT_STATUSES.CANCELLED
                );
                expect(result.valid).toBe(true);
            });
        });

        test("prevents invalid transition DELIVERED → IN_TRANSIT", () => {
            const result = validateStatusTransition(
                SHIPMENT_STATUSES.DELIVERED,
                SHIPMENT_STATUSES.IN_TRANSIT
            );

            expect(result.valid).toBe(false);
            expect(result.error).toContain("Cannot transition from DELIVERED");
        });

        test("prevents invalid transition PENDING → DELIVERED (skip steps)", () => {
            const result = validateStatusTransition(
                SHIPMENT_STATUSES.PENDING,
                SHIPMENT_STATUSES.DELIVERED
            );

            expect(result.valid).toBe(false);
            expect(result.error).toContain("Cannot transition from PENDING");
        });

        test("allows idempotent same-status transition", () => {
            const result = validateStatusTransition(
                SHIPMENT_STATUSES.ASSIGNED,
                SHIPMENT_STATUSES.ASSIGNED
            );

            expect(result.valid).toBe(true);
        });

        test("includes allowed statuses in error response", () => {
            const result = validateStatusTransition(
                SHIPMENT_STATUSES.PENDING,
                SHIPMENT_STATUSES.DELIVERED
            );

            expect(result.allowed).toBeDefined();
            expect(result.allowed).toContain(SHIPMENT_STATUSES.ASSIGNED);
            expect(result.allowed).toContain(SHIPMENT_STATUSES.CANCELLED);
        });
    });

    describe("validateShipmentUpdate", () => {
        const baseShipment = {
            id: "ship-123",
            status: SHIPMENT_STATUSES.ASSIGNED,
            driverId: "driver-1",
        };

        test("allows valid status update", () => {
            const updates = { status: SHIPMENT_STATUSES.IN_TRANSIT };
            const result = validateShipmentUpdate(baseShipment, updates);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test("prevents status transition violation", () => {
            const updates = { status: SHIPMENT_STATUSES.PENDING };
            const result = validateShipmentUpdate(baseShipment, updates);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test("prevents driver reassign during transit", () => {
            const transitShipment = {
                ...baseShipment,
                status: SHIPMENT_STATUSES.IN_TRANSIT,
            };
            const updates = { driverId: "driver-2" };

            const result = validateShipmentUpdate(transitShipment, updates);

            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain("Cannot reassign driver");
        });

        test("allows driver reassign before transit", () => {
            const updates = { driverId: "driver-2" };
            const result = validateShipmentUpdate(baseShipment, updates);

            expect(result.valid).toBe(true);
        });

        test("allows driver reassign after delivery (same driver)", () => {
            const deliveredShipment = {
                ...baseShipment,
                status: SHIPMENT_STATUSES.DELIVERED,
            };
            const updates = { driverId: "driver-1" };

            const result = validateShipmentUpdate(deliveredShipment, updates);

            expect(result.valid).toBe(true);
        });

        test("collects multiple validation errors", () => {
            const transitShipment = {
                ...baseShipment,
                status: SHIPMENT_STATUSES.IN_TRANSIT,
            };
            const updates = {
                status: SHIPMENT_STATUSES.PENDING, // Invalid transition
                driverId: "driver-2", // Can't reassign during transit
            };

            const result = validateShipmentUpdate(transitShipment, updates);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });

    describe("canTransition", () => {
        test("returns true for valid transitions", () => {
            expect(
                canTransition(SHIPMENT_STATUSES.PENDING, SHIPMENT_STATUSES.ASSIGNED)
            ).toBe(true);
        });

        test("returns false for invalid transitions", () => {
            expect(
                canTransition(SHIPMENT_STATUSES.DELIVERED, SHIPMENT_STATUSES.IN_TRANSIT)
            ).toBe(false);
        });
    });

    describe("getValidNextStatuses", () => {
        test("returns allowed statuses for PENDING", () => {
            const statuses = getValidNextStatuses(SHIPMENT_STATUSES.PENDING);

            expect(statuses).toContain(SHIPMENT_STATUSES.ASSIGNED);
            expect(statuses).toContain(SHIPMENT_STATUSES.CANCELLED);
        });

        test("returns allowed statuses for ASSIGNED", () => {
            const statuses = getValidNextStatuses(SHIPMENT_STATUSES.ASSIGNED);

            expect(statuses).toContain(SHIPMENT_STATUSES.IN_TRANSIT);
            expect(statuses).toContain(SHIPMENT_STATUSES.CANCELLED);
        });

        test("returns allowed statuses for IN_TRANSIT", () => {
            const statuses = getValidNextStatuses(SHIPMENT_STATUSES.IN_TRANSIT);

            expect(statuses).toContain(SHIPMENT_STATUSES.DELIVERED);
            expect(statuses).toContain(SHIPMENT_STATUSES.CANCELLED);
        });

        test("returns empty array for unknown status", () => {
            const statuses = getValidNextStatuses("UNKNOWN_STATUS");

            expect(statuses).toEqual([]);
        });
    });

    describe("isTerminalStatus", () => {
        test("identifies DELIVERED as terminal", () => {
            expect(isTerminalStatus(SHIPMENT_STATUSES.DELIVERED)).toBe(true);
        });

        test("identifies CANCELLED as terminal", () => {
            expect(isTerminalStatus(SHIPMENT_STATUSES.CANCELLED)).toBe(true);
        });

        test("identifies PENDING as non-terminal", () => {
            expect(isTerminalStatus(SHIPMENT_STATUSES.PENDING)).toBe(false);
        });

        test("identifies IN_TRANSIT as non-terminal", () => {
            expect(isTerminalStatus(SHIPMENT_STATUSES.IN_TRANSIT)).toBe(false);
        });
    });

    describe("getShipmentStateInfo", () => {
        test("provides state info for PENDING shipment", () => {
            const shipment = {
                id: "ship-123",
                status: SHIPMENT_STATUSES.PENDING,
                driverId: null,
            };

            const info = getShipmentStateInfo(shipment);

            expect(info.current).toBe(SHIPMENT_STATUSES.PENDING);
            expect(info.isTerminal).toBe(false);
            expect(info.actions.canAssign).toBe(true);
            expect(info.actions.canStartTransit).toBe(false);
        });

        test("provides state info for ASSIGNED shipment", () => {
            const shipment = {
                id: "ship-123",
                status: SHIPMENT_STATUSES.ASSIGNED,
                driverId: "driver-1",
            };

            const info = getShipmentStateInfo(shipment);

            expect(info.current).toBe(SHIPMENT_STATUSES.ASSIGNED);
            expect(info.actions.canStartTransit).toBe(true);
            expect(info.actions.canReassign).toBe(true);
        });

        test("provides state info for IN_TRANSIT shipment", () => {
            const shipment = {
                id: "ship-123",
                status: SHIPMENT_STATUSES.IN_TRANSIT,
                driverId: "driver-1",
            };

            const info = getShipmentStateInfo(shipment);

            expect(info.current).toBe(SHIPMENT_STATUSES.IN_TRANSIT);
            expect(info.actions.canDeliver).toBe(true);
            expect(info.actions.canReassign).toBe(false);
        });

        test("provides state info for DELIVERED shipment", () => {
            const shipment = {
                id: "ship-123",
                status: SHIPMENT_STATUSES.DELIVERED,
                driverId: "driver-1",
            };

            const info = getShipmentStateInfo(shipment);

            expect(info.current).toBe(SHIPMENT_STATUSES.DELIVERED);
            expect(info.isTerminal).toBe(true);
            expect(info.actions.canCancel).toBe(false);
        });
    });
});
