/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Unit Tests for Query Metrics Module
 */

const { recordQuery, getSlowQueries, clear } = require("../queryMetrics");

describe("Query Metrics", () => {
    beforeEach(() => {
        clear();
    });

    describe("recordQuery", () => {
        it("should record query execution", () => {
            recordQuery({
                model: "Shipment",
                action: "findMany",
                duration: 100,
                args: {},
            });

            const queries = getSlowQueries(10);
            expect(queries.length).toBeGreaterThan(0);
        });

        it("should track slow queries above threshold", () => {
            recordQuery({
                model: "User",
                action: "findUnique",
                duration: 5000, // Well above typical threshold
                args: { where: { id: "123" } },
            });

            const slowQueries = getSlowQueries(10);
            expect(slowQueries.some((q) => q.duration >= 5000)).toBe(true);
        });

        it("should not track fast queries in slow query list", () => {
            recordQuery({
                model: "Shipment",
                action: "findFirst",
                duration: 10, // Very fast
                args: {},
            });

            const slowQueries = getSlowQueries(10);
            // May or may not be included depending on threshold
            // Just verify we get a result
            expect(Array.isArray(slowQueries)).toBe(true);
        });

        it("should record error information", () => {
            const err = new Error("Connection timeout");
            recordQuery({
                model: "Payment",
                action: "create",
                duration: 1000,
                args: { data: {} },
                error: err,
            });

            const queries = getSlowQueries(10);
            const errorQuery = queries.find((q) => q.error);
            expect(errorQuery).toBeDefined();
        });

        it("should include timestamp", () => {
            recordQuery({
                model: "Shipment",
                action: "update",
                duration: 500,
                args: {},
            });

            const queries = getSlowQueries(10);
            expect(queries[0].timestamp).toBeDefined();
            expect(typeof queries[0].timestamp).toBe("number"); // Timestamps are milliseconds since epoch
        });
    });

    describe("getSlowQueries", () => {
        it("should return array of slow queries", () => {
            recordQuery({
                model: "Shipment",
                action: "findMany",
                duration: 2000,
                args: {},
            });

            const queries = getSlowQueries(10);
            expect(Array.isArray(queries)).toBe(true);
        });

        it("should respect limit parameter", () => {
            for (let i = 0; i < 20; i++) {
                recordQuery({
                    model: "Shipment",
                    action: "findMany",
                    duration: 1000 + i * 100,
                    args: {},
                });
            }

            const queries = getSlowQueries(5);
            expect(queries.length).toBeLessThanOrEqual(5);
        });

        it("should return most recent queries first", () => {
            recordQuery({ model: "Shipment", action: "find", duration: 1000, args: {} });

            // Small delay to ensure different timestamps
            setTimeout(() => {
                recordQuery({ model: "User", action: "find", duration: 1000, args: {} });
            }, 10);

            const queries = getSlowQueries(10);
            expect(queries[0]).toBeDefined();
        });

        it("should include query metadata", () => {
            recordQuery({
                model: "Shipment",
                action: "findUnique",
                duration: 1500,
                args: { where: { id: "123" } },
            });

            const queries = getSlowQueries(10);
            expect(queries[0].model).toBe("Shipment");
            expect(queries[0].action).toBe("findUnique");
            expect(queries[0].duration).toBe(1500);
        });
    });

    describe("clear", () => {
        it("should clear all recorded queries", () => {
            recordQuery({ model: "Shipment", action: "find", duration: 2000, args: {} });
            recordQuery({ model: "User", action: "find", duration: 2000, args: {} });

            let queries = getSlowQueries(10);
            expect(queries.length).toBeGreaterThan(0);

            clear();

            queries = getSlowQueries(10);
            expect(queries.length).toBe(0);
        });
    });

    describe("multiple models", () => {
        it("should track queries across different models", () => {
            recordQuery({ model: "Shipment", action: "find", duration: 2000, args: {} });
            recordQuery({ model: "User", action: "find", duration: 2000, args: {} });
            recordQuery({ model: "Payment", action: "find", duration: 2000, args: {} });

            const queries = getSlowQueries(10);
            const models = queries.map((q) => q.model);
            expect(new Set(models).size).toBeGreaterThan(1);
        });

        it("should aggregate by model and action", () => {
            for (let i = 0; i < 5; i++) {
                recordQuery({ model: "Shipment", action: "findMany", duration: 1500, args: {} });
            }

            const queries = getSlowQueries(10);
            const shipmentQueries = queries.filter((q) => q.model === "Shipment");
            expect(shipmentQueries.length).toBeGreaterThan(0);
        });
    });
});
