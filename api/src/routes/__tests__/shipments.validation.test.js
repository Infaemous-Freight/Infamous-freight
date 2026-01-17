const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mocks for dependencies used by the shipments router
jest.mock("../../db/prisma", () => {
    const shipment = {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };
    const aiEvent = {
        create: jest.fn(),
    };
    const $transaction = async (fn) => fn({ shipment, aiEvent });

    return { prisma: { shipment, aiEvent, $transaction } };
});

jest.mock("../../services/websocket", () => ({
    emitShipmentUpdate: jest.fn(),
}));

jest.mock("../../middleware/cache", () => ({
    cacheMiddleware: () => (_req, _res, next) => next(),
    invalidateCache: jest.fn(),
}));

const { prisma } = require("../../db/prisma");
const shipmentsRouter = require("../shipments");

describe("Shipments route validation", () => {
    const secret = process.env.JWT_SECRET || "test-secret";

    const makeToken = (overrides = {}) =>
        jwt.sign(
            {
                sub: "user-1",
                scopes: ["shipments:read", "shipments:write"],
                role: "user",
                ...overrides,
            },
            secret,
        );

    const buildApp = () => {
        const app = express();
        app.use(express.json());
        app.use("/api", shipmentsRouter);
        app.use((err, _req, res, _next) => {
            res.status(err.status || 500).json({ error: err.message });
        });
        return app;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("rejects invalid UUID for shipment detail", async () => {
        const app = buildApp();
        const token = makeToken();

        const res = await request(app)
            .get("/api/shipments/not-a-uuid")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation failed");
    });

    test("allows valid shipment detail lookup", async () => {
        const app = buildApp();
        const token = makeToken();
        prisma.shipment.findUnique.mockResolvedValue({
            id: "550e8400-e29b-41d4-a716-446655440000",
            userId: "user-1",
        });

        const res = await request(app)
            .get("/api/shipments/550e8400-e29b-41d4-a716-446655440000")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(prisma.shipment.findUnique).toHaveBeenCalled();
    });

    test("rejects creating shipment without required fields", async () => {
        const app = buildApp();
        const token = makeToken();

        const res = await request(app)
            .post("/api/shipments")
            .set("Authorization", `Bearer ${token}`)
            .send({ destination: "NYC" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation failed");
    });

    test("creates shipment with valid payload", async () => {
        const app = buildApp();
        const token = makeToken();
        const newShipment = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            trackingId: "TRK-123",
            userId: "user-1",
            origin: "LA",
            destination: "NYC",
        };
        prisma.shipment.create.mockResolvedValue(newShipment);
        prisma.aiEvent.create.mockResolvedValue({ id: "ai-1" });

        const res = await request(app)
            .post("/api/shipments")
            .set("Authorization", `Bearer ${token}`)
            .send({ origin: "LA", destination: "NYC" });

        expect(res.status).toBe(201);
        expect(prisma.shipment.create).toHaveBeenCalled();
    });

    test("rejects invalid UUID on shipment update", async () => {
        const app = buildApp();
        const token = makeToken();

        const res = await request(app)
            .patch("/api/shipments/not-a-uuid")
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "in-transit" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation failed");
    });

    test("updates shipment when payload valid", async () => {
        const app = buildApp();
        const token = makeToken();
        prisma.shipment.findUnique.mockResolvedValue({
            id: "550e8400-e29b-41d4-a716-446655440000",
            userId: "user-1",
        });
        prisma.shipment.update.mockResolvedValue({
            id: "550e8400-e29b-41d4-a716-446655440000",
            userId: "user-1",
            status: "in-transit",
        });
        prisma.aiEvent.create.mockResolvedValue({ id: "ai-2" });

        const res = await request(app)
            .patch("/api/shipments/550e8400-e29b-41d4-a716-446655440000")
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "in-transit" });

        expect(res.status).toBe(200);
        expect(prisma.shipment.update).toHaveBeenCalled();
    });
});
