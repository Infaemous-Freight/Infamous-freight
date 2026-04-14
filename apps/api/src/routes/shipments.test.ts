import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";

vi.mock("../db/prisma.js", () => ({
  prisma: {
    shipment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: vi.fn((req: any, _res: any, next: any) => {
    req.user = {
      tenantId: "tenant-1",
      id: "user-1",
      sub: "user-1",
      email: "tester@example.com",
      role: "OPERATOR",
    };
    next();
  }),
}));

// Prevent EtaRiskService from needing env
vi.mock("../services/eta-risk.service.js", () => {
  const MockEtaRiskService = function (this: any) {
    this.predict = () => ({ estimatedDelayMinutes: 10, riskScore: 0.3 });
  };
  return { EtaRiskService: MockEtaRiskService };
});

import express from "express";
import request from "supertest";
import { prisma } from "../db/prisma.js";
import { errorHandler } from "../middleware/error-handler.js";
import shipmentsRouter from "./shipments.js";

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/shipments", shipmentsRouter);
  app.use(errorHandler);
  return app;
};

const mockShipment = {
  id: "ship-1",
  tenantId: "tenant-1",
  trackingId: randomUUID(),
  userId: "user-1",
  driverId: null,
  origin: "Chicago, IL",
  destination: "Detroit, MI",
  status: "CREATED",
  reference: "REF-001",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("GET /shipments", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
    vi.clearAllMocks();
  });

  it("returns a list of shipments", async () => {
    vi.mocked(prisma.shipment.findMany).mockResolvedValue([mockShipment] as any);
    const res = await request(app).get("/shipments").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe("ship-1");
  });

  it("returns an empty list when no shipments exist", async () => {
    vi.mocked(prisma.shipment.findMany).mockResolvedValue([]);
    const res = await request(app).get("/shipments").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("supports pagination", async () => {
    vi.mocked(prisma.shipment.findMany).mockResolvedValue([]);
    const res = await request(app)
      .get("/shipments?page=2&limit=5")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(5);
  });
});

describe("GET /shipments/:id", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
    vi.clearAllMocks();
  });

  it("returns a shipment by id", async () => {
    vi.mocked(prisma.shipment.findFirst).mockResolvedValue(mockShipment as any);
    const res = await request(app).get("/shipments/ship-1").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("ship-1");
  });

  it("returns 404 when shipment not found", async () => {
    vi.mocked(prisma.shipment.findFirst).mockResolvedValue(null);
    const res = await request(app)
      .get("/shipments/nonexistent")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(404);
  });
});

describe("POST /shipments", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
    vi.clearAllMocks();
  });

  it("creates a new shipment", async () => {
    vi.mocked(prisma.shipment.create).mockResolvedValue(mockShipment as any);
    const res = await request(app)
      .post("/shipments")
      .set("Authorization", "Bearer token")
      .send({ origin: "Chicago, IL", destination: "Detroit, MI" });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.origin).toBe("Chicago, IL");
  });

  it("returns 400 for missing origin", async () => {
    const res = await request(app)
      .post("/shipments")
      .set("Authorization", "Bearer token")
      .send({ destination: "Detroit, MI" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing destination", async () => {
    const res = await request(app)
      .post("/shipments")
      .set("Authorization", "Bearer token")
      .send({ origin: "Chicago, IL" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /shipments/:id/status", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
    vi.clearAllMocks();
  });

  it("updates shipment status", async () => {
    vi.mocked(prisma.shipment.findFirst).mockResolvedValue(mockShipment as any);
    vi.mocked(prisma.shipment.update).mockResolvedValue({
      ...mockShipment,
      status: "IN_TRANSIT",
    } as any);
    const res = await request(app)
      .patch("/shipments/ship-1/status")
      .set("Authorization", "Bearer token")
      .send({ status: "IN_TRANSIT" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("IN_TRANSIT");
  });

  it("returns 404 for unknown shipment", async () => {
    vi.mocked(prisma.shipment.findFirst).mockResolvedValue(null);
    const res = await request(app)
      .patch("/shipments/bad-id/status")
      .set("Authorization", "Bearer token")
      .send({ status: "DELIVERED" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid status", async () => {
    const res = await request(app)
      .patch("/shipments/ship-1/status")
      .set("Authorization", "Bearer token")
      .send({ status: "UNKNOWN_STATUS" });
    expect(res.status).toBe(400);
  });
});
