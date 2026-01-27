/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Unit Tests for Rate Limit Metrics Module
 */

const rateLimitMetrics = require("../rateLimitMetrics");

describe("Rate Limit Metrics", () => {
    beforeEach(() => {
        // Reset state before each test
        rateLimitMetrics.reset?.();
    });

    describe("recordHit", () => {
        it("should record hits for a limiter", () => {
            rateLimitMetrics.recordHit("general", "192.168.1.1");
            const snapshot = rateLimitMetrics.snapshot();
            expect(snapshot.general).toBeDefined();
            expect(snapshot.general.hits).toBeGreaterThan(0);
        });

        it("should aggregate hits across keys", () => {
            rateLimitMetrics.recordHit("general", "192.168.1.1");
            rateLimitMetrics.recordHit("general", "192.168.1.2");
            const snapshot = rateLimitMetrics.snapshot();
            expect(snapshot.general.hits).toBeGreaterThanOrEqual(2);
        });

        it("should track top keys", () => {
            for (let i = 0; i < 5; i++) {
                rateLimitMetrics.recordHit("general", "192.168.1.1");
            }
            for (let i = 0; i < 3; i++) {
                rateLimitMetrics.recordHit("general", "192.168.1.2");
            }
            const snapshot = rateLimitMetrics.snapshot();
            expect(snapshot.general.topKeys).toBeDefined();
            expect(Array.isArray(snapshot.general.topKeys)).toBe(true);
        });
    });

    describe("recordBlocked", () => {
        it("should record blocked requests", () => {
            rateLimitMetrics.recordBlocked("general", "192.168.1.1");
            const snapshot = rateLimitMetrics.snapshot();
            expect(snapshot.general.blocked).toBeGreaterThan(0);
        });

        it("should track blocked keys", () => {
            rateLimitMetrics.recordBlocked("general", "192.168.1.1");
            const snapshot = rateLimitMetrics.snapshot();
            expect(snapshot.general.blockedKeys).toBeDefined();
        });
    });

    describe("recordSuccess", () => {
        it("should record successful requests", () => {
            rateLimitMetrics.recordSuccess("general");
            const snapshot = rateLimitMetrics.snapshot();
            expect(snapshot.general.success).toBeGreaterThan(0);
        });

        it("should increment success counter", () => {
            const snap1 = rateLimitMetrics.snapshot();
            const initialSuccess = snap1.general?.success || 0;

            rateLimitMetrics.recordSuccess("general");

            const snap2 = rateLimitMetrics.snapshot();
            const newSuccess = snap2.general?.success || 0;
            expect(newSuccess).toBeGreaterThan(initialSuccess);
        });
    });

    describe("snapshot", () => {
        it("should return metrics object", () => {
            const snapshot = rateLimitMetrics.snapshot();
            expect(typeof snapshot).toBe("object");
        });

        it("should include all limiters", () => {
            rateLimitMetrics.recordHit("general", "key1");
            rateLimitMetrics.recordHit("auth", "key2");
            rateLimitMetrics.recordHit("ai", "key3");

            const snapshot = rateLimitMetrics.snapshot();
            expect(snapshot.general).toBeDefined();
            expect(snapshot.auth).toBeDefined();
            expect(snapshot.ai).toBeDefined();
        });

        it("should have consistent structure", () => {
            rateLimitMetrics.recordHit("general", "key");
            rateLimitMetrics.recordBlocked("general", "key");
            rateLimitMetrics.recordSuccess("general");

            const snapshot = rateLimitMetrics.snapshot();
            const general = snapshot.general;

            expect(general.hits).toBeDefined();
            expect(general.blocked).toBeDefined();
            expect(general.success).toBeDefined();
            expect(general.topKeys).toBeDefined();
            expect(general.blockedKeys).toBeDefined();
        });
    });

    describe("multiple limiters", () => {
        it("should track metrics separately per limiter", () => {
            for (let i = 0; i < 10; i++) {
                rateLimitMetrics.recordHit("general", "key");
            }
            for (let i = 0; i < 3; i++) {
                rateLimitMetrics.recordHit("auth", "key");
            }

            const snapshot = rateLimitMetrics.snapshot();
            expect(snapshot.general.hits).toBeGreaterThan(snapshot.auth.hits);
        });

        it("should handle high-cost operations", () => {
            rateLimitMetrics.recordHit("export", "user-1");
            rateLimitMetrics.recordBlocked("export", "user-1");
            const snapshot = rateLimitMetrics.snapshot();
            expect(snapshot.export).toBeDefined();
            expect(snapshot.export.blocked).toBeGreaterThan(0);
        });
    });
});
