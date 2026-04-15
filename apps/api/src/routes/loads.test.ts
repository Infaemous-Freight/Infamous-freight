import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing the route
vi.mock("../db/prisma.js", () => ({
  prisma: {
    load: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock requireAuth to inject a tenant context
vi.mock("../middleware/auth.js", () => ({
  requireAuth: vi.fn((req: any, _res: any, next: any) => {
    req.user = {
      tenantId: "tenant-test-1",
      id: "user-1",
      sub: "user-1",
      email: "test@test.com",
      role: "user",
    };
    next();
  }),
}));

import express from "express";
import request from "supertest";
import { prisma } from "../db/prisma.js";
import { errorHandler } from "../middleware/error-handler.js";
import loadsRouter from "./loads.js";

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/loads", loadsRouter);
  app.use(errorHandler);
  return app;
};

const mockLoad = {
  id: "load-1",
  tenantId: "tenant-test-1",
  status: "OPEN",
  originCity: "Chicago",
  originState: "IL",
  destCity: "Detroit",
  destState: "MI",
  distanceMi: 280,
  weightLb: 5000,
  rateCents: 120000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("GET /loads", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
    vi.mocked(prisma.load.findMany).mockResolvedValue([mockLoad] as any);
  });

  it("returns paginated list with ok:true", async () => {
    const res = await request(app).get("/loads");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });

  it("queries only the authenticated tenant", async () => {
    await request(app).get("/loads");
    expect(prisma.load.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: "tenant-test-1" } }),
    );
  });

  it("supports custom page and limit query params", async () => {
    await request(app).get("/loads?page=2&limit=5");
    expect(prisma.load.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
  });
});

describe("POST /loads", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
    vi.mocked(prisma.load.create).mockResolvedValue(mockLoad as any);
  });

  const validBody = {
    originCity: "Chicago",
    originState: "IL",
    destCity: "Detroit",
    destState: "MI",
    distanceMi: 280,
    weightLb: 5000,
    rateCents: 120000,
  };

  it("creates a load and returns 201", async () => {
    const res = await request(app).post("/loads").send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it("injects tenantId from JWT — not from request body", async () => {
    await request(app).post("/loads").send(validBody);
    expect(prisma.load.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "tenant-test-1" }),
      }),
    );
  });

  it("returns 400 for missing required fields", async () => {
    const res = await request(app).post("/loads").send({ originCity: "Chicago" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /loads/:id/status", () => {
  let app: ReturnType<typeof makeApp>;

  beforeEach(() => {
    app = makeApp();
  });

  it("returns 404 when load not found for tenant", async () => {
    vi.mocked(prisma.load.findFirst).mockResolvedValue(null);
    const res = await request(app).patch("/loads/nonexistent/status").send({ status: "CLAIMED" });
    expect(res.status).toBe(404);
    expect(res.body.error?.code).toBe("LOAD_NOT_FOUND");
  });

  it("updates status when load belongs to tenant", async () => {
    vi.mocked(prisma.load.findFirst).mockResolvedValue(mockLoad as any);
    vi.mocked(prisma.load.update).mockResolvedValue({ ...mockLoad, status: "CLAIMED" } as any);
    const res = await request(app).patch("/loads/load-1/status").send({ status: "CLAIMED" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("returns 400 for invalid status value", async () => {
    const res = await request(app).patch("/loads/load-1/status").send({ status: "INVALID_STATUS" });
    expect(res.status).toBe(400);
  });
});
