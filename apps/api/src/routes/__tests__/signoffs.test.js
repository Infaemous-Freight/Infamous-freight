/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Module: signoffs.js route tests - Automated Sign-Off Workflow System
 */

const request = require("supertest");
const express = require("express");

// Mock Prisma client
const mockPrisma = {
  signOffRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  signOffSignature: {
    create: jest.fn(),
  },
  signOffRejection: {
    create: jest.fn(),
  },
};

jest.mock("../../config/database", () => ({
  prisma: mockPrisma,
}));

// Mock security middleware with scope checking
const mockAuthenticate = jest.fn((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const tokenData = JSON.parse(authHeader.slice(7));
      req.user = tokenData.user;
      req.auth = tokenData.auth;
    } catch (e) {
      req.user = { sub: "test-user-id", email: "test@example.com", role: "admin" };
    }
  } else {
    req.user = { sub: "test-user-id", email: "test@example.com", role: "admin" };
  }
  next();
});

const mockRequireScope = jest.fn((scope) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userScopes = req.user.scopes || [];
  if (!userScopes.includes(scope)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
});

jest.mock("../../middleware/security", () => ({
  authenticate: mockAuthenticate,
  requireScope: mockRequireScope,
}));

// Import router after mocks
const { router: signoffsRouter, SIGNOFF_TYPES, STAKEHOLDER_ROLES } = require("../signoffs");

// Helper to create JWT token with scopes
function createToken(scopes = [], role = "admin") {
  return {
    user: {
      sub: "test-user-id",
      email: "test@example.com",
      scopes,
      role,
    },
    auth: {
      organizationId: "test-org-id",
    },
  };
}

describe("POST /api/signoffs", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/signoffs", signoffsRouter);
    jest.clearAllMocks();
  });

  test("should create a new sign-off request", async () => {
    const signoffData = {
      type: "deployment",
      title: "Production Deployment - v2.5.0",
      description: "Deploy API v2.5.0 to production",
      related_entity_id: "deploy-123",
      deadline: "2025-12-31T23:59:59Z",
    };

    const createdSignoff = {
      id: "signoff-123",
      ...signoffData,
      status: "pending",
      required_stakeholders: [
        "ENGINEERING_LEAD",
        "OPERATIONS_MANAGER",
        "PRODUCT_OWNER",
        "SECURITY_OFFICER",
        "CTO",
      ],
      created_by: "test-user-id",
      created_at: new Date().toISOString(),
    };

    mockPrisma.signOffRequest.create.mockResolvedValue(createdSignoff);

    const token = createToken(["signoff:create"]);
    const response = await request(app)
      .post("/api/signoffs")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send(signoffData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(createdSignoff);
    expect(response.body.message).toBe("Sign-off request created successfully");
    expect(mockPrisma.signOffRequest.create).toHaveBeenCalled();
  });

  test("should return 400 for invalid sign-off type", async () => {
    const token = createToken(["signoff:create"]);
    const response = await request(app)
      .post("/api/signoffs")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        type: "invalid_type",
        title: "Test",
        description: "Test",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid sign-off type");
    expect(response.body.allowed).toBeDefined();
  });

  test("should return 403 without signoff:create scope", async () => {
    const token = createToken(["signoff:read"]);
    const response = await request(app)
      .post("/api/signoffs")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        type: "deployment",
        title: "Test",
        description: "Test",
      });

    expect(response.status).toBe(403);
  });
});

describe("GET /api/signoffs", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/signoffs", signoffsRouter);
    jest.clearAllMocks();
  });

  test("should get all sign-off requests with progress", async () => {
    const signoffs = [
      {
        id: "signoff-1",
        type: "deployment",
        title: "Deploy v2.5.0",
        status: "pending",
        required_stakeholders: ["ENGINEERING_LEAD", "CTO"],
        signatures: [{ stakeholder_role: "ENGINEERING_LEAD", signed_at: new Date() }],
        created_at: new Date(),
      },
      {
        id: "signoff-2",
        type: "feature_release",
        title: "Release Feature X",
        status: "completed",
        required_stakeholders: ["PRODUCT_OWNER", "CTO"],
        signatures: [
          { stakeholder_role: "PRODUCT_OWNER", signed_at: new Date() },
          { stakeholder_role: "CTO", signed_at: new Date() },
        ],
        created_at: new Date(),
      },
    ];

    mockPrisma.signOffRequest.findMany.mockResolvedValue(signoffs);

    const token = createToken(["signoff:read"]);
    const response = await request(app)
      .get("/api/signoffs")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].progress).toBeDefined();
    expect(response.body.data[0].progress.signed).toBe(1);
    expect(response.body.data[0].progress.required).toBe(2);
    expect(response.body.data[0].progress.percentage).toBe(50);
    expect(response.body.data[0].missing_signatures).toEqual(["CTO"]);
    expect(response.body.count).toBe(2);
  });

  test("should filter sign-offs by status", async () => {
    mockPrisma.signOffRequest.findMany.mockResolvedValue([]);

    const token = createToken(["signoff:read"]);
    const response = await request(app)
      .get("/api/signoffs?status=pending")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(mockPrisma.signOffRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "pending" }),
      }),
    );
  });

  test("should filter sign-offs by type", async () => {
    mockPrisma.signOffRequest.findMany.mockResolvedValue([]);

    const token = createToken(["signoff:read"]);
    const response = await request(app)
      .get("/api/signoffs?type=deployment")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(mockPrisma.signOffRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: "deployment" }),
      }),
    );
  });

  test("should return 403 without signoff:read scope", async () => {
    const token = createToken(["signoff:create"]);
    const response = await request(app)
      .get("/api/signoffs")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(403);
  });
});

describe("GET /api/signoffs/:id", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/signoffs", signoffsRouter);
    jest.clearAllMocks();
  });

  test("should get specific sign-off request with details", async () => {
    const signoff = {
      id: "signoff-123",
      type: "deployment",
      title: "Deploy v2.5.0",
      status: "pending",
      required_stakeholders: ["ENGINEERING_LEAD", "CTO", "OPERATIONS_MANAGER"],
      signatures: [
        {
          stakeholder_role: "ENGINEERING_LEAD",
          signed_at: new Date(),
          user: { id: "user-1", email: "eng@example.com", name: "Eng Lead" },
        },
      ],
      created_at: new Date(),
    };

    mockPrisma.signOffRequest.findUnique.mockResolvedValue(signoff);

    const token = createToken(["signoff:read"]);
    const response = await request(app)
      .get("/api/signoffs/signoff-123")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe("signoff-123");
    expect(response.body.data.progress.signed).toBe(1);
    expect(response.body.data.progress.required).toBe(3);
    expect(response.body.data.missing_signatures).toEqual(["CTO", "OPERATIONS_MANAGER"]);
    expect(response.body.data.is_complete).toBe(false);
  });

  test("should return 404 when sign-off not found", async () => {
    mockPrisma.signOffRequest.findUnique.mockResolvedValue(null);

    const token = createToken(["signoff:read"]);
    const response = await request(app)
      .get("/api/signoffs/nonexistent")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Sign-off request not found");
  });

  test("should return 403 without signoff:read scope", async () => {
    const token = createToken(["signoff:sign"]);
    const response = await request(app)
      .get("/api/signoffs/signoff-123")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(403);
  });
});

describe("POST /api/signoffs/:id/sign", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/signoffs", signoffsRouter);
    jest.clearAllMocks();
  });

  test("should sign off on a request", async () => {
    const signoff = {
      id: "signoff-123",
      status: "pending",
      required_stakeholders: ["ENGINEERING_LEAD", "CTO"],
      signatures: [],
    };

    const signature = {
      id: "sig-123",
      sign_off_request_id: "signoff-123",
      stakeholder_role: "ENGINEERING_LEAD",
      user_id: "test-user-id",
      signed_at: new Date().toISOString(),
    };

    mockPrisma.signOffRequest.findUnique.mockResolvedValue(signoff);
    mockPrisma.signOffSignature.create.mockResolvedValue(signature);

    const token = createToken(["signoff:sign"], "admin");
    const response = await request(app)
      .post("/api/signoffs/signoff-123/sign")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        stakeholder_role: "ENGINEERING_LEAD",
        comments: "Approved for production",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(signature);
    expect(response.body.sign_off_complete).toBe(false);
    expect(response.body.message).toContain("Awaiting remaining stakeholders");
  });

  test("should complete sign-off when all stakeholders sign", async () => {
    const signoff = {
      id: "signoff-123",
      status: "pending",
      required_stakeholders: ["ENGINEERING_LEAD", "CTO"],
      signatures: [{ stakeholder_role: "ENGINEERING_LEAD", signed_at: new Date() }],
    };

    const signature = {
      id: "sig-124",
      stakeholder_role: "CTO",
      signed_at: new Date(),
    };

    mockPrisma.signOffRequest.findUnique.mockResolvedValue(signoff);
    mockPrisma.signOffSignature.create.mockResolvedValue(signature);
    mockPrisma.signOffRequest.update.mockResolvedValue({ ...signoff, status: "completed" });

    const token = createToken(["signoff:sign"], "admin");
    const response = await request(app)
      .post("/api/signoffs/signoff-123/sign")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        stakeholder_role: "CTO",
        comments: "Final approval",
      });

    expect(response.status).toBe(200);
    expect(response.body.sign_off_complete).toBe(true);
    expect(response.body.message).toContain("Sign-off completed");
    expect(mockPrisma.signOffRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "completed" }),
      }),
    );
  });

  test("should return 404 when sign-off not found", async () => {
    mockPrisma.signOffRequest.findUnique.mockResolvedValue(null);

    const token = createToken(["signoff:sign"], "admin");
    const response = await request(app)
      .post("/api/signoffs/nonexistent/sign")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ stakeholder_role: "CTO" });

    expect(response.status).toBe(404);
  });

  test("should return 400 when sign-off already completed", async () => {
    const signoff = {
      id: "signoff-123",
      status: "completed",
      signatures: [],
    };

    mockPrisma.signOffRequest.findUnique.mockResolvedValue(signoff);

    const token = createToken(["signoff:sign"], "admin");
    const response = await request(app)
      .post("/api/signoffs/signoff-123/sign")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ stakeholder_role: "CTO" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Sign-off already completed");
  });

  test("should return 400 when stakeholder already signed", async () => {
    const signoff = {
      id: "signoff-123",
      status: "pending",
      signatures: [{ stakeholder_role: "ENGINEERING_LEAD", signed_at: new Date() }],
    };

    mockPrisma.signOffRequest.findUnique.mockResolvedValue(signoff);

    const token = createToken(["signoff:sign"], "admin");
    const response = await request(app)
      .post("/api/signoffs/signoff-123/sign")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ stakeholder_role: "ENGINEERING_LEAD" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Stakeholder has already signed off");
  });

  test("should return 403 without proper authority", async () => {
    const signoff = {
      id: "signoff-123",
      status: "pending",
      signatures: [],
    };

    mockPrisma.signOffRequest.findUnique.mockResolvedValue(signoff);

    const token = createToken(["signoff:sign"], "user"); // Not authorized role
    const response = await request(app)
      .post("/api/signoffs/signoff-123/sign")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ stakeholder_role: "CTO" });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain("authority");
  });

  test("should return 403 without signoff:sign scope", async () => {
    const token = createToken(["signoff:read"], "admin");
    const response = await request(app)
      .post("/api/signoffs/signoff-123/sign")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ stakeholder_role: "CTO" });

    expect(response.status).toBe(403);
  });
});

describe("POST /api/signoffs/:id/reject", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/signoffs", signoffsRouter);
    jest.clearAllMocks();
  });

  test("should reject sign-off with reason", async () => {
    const signoff = {
      id: "signoff-123",
      status: "pending",
    };

    mockPrisma.signOffRequest.findUnique.mockResolvedValue(signoff);
    mockPrisma.signOffRejection.create.mockResolvedValue({});
    mockPrisma.signOffRequest.update.mockResolvedValue({ ...signoff, status: "rejected" });

    const token = createToken(["signoff:sign"], "admin");
    const response = await request(app)
      .post("/api/signoffs/signoff-123/reject")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        stakeholder_role: "SECURITY_OFFICER",
        reason: "Security vulnerabilities detected that need to be addressed first",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Sign-off rejected");
    expect(mockPrisma.signOffRejection.create).toHaveBeenCalled();
    expect(mockPrisma.signOffRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "rejected" }),
      }),
    );
  });

  test("should return 400 when reason too short", async () => {
    const token = createToken(["signoff:sign"], "admin");
    const response = await request(app)
      .post("/api/signoffs/signoff-123/reject")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        stakeholder_role: "CTO",
        reason: "Too short",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("min 10 characters");
  });

  test("should return 404 when sign-off not found", async () => {
    mockPrisma.signOffRequest.findUnique.mockResolvedValue(null);

    const token = createToken(["signoff:sign"], "admin");
    const response = await request(app)
      .post("/api/signoffs/nonexistent/reject")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        stakeholder_role: "CTO",
        reason: "Long enough reason here",
      });

    expect(response.status).toBe(404);
  });

  test("should return 403 without proper authority", async () => {
    const signoff = { id: "signoff-123", status: "pending" };
    mockPrisma.signOffRequest.findUnique.mockResolvedValue(signoff);

    const token = createToken(["signoff:sign"], "user"); // Not authorized
    const response = await request(app)
      .post("/api/signoffs/signoff-123/reject")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        stakeholder_role: "CTO",
        reason: "Long enough reason here",
      });

    expect(response.status).toBe(403);
  });

  test("should return 403 without signoff:sign scope", async () => {
    const token = createToken(["signoff:read"], "admin");
    const response = await request(app)
      .post("/api/signoffs/signoff-123/reject")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        stakeholder_role: "CTO",
        reason: "Long enough reason here",
      });

    expect(response.status).toBe(403);
  });
});

describe("POST /api/signoffs/:id/cancel", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/signoffs", signoffsRouter);
    jest.clearAllMocks();
  });

  test("should cancel sign-off request", async () => {
    const cancelledSignoff = {
      id: "signoff-123",
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: "Deployment postponed",
    };

    mockPrisma.signOffRequest.update.mockResolvedValue(cancelledSignoff);

    const token = createToken(["signoff:manage"]);
    const response = await request(app)
      .post("/api/signoffs/signoff-123/cancel")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ reason: "Deployment postponed" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Sign-off request cancelled");
    expect(response.body.data).toEqual(cancelledSignoff);
  });

  test("should cancel with default reason when not provided", async () => {
    mockPrisma.signOffRequest.update.mockResolvedValue({
      id: "signoff-123",
      status: "cancelled",
    });

    const token = createToken(["signoff:manage"]);
    const response = await request(app)
      .post("/api/signoffs/signoff-123/cancel")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(response.status).toBe(200);
    expect(mockPrisma.signOffRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cancellation_reason: "Cancelled by requester",
        }),
      }),
    );
  });

  test("should return 403 without signoff:manage scope", async () => {
    const token = createToken(["signoff:sign"]);
    const response = await request(app)
      .post("/api/signoffs/signoff-123/cancel")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(response.status).toBe(403);
  });
});

describe("GET /api/signoffs/stats/overview", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/signoffs", signoffsRouter);
    jest.clearAllMocks();
  });

  test("should get sign-off statistics", async () => {
    mockPrisma.signOffRequest.count
      .mockResolvedValueOnce(5) // pending
      .mockResolvedValueOnce(15) // completed
      .mockResolvedValueOnce(2) // rejected
      .mockResolvedValueOnce(1); // overdue

    const completedSignoffs = [
      {
        created_at: new Date("2025-01-01T00:00:00Z"),
        completed_at: new Date("2025-01-02T12:00:00Z"), // 36 hours
      },
      {
        created_at: new Date("2025-01-05T00:00:00Z"),
        completed_at: new Date("2025-01-06T00:00:00Z"), // 24 hours
      },
    ];

    mockPrisma.signOffRequest.findMany.mockResolvedValue(completedSignoffs);

    const token = createToken(["signoff:read"]);
    const response = await request(app)
      .get("/api/signoffs/stats/overview")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.pending).toBe(5);
    expect(response.body.data.completed).toBe(15);
    expect(response.body.data.rejected).toBe(2);
    expect(response.body.data.overdue).toBe(1);
    expect(response.body.data.total).toBe(22);
    expect(response.body.data.avg_time_to_complete_hours).toBeDefined();
    expect(response.body.data.completion_rate).toBeCloseTo(88.2, 1); // 15/(15+2)*100
  });

  test("should return 403 without signoff:read scope", async () => {
    const token = createToken(["signoff:create"]);
    const response = await request(app)
      .get("/api/signoffs/stats/overview")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(403);
  });
});

describe("Sign-Off Constants", () => {
  test("should have valid sign-off types", () => {
    expect(SIGNOFF_TYPES).toHaveProperty("DEPLOYMENT");
    expect(SIGNOFF_TYPES).toHaveProperty("FEATURE_RELEASE");
    expect(SIGNOFF_TYPES).toHaveProperty("SECURITY_AUDIT");
    expect(SIGNOFF_TYPES).toHaveProperty("PERFORMANCE_VALIDATION");
    expect(SIGNOFF_TYPES).toHaveProperty("INCIDENT_POSTMORTEM");
    expect(SIGNOFF_TYPES).toHaveProperty("TRACK_COMPLETION");
  });

  test("should have valid stakeholder roles", () => {
    expect(STAKEHOLDER_ROLES).toHaveProperty("ENGINEERING_LEAD");
    expect(STAKEHOLDER_ROLES).toHaveProperty("OPERATIONS_MANAGER");
    expect(STAKEHOLDER_ROLES).toHaveProperty("PRODUCT_OWNER");
    expect(STAKEHOLDER_ROLES).toHaveProperty("SECURITY_OFFICER");
    expect(STAKEHOLDER_ROLES).toHaveProperty("QA_LEAD");
    expect(STAKEHOLDER_ROLES).toHaveProperty("CTO");

    // Check required flags
    expect(STAKEHOLDER_ROLES.ENGINEERING_LEAD.required).toBe(true);
    expect(STAKEHOLDER_ROLES.CTO.required).toBe(true);
    expect(STAKEHOLDER_ROLES.QA_LEAD.required).toBe(false);
  });
});

describe("Middleware Integration", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/signoffs", signoffsRouter);
    jest.clearAllMocks();
  });

  test("should require authentication for all routes", async () => {
    mockAuthenticate.mockImplementationOnce((req, res) => {
      res.status(401).json({ error: "Unauthorized" });
    });

    const response = await request(app).get("/api/signoffs");

    expect(response.status).toBe(401);
  });

  test("should check scopes for protected endpoints", async () => {
    mockPrisma.signOffRequest.create.mockResolvedValue({});

    const token = createToken([]); // No scopes
    const response = await request(app)
      .post("/api/signoffs")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        type: "deployment",
        title: "Test",
        description: "Test",
      });

    expect(response.status).toBe(403);
  });
});
