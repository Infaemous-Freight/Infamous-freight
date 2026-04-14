import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db/prisma.js", () => ({
  prisma: {
    carrier: {
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

vi.mock("../services/carrier-intelligence.service.js", () => {
  const MockService = function (this: any) {
    this.rankCarriersForLane = vi.fn(() => []);
  };
  return { CarrierIntelligenceService: MockService };
});

import express from "express";
import request from "supertest";
import { prisma } from "../db/prisma.js";
import { errorHandler } from "../middleware/error-handler.js";
import carriersRouter from "./carriers.js";

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/carriers", carriersRouter);
  app.use(errorHandler);
  return app;
};

const mockCarrier = {
  id: "carrier-1",
  tenantId: "tenant-1",
  companyName: "Acme Freight",
  mcNumber: "MC123456",
  dotNumber: null,
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("GET /carriers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns list of carriers for tenant", async () => {
    vi.mocked(prisma.carrier.findMany).mockResolvedValue([mockCarrier]);
    const res = await request(makeApp()).get("/carriers");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].companyName).toBe("Acme Freight");
  });
});

describe("POST /carriers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a carrier and returns 201", async () => {
    vi.mocked(prisma.carrier.create).mockResolvedValue(mockCarrier);
    const res = await request(makeApp()).post("/carriers").send({
      companyName: "Acme Freight",
      mcNumber: "MC123456",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.companyName).toBe("Acme Freight");
  });

  it("returns 400 when companyName is missing", async () => {
    const res = await request(makeApp()).post("/carriers").send({ mcNumber: "MC123456" });
    expect(res.status).toBe(400);
  });
});

describe("GET /carriers/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 for unknown carrier", async () => {
    vi.mocked(prisma.carrier.findFirst).mockResolvedValue(null);
    const res = await request(makeApp()).get("/carriers/nonexistent");
    expect(res.status).toBe(404);
  });

  it("returns carrier for valid id", async () => {
    vi.mocked(prisma.carrier.findFirst).mockResolvedValue(mockCarrier);
    const res = await request(makeApp()).get("/carriers/carrier-1");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("carrier-1");
  });
});

describe("PATCH /carriers/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when carrier does not exist", async () => {
    vi.mocked(prisma.carrier.findFirst).mockResolvedValue(null);
    const res = await request(makeApp()).patch("/carriers/nonexistent").send({ isActive: false });
    expect(res.status).toBe(404);
  });

  it("updates carrier and returns updated record", async () => {
    vi.mocked(prisma.carrier.findFirst).mockResolvedValue(mockCarrier);
    vi.mocked(prisma.carrier.update).mockResolvedValue({ ...mockCarrier, isActive: false });
    const res = await request(makeApp()).patch("/carriers/carrier-1").send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });
});
