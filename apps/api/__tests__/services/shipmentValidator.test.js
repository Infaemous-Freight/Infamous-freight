const {
  validateStatusTransition,
  validateShipmentUpdate,
  getValidNextStatuses,
  getShipmentStateInfo,
  isTerminalStatus,
} = require("../../src/services/shipmentValidator");

describe("shipmentValidator", () => {
  test("allows CREATED -> IN_TRANSIT", () => {
    expect(validateStatusTransition("CREATED", "IN_TRANSIT")).toEqual({ valid: true });
  });

  test("rejects skipping straight to DELIVERED", () => {
    const result = validateStatusTransition("CREATED", "DELIVERED");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Cannot transition from CREATED to DELIVERED");
  });

  test("treats DELIVERED as terminal", () => {
    expect(isTerminalStatus("DELIVERED")).toBe(true);
    expect(getValidNextStatuses("DELIVERED")).toEqual([]);
  });

  test("rejects driver reassignment while in transit", () => {
    const result = validateShipmentUpdate(
      { id: "s1", status: "IN_TRANSIT", driverId: "d1" },
      { driverId: "d2" },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Cannot reassign driver for shipment in transit");
  });

  test("builds state info for CREATED shipment", () => {
    const state = getShipmentStateInfo({ status: "CREATED", driverId: null });

    expect(state.current).toBe("CREATED");
    expect(state.transitions).toEqual(["IN_TRANSIT", "CANCELLED"]);
    expect(state.actions.canAssign).toBe(true);
    expect(state.actions.canStartTransit).toBe(false);
  });
});
