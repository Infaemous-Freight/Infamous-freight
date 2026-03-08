import { describe, expect, it } from "vitest";
import { DispatchOptimizer } from "../src/modules/dispatch/dispatch.optimizer.js";

describe("DispatchOptimizer", () => {
  it("ranks closer eligible drivers higher", () => {
    const optimizer = new DispatchOptimizer();

    const load = {
      id: "load1",
      originLat: 35.4676,
      originLng: -97.5164,
      destinationLat: 32.7767,
      destinationLng: -96.797,
      pickupWindowStart: new Date(),
      pickupWindowEnd: new Date(Date.now() + 3 * 60 * 60 * 1000),
      deliveryDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
      weightLbs: 10000,
      hazmat: false,
      trailerType: "DRY_VAN" as const
    };

    const drivers = [
      {
        id: "near",
        name: "Near Driver",
        currentLat: 35.5,
        currentLng: -97.5,
        hoursRemaining: 11,
        trailerType: "DRY_VAN" as const,
        hazmatCertified: false,
        truck: {
          id: "truck1",
          maxWeightLbs: 45000,
          trailerType: "DRY_VAN" as const,
          active: true
        }
      },
      {
        id: "far",
        name: "Far Driver",
        currentLat: 39.1,
        currentLng: -94.5,
        hoursRemaining: 11,
        trailerType: "DRY_VAN" as const,
        hazmatCertified: false,
        truck: {
          id: "truck2",
          maxWeightLbs: 45000,
          trailerType: "DRY_VAN" as const,
          active: true
        }
      }
    ];

    const ranked = optimizer.rankDrivers(load, drivers);
    expect(ranked[0]?.driverId).toBe("near");
  });
});
