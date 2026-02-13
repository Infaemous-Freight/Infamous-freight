/*
 * Copyright © 2026 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: revops.js route tests - Revenue Operations & AI-Driven Sales
 */

const request = require("supertest");
const express = require("express");

// Mock logger before any imports
jest.mock("../../middleware/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock TypeScript service modules with default exports
const mockGenesisSalesAI = {
  qualifyLead: jest.fn(),
  autoQualifyNewLeads: jest.fn(),
  getTopOpportunities: jest.fn(),
  updateOpportunityStage: jest.fn(),
  markOpportunityWon: jest.fn(),
};

const mockDynamicPricing = {
  calculateDynamicPrice: jest.fn(),
  getSurgePricingStats: jest.fn(),
  recommendPriceAdjustments: jest.fn(),
};

const mockOutboundEngine = {
  createCampaign: jest.fn(),
  addRecipientsToCampaign: jest.fn(),
  sendCampaignMessages: jest.fn(),
  getCampaignPerformance: jest.fn(),
  createNurtureCampaign: jest.fn(),
};

const mockContractWorkflow = {
  generateEnterpriseContract: jest.fn(),
  getPendingContracts: jest.fn(),
  getContract: jest.fn(),
  handleSignatureCompleted: jest.fn(),
};

const mockRevopsDashboard = {
  getRevOpsDashboard: jest.fn(),
  storeRecommendation: jest.fn(),
  markRecommendationImplemented: jest.fn(),
};

jest.mock("../../revops/genesisSalesAI", () => ({ default: mockGenesisSalesAI }));
jest.mock("../../revops/dynamicPricing", () => ({ default: mockDynamicPricing }));
jest.mock("../../revops/outboundEngine", () => ({ default: mockOutboundEngine }));
jest.mock("../../revops/contractWorkflow", () => ({ default: mockContractWorkflow }));
jest.mock("../../revops/dashboard", () => ({ default: mockRevopsDashboard }));

// Mock express-validator with functional chain
const createChain = () => {
  const chain = (req, res, next) => next();
  chain.isString = () => createChain();
  chain.isFloat = () => createChain();
  chain.isInt = () => createChain();
  chain.isEmail = () => createChain();
  chain.isObject = () => createChain();
  chain.isArray = () => createChain();
  chain.isIn = () => createChain();
  chain.notEmpty = () => createChain();
  return chain;
};

jest.mock("express-validator", () => {
  const middlewareChain = (req, res, next) => next();
  return {
    body: jest.fn(() => createChain()),
    param: jest.fn(() => createChain()),
    validationResult: jest.fn(() => ({
      isEmpty: () => true,
      array: () => [],
    })),
    matchedData: jest.fn((req) => req.body),
  };
});

// Mock security middleware with scope checking
const mockAuthenticate = jest.fn((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const tokenData = JSON.parse(authHeader.slice(7));
      req.user = tokenData.user;
      req.auth = tokenData.auth;
    } catch (e) {
      req.user = { sub: "test-user-id", email: "test@example.com" };
      req.auth = { organizationId: "test-org-id" };
    }
  } else {
    req.user = { sub: "test-user-id", email: "test@example.com" };
    req.auth = { organizationId: "test-org-id" };
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

const mockAuditLog = jest.fn((req, res, next) => next());

jest.mock("../../middleware/security", () => ({
  limiters: {
    general: jest.fn((req, res, next) => next()),
    webhook: jest.fn((req, res, next) => next()),
  },
  authenticate: mockAuthenticate,
  requireScope: mockRequireScope,
  auditLog: mockAuditLog,
}));

// Mock validation middleware
jest.mock("../../middleware/validation", () => ({
  validateString: jest.fn(() => (req, res, next) => next()),
  handleValidationErrors: jest.fn((req, res, next) => next()),
}));

// Import router after mocks
const revopsRouter = require("../revops");

// Helper to create JWT token with scopes
function createToken(scopes = []) {
  return {
    user: {
      sub: "test-user-id",
      email: "test@example.com",
      scopes,
    },
    auth: {
      organizationId: "test-org-id",
    },
  };
}

describe("POST /api/revops/leads/:leadId/qualify", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should qualify a lead using Genesis AI", async () => {
    const leadId = "lead-123";
    const qualificationResult = {
      leadId,
      score: 85,
      status: "QUALIFIED",
      reasons: ["Strong industry fit", "High budget"],
    };

    mockGenesisSalesAI.qualifyLead.mockResolvedValue(qualificationResult);

    const token = createToken(["admin"]);
    const response = await request(app)
      .post(`/api/revops/leads/${leadId}/qualify`)
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(qualificationResult);
    expect(mockGenesisSalesAI.qualifyLead).toHaveBeenCalledWith(leadId);
  });

  test("should return 401 when not authenticated", async () => {
    mockAuthenticate.mockImplementationOnce((req, res) => {
      res.status(401).json({ error: "Unauthorized" });
    });

    const response = await request(app).post("/api/revops/leads/lead-123/qualify").send({});

    expect(response.status).toBe(401);
  });

  test("should return 403 without admin scope", async () => {
    const token = createToken(["sales"]);
    const response = await request(app)
      .post("/api/revops/leads/lead-123/qualify")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(response.status).toBe(403);
  });
});

describe("POST /api/revops/leads/auto-qualify", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should auto-qualify all new leads", async () => {
    const qualifiedLeads = ["lead-1", "lead-2", "lead-3"];
    mockGenesisSalesAI.autoQualifyNewLeads.mockResolvedValue(qualifiedLeads);

    const token = createToken(["admin"]);
    const response = await request(app)
      .post("/api/revops/leads/auto-qualify")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.qualified).toEqual(qualifiedLeads);
    expect(mockGenesisSalesAI.autoQualifyNewLeads).toHaveBeenCalled();
  });

  test("should return 403 without admin scope", async () => {
    const token = createToken(["sales"]);
    const response = await request(app)
      .post("/api/revops/leads/auto-qualify")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(response.status).toBe(403);
  });
});

describe("GET /api/revops/opportunities/top", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should get top sales opportunities", async () => {
    const opportunities = [
      { id: "opp-1", score: 95, value: 100000 },
      { id: "opp-2", score: 90, value: 80000 },
    ];
    mockGenesisSalesAI.getTopOpportunities.mockResolvedValue(opportunities);

    const token = createToken(["sales"]);
    const response = await request(app)
      .get("/api/revops/opportunities/top?limit=10")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(opportunities);
    expect(mockGenesisSalesAI.getTopOpportunities).toHaveBeenCalledWith(10);
  });

  test("should use default limit when not provided", async () => {
    mockGenesisSalesAI.getTopOpportunities.mockResolvedValue([]);

    const token = createToken(["sales"]);
    const response = await request(app)
      .get("/api/revops/opportunities/top")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(mockGenesisSalesAI.getTopOpportunities).toHaveBeenCalledWith(10);
  });

  test("should return 403 without sales scope", async () => {
    const token = createToken(["marketing"]);
    const response = await request(app)
      .get("/api/revops/opportunities/top")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(403);
  });
});

describe("PATCH /api/revops/opportunities/:id/stage", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should update opportunity stage", async () => {
    const opportunityId = "opp-123";
    const updatedOpportunity = {
      id: opportunityId,
      stage: "NEGOTIATION",
      notes: "Moving to contract review",
    };

    mockGenesisSalesAI.updateOpportunityStage.mockResolvedValue(updatedOpportunity);

    const token = createToken(["sales"]);
    const response = await request(app)
      .patch(`/api/revops/opportunities/${opportunityId}/stage`)
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ stage: "NEGOTIATION", notes: "Moving to contract review" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(updatedOpportunity);
    expect(mockGenesisSalesAI.updateOpportunityStage).toHaveBeenCalledWith(
      opportunityId,
      "NEGOTIATION",
      "Moving to contract review",
    );
  });

  test("should return 403 without sales scope", async () => {
    const token = createToken(["admin"]);
    const response = await request(app)
      .patch("/api/revops/opportunities/opp-123/stage")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ stage: "NEGOTIATION" });

    expect(response.status).toBe(403);
  });
});

describe("POST /api/revops/opportunities/:id/win", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should mark opportunity as won", async () => {
    const opportunityId = "opp-123";
    const orgId = "org-456";
    const wonOpportunity = {
      id: opportunityId,
      status: "WON",
      orgId,
      closedAt: new Date().toISOString(),
    };

    mockGenesisSalesAI.markOpportunityWon.mockResolvedValue(wonOpportunity);

    const token = createToken(["sales"]);
    const response = await request(app)
      .post(`/api/revops/opportunities/${opportunityId}/win`)
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ orgId });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(wonOpportunity);
    expect(mockGenesisSalesAI.markOpportunityWon).toHaveBeenCalledWith(opportunityId, orgId);
  });

  test("should return 403 without sales scope", async () => {
    const token = createToken(["marketing"]);
    const response = await request(app)
      .post("/api/revops/opportunities/opp-123/win")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ orgId: "org-456" });

    expect(response.status).toBe(403);
  });
});

describe("POST /api/revops/pricing/calculate", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should calculate dynamic price for a job", async () => {
    const pricingData = {
      vehicleType: "VAN",
      distance: 25.5,
      pickupLocation: { lat: 40.7128, lng: -74.006 },
      dropoffLocation: { lat: 40.7589, lng: -73.9851 },
      urgency: "STANDARD",
    };

    const pricingResult = {
      basePrice: 150,
      finalPrice: 180,
      surgeMultiplier: 1.2,
      breakdown: {
        distance: 125,
        urgency: 25,
        surge: 30,
      },
    };

    mockDynamicPricing.calculateDynamicPrice.mockResolvedValue(pricingResult);

    const token = createToken(["sales"]);
    const response = await request(app)
      .post("/api/revops/pricing/calculate")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send(pricingData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(pricingResult);
    expect(mockDynamicPricing.calculateDynamicPrice).toHaveBeenCalled();
  });

  test("should return 401 when not authenticated", async () => {
    mockAuthenticate.mockImplementationOnce((req, res) => {
      res.status(401).json({ error: "Unauthorized" });
    });

    const response = await request(app).post("/api/revops/pricing/calculate").send({
      vehicleType: "VAN",
      distance: 25.5,
      pickupLocation: {},
      dropoffLocation: {},
    });

    expect(response.status).toBe(401);
  });
});

describe("GET /api/revops/pricing/surge-stats", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should get surge pricing statistics", async () => {
    const stats = {
      averageSurge: 1.15,
      peakHours: ["08:00", "17:00"],
      totalSurgeEvents: 45,
    };

    mockDynamicPricing.getSurgePricingStats.mockResolvedValue(stats);

    const token = createToken(["admin"]);
    const response = await request(app)
      .get("/api/revops/pricing/surge-stats?days=7")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(stats);
    expect(mockDynamicPricing.getSurgePricingStats).toHaveBeenCalledWith(7);
  });

  test("should use default days when not provided", async () => {
    mockDynamicPricing.getSurgePricingStats.mockResolvedValue({});

    const token = createToken(["admin"]);
    const response = await request(app)
      .get("/api/revops/pricing/surge-stats")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(mockDynamicPricing.getSurgePricingStats).toHaveBeenCalledWith(7);
  });

  test("should return 403 without admin scope", async () => {
    const token = createToken(["sales"]);
    const response = await request(app)
      .get("/api/revops/pricing/surge-stats")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(403);
  });
});

describe("GET /api/revops/pricing/recommendations", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should get AI-powered pricing recommendations", async () => {
    const recommendations = [
      { route: "NYC-BOS", suggestedIncrease: 5, reason: "High demand" },
      { route: "LA-SF", suggestedDecrease: 3, reason: "Low utilization" },
    ];

    mockDynamicPricing.recommendPriceAdjustments.mockResolvedValue(recommendations);

    const token = createToken(["admin"]);
    const response = await request(app)
      .get("/api/revops/pricing/recommendations")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(recommendations);
    expect(mockDynamicPricing.recommendPriceAdjustments).toHaveBeenCalled();
  });

  test("should return 403 without admin scope", async () => {
    const token = createToken(["marketing"]);
    const response = await request(app)
      .get("/api/revops/pricing/recommendations")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(403);
  });
});

describe("POST /api/revops/campaigns", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should create outbound campaign", async () => {
    const campaignData = {
      name: "Q1 Logistics Campaign",
      type: "email",
      targetIndustry: "LOGISTICS",
      targetRegion: "US",
      callToAction: "Schedule a demo",
    };

    const createdCampaign = {
      id: "campaign-123",
      ...campaignData,
      status: "DRAFT",
    };

    mockOutboundEngine.createCampaign.mockResolvedValue(createdCampaign);

    const token = createToken(["marketing"]);
    const response = await request(app)
      .post("/api/revops/campaigns")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send(campaignData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(createdCampaign);
    expect(mockOutboundEngine.createCampaign).toHaveBeenCalled();
  });

  test("should return 403 without marketing scope", async () => {
    const token = createToken(["sales"]);
    const response = await request(app)
      .post("/api/revops/campaigns")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        name: "Test Campaign",
        type: "email",
        callToAction: "Sign up",
      });

    expect(response.status).toBe(403);
  });
});

describe("POST /api/revops/campaigns/:id/recipients", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should add recipients to campaign", async () => {
    const campaignId = "campaign-123";
    const recipients = ["lead-1", "lead-2", "lead-3"];

    mockOutboundEngine.addRecipientsToCampaign.mockResolvedValue(3);

    const token = createToken(["marketing"]);
    const response = await request(app)
      .post(`/api/revops/campaigns/${campaignId}/recipients`)
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ recipients });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.added).toBe(3);
    expect(mockOutboundEngine.addRecipientsToCampaign).toHaveBeenCalledWith(campaignId, recipients);
  });

  test("should return 403 without marketing scope", async () => {
    const token = createToken(["admin"]);
    const response = await request(app)
      .post("/api/revops/campaigns/campaign-123/recipients")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ recipients: [] });

    expect(response.status).toBe(403);
  });
});

describe("POST /api/revops/campaigns/:id/send", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should send campaign messages", async () => {
    const campaignId = "campaign-123";
    const sendResult = {
      sent: 45,
      failed: 5,
      campaignStatus: "SENT",
    };

    mockOutboundEngine.sendCampaignMessages.mockResolvedValue(sendResult);

    const token = createToken(["marketing"]);
    const response = await request(app)
      .post(`/api/revops/campaigns/${campaignId}/send`)
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ batchSize: 50 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(sendResult);
    expect(mockOutboundEngine.sendCampaignMessages).toHaveBeenCalledWith(campaignId, 50);
  });

  test("should use default batch size when not provided", async () => {
    mockOutboundEngine.sendCampaignMessages.mockResolvedValue({ sent: 50 });

    const token = createToken(["marketing"]);
    const response = await request(app)
      .post("/api/revops/campaigns/campaign-123/send")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(response.status).toBe(200);
    expect(mockOutboundEngine.sendCampaignMessages).toHaveBeenCalledWith("campaign-123", 50);
  });

  test("should return 403 without marketing scope", async () => {
    const token = createToken(["sales"]);
    const response = await request(app)
      .post("/api/revops/campaigns/campaign-123/send")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(response.status).toBe(403);
  });
});

describe("GET /api/revops/campaigns/:id/performance", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should get campaign performance metrics", async () => {
    const campaignId = "campaign-123";
    const performance = {
      sent: 100,
      opened: 45,
      clicked: 12,
      converted: 3,
      openRate: 0.45,
      clickRate: 0.12,
      conversionRate: 0.03,
    };

    mockOutboundEngine.getCampaignPerformance.mockResolvedValue(performance);

    const token = createToken(["marketing"]);
    const response = await request(app)
      .get(`/api/revops/campaigns/${campaignId}/performance`)
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(performance);
    expect(mockOutboundEngine.getCampaignPerformance).toHaveBeenCalledWith(campaignId);
  });

  test("should return 403 without marketing scope", async () => {
    const token = createToken(["admin"]);
    const response = await request(app)
      .get("/api/revops/campaigns/campaign-123/performance")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(403);
  });
});

describe("POST /api/revops/campaigns/nurture", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should create nurture campaign for stale leads", async () => {
    const nurtureCampaign = {
      id: "nurture-campaign-123",
      name: "Stale Leads Re-engagement",
      type: "email",
      targetCount: 150,
    };

    mockOutboundEngine.createNurtureCampaign.mockResolvedValue(nurtureCampaign);

    const token = createToken(["marketing"]);
    const response = await request(app)
      .post("/api/revops/campaigns/nurture")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(nurtureCampaign);
    expect(mockOutboundEngine.createNurtureCampaign).toHaveBeenCalled();
  });

  test("should return 403 without marketing scope", async () => {
    const token = createToken(["sales"]);
    const response = await request(app)
      .post("/api/revops/campaigns/nurture")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(response.status).toBe(403);
  });
});

describe("POST /api/revops/contracts/generate", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should generate enterprise contract", async () => {
    const contractData = {
      opportunityId: "opp-123",
      orgId: "org-456",
      orgName: "Acme Corp",
      contactName: "John Doe",
      contactEmail: "john@acme.com",
      annualValue: 250000,
      contractTerm: 12,
      plan: "ENTERPRISE",
    };

    const contractId = "contract-789";
    mockContractWorkflow.generateEnterpriseContract.mockResolvedValue(contractId);

    const token = createToken(["sales"]);
    const response = await request(app)
      .post("/api/revops/contracts/generate")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send(contractData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.contractId).toBe(contractId);
    expect(mockContractWorkflow.generateEnterpriseContract).toHaveBeenCalled();
  });

  test("should return 403 without sales scope", async () => {
    const token = createToken(["marketing"]);
    const response = await request(app)
      .post("/api/revops/contracts/generate")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        opportunityId: "opp-123",
        orgId: "org-456",
        orgName: "Acme Corp",
        contactName: "John Doe",
        contactEmail: "john@acme.com",
        annualValue: 250000,
        contractTerm: 12,
        plan: "ENTERPRISE",
      });

    expect(response.status).toBe(403);
  });
});

describe("GET /api/revops/contracts/pending", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should get pending contracts", async () => {
    const contracts = [
      { id: "contract-1", status: "PENDING_SIGNATURE", orgName: "Acme Corp" },
      { id: "contract-2", status: "PENDING_APPROVAL", orgName: "Beta Inc" },
    ];

    mockContractWorkflow.getPendingContracts.mockResolvedValue(contracts);

    const token = createToken(["sales"]);
    const response = await request(app)
      .get("/api/revops/contracts/pending")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(contracts);
    expect(mockContractWorkflow.getPendingContracts).toHaveBeenCalled();
  });

  test("should return 403 without sales scope", async () => {
    const token = createToken(["admin"]);
    const response = await request(app)
      .get("/api/revops/contracts/pending")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(403);
  });
});

describe("GET /api/revops/contracts/:id", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should get contract details", async () => {
    const contractId = "contract-123";
    const contract = {
      id: contractId,
      orgName: "Acme Corp",
      annualValue: 250000,
      status: "ACTIVE",
    };

    mockContractWorkflow.getContract.mockResolvedValue(contract);

    const token = createToken(["sales"]);
    const response = await request(app)
      .get(`/api/revops/contracts/${contractId}`)
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(contract);
    expect(mockContractWorkflow.getContract).toHaveBeenCalledWith(contractId);
  });

  test("should return 403 without sales scope", async () => {
    const token = createToken(["marketing"]);
    const response = await request(app)
      .get("/api/revops/contracts/contract-123")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(403);
  });
});

describe("POST /api/webhooks/contract-signed", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should handle contract signature webhook", async () => {
    const webhookData = {
      signatureRequestId: "sig-req-123",
      signerEmail: "john@acme.com",
      signerName: "John Doe",
    };

    const updatedContract = {
      id: "contract-123",
      status: "SIGNED",
      signedAt: new Date().toISOString(),
    };

    mockContractWorkflow.handleSignatureCompleted.mockResolvedValue(updatedContract);

    const response = await request(app)
      .post("/api/revops/webhooks/contract-signed")
      .send(webhookData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(updatedContract);
    expect(mockContractWorkflow.handleSignatureCompleted).toHaveBeenCalledWith(
      "sig-req-123",
      "john@acme.com",
      "John Doe",
    );
  });

  test("should not require authentication for webhook", async () => {
    mockContractWorkflow.handleSignatureCompleted.mockResolvedValue({});

    const response = await request(app).post("/api/revops/webhooks/contract-signed").send({
      signatureRequestId: "sig-req-123",
      signerEmail: "john@acme.com",
      signerName: "John Doe",
    });

    expect(response.status).toBe(200);
  });
});

describe("GET /api/revops/dashboard", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should get complete RevOps dashboard", async () => {
    const dashboard = {
      leads: { total: 150, qualified: 45 },
      opportunities: { total: 30, topScore: 95 },
      campaigns: { active: 5, totalSent: 1200 },
      contracts: { pending: 3, active: 12 },
      revenue: { monthly: 125000, annual: 1500000 },
    };

    mockRevopsDashboard.getRevOpsDashboard.mockResolvedValue(dashboard);

    const token = createToken(["admin"]);
    const response = await request(app)
      .get("/api/revops/dashboard")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(dashboard);
    expect(mockRevopsDashboard.getRevOpsDashboard).toHaveBeenCalled();
  });

  test("should return 403 without admin scope", async () => {
    const token = createToken(["sales"]);
    const response = await request(app)
      .get("/api/revops/dashboard")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`);

    expect(response.status).toBe(403);
  });
});

describe("POST /api/revops/recommendations", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should store a recommendation", async () => {
    const recommendationData = {
      category: "PRICING",
      description: "Increase NYC-BOS route by 5%",
      estimatedImpact: 12000,
    };

    const storedRecommendation = {
      id: "rec-123",
      ...recommendationData,
      status: "PENDING",
    };

    mockRevopsDashboard.storeRecommendation.mockResolvedValue(storedRecommendation);

    const token = createToken(["admin"]);
    const response = await request(app)
      .post("/api/revops/recommendations")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send(recommendationData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(storedRecommendation);
    expect(mockRevopsDashboard.storeRecommendation).toHaveBeenCalledWith(recommendationData);
  });

  test("should return 403 without admin scope", async () => {
    const token = createToken(["sales"]);
    const response = await request(app)
      .post("/api/revops/recommendations")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        category: "PRICING",
        description: "Test",
      });

    expect(response.status).toBe(403);
  });
});

describe("PATCH /api/revops/recommendations/:id/implement", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should mark recommendation as implemented", async () => {
    const recommendationId = "rec-123";
    const actualImpact = 15000;

    const implementedRecommendation = {
      id: recommendationId,
      status: "IMPLEMENTED",
      actualImpact,
      approvedBy: "test-user-id",
    };

    mockRevopsDashboard.markRecommendationImplemented.mockResolvedValue(implementedRecommendation);

    const token = createToken(["admin"]);
    const response = await request(app)
      .patch(`/api/revops/recommendations/${recommendationId}/implement`)
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ actualImpact });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(implementedRecommendation);
    expect(mockRevopsDashboard.markRecommendationImplemented).toHaveBeenCalledWith(
      recommendationId,
      "test-user-id",
      actualImpact,
    );
  });

  test("should return 403 without admin scope", async () => {
    const token = createToken(["marketing"]);
    const response = await request(app)
      .patch("/api/revops/recommendations/rec-123/implement")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({ actualImpact: 15000 });

    expect(response.status).toBe(403);
  });
});

describe("Middleware Integration", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/revops", revopsRouter);
    jest.clearAllMocks();
  });

  test("should apply rate limiting to all routes", async () => {
    const { limiters } = require("../../middleware/security");

    const token = createToken(["admin"]);
    await request(app)
      .post("/api/revops/leads/auto-qualify")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({});

    expect(limiters.general).toHaveBeenCalled();
  });

  test("should apply audit logging to create/update operations", async () => {
    mockOutboundEngine.createCampaign.mockResolvedValue({ id: "campaign-123" });

    const token = createToken(["marketing"]);
    await request(app)
      .post("/api/revops/campaigns")
      .set("Authorization", `Bearer ${JSON.stringify(token)}`)
      .send({
        name: "Test Campaign",
        type: "email",
        callToAction: "Sign up",
      });

    expect(mockAuditLog).toHaveBeenCalled();
  });
});
