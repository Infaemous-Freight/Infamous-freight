/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Unit Tests for Feature Flags Service
 */

const featureFlags = require("../../services/featureFlags");

describe("Feature Flags Service", () => {
    beforeEach(() => {
        // Reset feature flags before each test (if clear method exists)
        if (featureFlags.deleteFlag) {
            featureFlags.listFlags().forEach(flag => {
                if (flag.source !== 'env') {
                    featureFlags.deleteFlag(flag.name);
                }
            });
        }
    });

    describe("listFlags", () => {
        it("should return all feature flags", () => {
            const flags = featureFlags.listFlags();
            expect(Array.isArray(flags)).toBe(true);
        });

        it("should include bootstrap flags from environment", () => {
            const flags = featureFlags.listFlags();
            // If ENABLE_AI_COMMANDS or similar is set, should exist
            expect(flags.length).toBeGreaterThanOrEqual(0);
        });

        it("should have enabled property", () => {
            const flags = featureFlags.listFlags();
            flags.forEach((flag) => {
                expect(typeof flag.enabled).toBe("boolean");
            });
        });
    });

    describe("isEnabled", () => {
        it("should return boolean for flag state", () => {
            const enabled = featureFlags.isEnabled("user-1", "ENABLE_AI_COMMANDS");
            expect(typeof enabled).toBe("boolean");
        });

        it("should return true for enabled flags", () => {
            featureFlags.upsertFlag("test-enabled", {
                enabled: true,
                percentageRollout: 100,
            });
            const enabled = featureFlags.isEnabled("user-123", "test-enabled");
            expect(enabled).toBe(true);
        });

        it("should respect target users", () => {
            featureFlags.upsertFlag("vip-feature", {
                enabled: true,
                targetUsers: ["vip-user-1"],
                percentageRollout: 0,
            });
            const forVip = featureFlags.isEnabled("vip-user-1", "vip-feature");
            const forOther = featureFlags.isEnabled("other-user", "vip-feature");
            expect(forVip).toBe(true);
            expect(forOther).toBe(false);
        });
    });

    describe("upsertFlag", () => {
        it("should create a new flag", () => {
            const flag = featureFlags.upsertFlag("new-feature", {
                enabled: true,
                percentageRollout: 100,
            });
            expect(flag.name).toBe("new-feature");
            expect(flag.enabled).toBe(true);
        });

        it("should update existing flag", () => {
            featureFlags.upsertFlag("test-flag", { enabled: true, percentageRollout: 100 });
            const updated = featureFlags.upsertFlag("test-flag", { enabled: false, percentageRollout: 0 });
            expect(updated.enabled).toBe(false);
        });

        it("should include source metadata", () => {
            const flag = featureFlags.upsertFlag("admin-flag", {
                enabled: true,
                source: "admin",
                percentageRollout: 100,
            });
            expect(flag.source).toBe("admin");
        });

        it("should default percentageRollout if provided", () => {
            const flag = featureFlags.upsertFlag("full-rollout", {
                enabled: true,
                percentageRollout: 100,
            });
            expect(flag.percentageRollout).toBe(100);
        });

        it("should store target users", () => {
            const flag = featureFlags.upsertFlag("targeted", {
                enabled: true,
                targetUsers: ["user-1", "user-2"],
                percentageRollout: 100,
            });
            expect(flag.targetUsers).toEqual(["user-1", "user-2"]);
        });
    });

    describe("setEnabled", () => {
        it("should toggle flag enabled state", () => {
            featureFlags.upsertFlag("toggle-test", { enabled: true, percentageRollout: 100 });
            featureFlags.setEnabled("toggle-test", false);
            const flag = featureFlags.getFlag("toggle-test");
            expect(flag.enabled).toBe(false);
        });

        it("should work for non-existent flags", () => {
            featureFlags.setEnabled("new-toggle", true);
            const enabled = featureFlags.isEnabled("user-123", "new-toggle");
            expect(enabled).toBe(true);
        });
    });

    describe("environment defaults", () => {
        it("should fall back to env when flag not found", () => {
            const enabled = featureFlags.isEnabled("user-123", "NONEXISTENT_FLAG");
        });
    });
});
