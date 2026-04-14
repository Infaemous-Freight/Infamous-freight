import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db/prisma.js", () => ({
  prisma: {
    broker: {
      findMany: vi.fn(),
      create: vi.fn(),
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

import express from "express";
import request from "supertest";
import { prisma } from "../db/prisma.js";
import { errorHandler } from "../middleware/error-handler.js";
import brokersRouter from "./brokers.js";

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/brokers", brokersRouter);
  app.use(errorHandler);
  return app;
};

const mockBroker = {
  id: "broker-1",
  tenantId: "tenant-1",
  companyName: "Best Broker",
  mcNumber: "MC654321",
  creditScore: 80,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("GET /brokers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns list of brokers for tenant", async () => {
    vi.mocked(prisma.broker.findMany).mockResolvedValue([mockBroker]);
    const res = await request(makeApp()).get("/brokers");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].companyName).toBe("Best Broker");
  });
});

describe("POST /brokers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a broker and returns 201", async () => {
    vi.mocked(prisma.broker.create).mockResolvedValue(mockBroker);
    const res = await request(makeApp()).post("/brokers").send({
      companyName: "Best Broker",
      mcNumber: "MC654321",
      creditScore: 80,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.companyName).toBe("Best Broker");
  });

  it("returns 400 when mcNumber is missing", async () => {
    const res = await request(makeApp()).post("/brokers").send({ companyName: "Broker Co" });
    expect(res.status).toBe(400);
  });
});
