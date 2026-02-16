/**
 * Phase 11: Advanced Analytics & Intelligence Test Suite
 */

const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/middleware/security", () => {
  const actual = jest.requireActual("../src/middleware/security");
  const noOp = (_req, _res, next) => next();
  return {
    ...actual,
    limiters: {
      ...actual.limiters,
      ai: noOp,
      general: noOp,
      export: noOp,
    },
    rateLimit: noOp,
  };
});

jest.mock("../src/services/realTimeAnalytics", () => ({
  getKPI: jest.fn(),
  getTimeSeries: jest.fn(),
  getDashboardSnapshot: jest.fn(),
  createWidget: jest.fn(),
  exportData: jest.fn(),
}));

jest.mock("../src/services/cohortAnalysis", () => ({
  createCohort: jest.fn(),
  analyzeRetention: jest.fn(),
  calculateLTV: jest.fn(),
  performRFMAnalysis: jest.fn(),
  createLookalikeAudience: jest.fn(),
}));

jest.mock("../src/services/predictiveAnalytics", () => ({
  predictChurn: jest.fn(),
  predictLTV: jest.fn(),
  identifyUpsellOpportunities: jest.fn(),
  predictCampaignResponse: jest.fn(),
  whatIfAnalysis: jest.fn(),
}));

jest.mock("../src/services/businessIntelligence", () => ({
  generateExecutiveSummary: jest.fn(),
  generateFinancialReport: jest.fn(),
  generateOperationalReport: jest.fn(),
  generateTrendAnalysis: jest.fn(),
  generateCustomReport: jest.fn(),
  scheduleReport: jest.fn(),
  exportReport: jest.fn(),
}));

const app = require("../src/server");
const realTimeAnalytics = require("../src/services/realTimeAnalytics");
const cohortAnalysis = require("../src/services/cohortAnalysis");
const predictiveAnalytics = require("../src/services/predictiveAnalytics");
const businessIntelligence = require("../src/services/businessIntelligence");

const basePath = "/api/analytics/phase11";
const testSecret = process.env.JWT_SECRET || "test-secret";

const fullScopeToken = jwt.sign(
  {
    sub: "test-user-123",
    email: "test@example.com",
    scopes: [
      "analytics:read",
      "analytics:write",
      "analytics:cohort",
      "analytics:predict",
      "analytics:reports",
      "analytics:reports:schedule",
    ],
  },
  testSecret,
  { expiresIn: "1h" },
);

const readOnlyToken = jwt.sign(
  {
    sub: "test-user-123",
    email: "test@example.com",
    scopes: ["analytics:read"],
  },
  testSecret,
  { expiresIn: "1h" },
);

const noScopeToken = jwt.sign(
  {
    sub: "test-user-123",
    email: "test@example.com",
    scopes: [],
  },
  testSecret,
  { expiresIn: "1h" },
);

function auth(token = fullScopeToken) {
  return { Authorization: `Bearer ${token}` };
}

describe("Phase 11: Analytics API", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    realTimeAnalytics.getKPI.mockResolvedValue({ metric: "REVENUE_TODAY", value: 1200 });
    realTimeAnalytics.getTimeSeries.mockResolvedValue({ metric: "ORDERS_TODAY", points: [] });
    realTimeAnalytics.getDashboardSnapshot.mockResolvedValue({ kpis: [], systemHealth: {} });
    realTimeAnalytics.createWidget.mockResolvedValue({ id: "widget-123", name: "Revenue" });
    realTimeAnalytics.exportData.mockResolvedValue({ format: "json", rows: [] });

    cohortAnalysis.createCohort.mockResolvedValue({ cohortId: "cohort-123", customerCount: 10 });
    cohortAnalysis.analyzeRetention.mockResolvedValue({ cohortId: "cohort-123", curve: [] });
    cohortAnalysis.calculateLTV.mockResolvedValue({ userId: "user-123", ltv: 4200 });
    cohortAnalysis.performRFMAnalysis.mockResolvedValue({ segments: [] });
    cohortAnalysis.createLookalikeAudience.mockResolvedValue({ lookalikes: [] });

    predictiveAnalytics.predictChurn.mockResolvedValue({
      userId: "user-123",
      churnProbability: 0.2,
    });
    predictiveAnalytics.predictLTV.mockResolvedValue({ userId: "user-123", predictedLTV: 8000 });
    predictiveAnalytics.identifyUpsellOpportunities.mockResolvedValue({ opportunities: [] });
    predictiveAnalytics.predictCampaignResponse.mockResolvedValue({ responseProbability: 0.4 });
    predictiveAnalytics.whatIfAnalysis.mockResolvedValue({ impacts: {} });

    businessIntelligence.generateExecutiveSummary.mockResolvedValue({ title: "Executive Summary" });
    businessIntelligence.generateFinancialReport.mockResolvedValue({ revenue: 10000 });
    businessIntelligence.generateOperationalReport.mockResolvedValue({ deliveries: 120 });
    businessIntelligence.generateTrendAnalysis.mockResolvedValue({ trend: "up" });
    businessIntelligence.generateCustomReport.mockResolvedValue({ title: "Custom Report" });
    businessIntelligence.scheduleReport.mockResolvedValue({ scheduleId: "schedule-123" });
    businessIntelligence.exportReport.mockResolvedValue({ format: "pdf", data: {} });
  });

  it("returns health status", async () => {
    const response = await request(app).get(`${basePath}/health`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("status", "operational");
  });

  describe("authorization checks", () => {
    it("rejects unauthenticated KPI requests", async () => {
      const response = await request(app).get(`${basePath}/kpi/REVENUE_TODAY`);
      expect(response.status).toBe(401);
    });

    test.each([
      { method: "get", path: "/kpi/REVENUE_TODAY", token: noScopeToken },
      {
        method: "post",
        path: "/time-series",
        token: noScopeToken,
        body: { metricName: "ORDERS_TODAY", startDate: "2026-02-01", endDate: "2026-02-02" },
      },
      { method: "get", path: "/dashboard/snapshot", token: noScopeToken },
      { method: "get", path: "/export?format=json", token: noScopeToken },
      {
        method: "post",
        path: "/widget",
        token: readOnlyToken,
        body: { name: "Widget", type: "kpi_card", metric: "REVENUE_TODAY" },
      },
      {
        method: "post",
        path: "/cohort",
        token: readOnlyToken,
        body: { name: "Test", type: "custom", criteria: {} },
      },
      {
        method: "get",
        path: "/predict/churn/550e8400-e29b-41d4-a716-446655440000",
        token: readOnlyToken,
      },
      { method: "get", path: "/report/executive-summary", token: readOnlyToken },
      {
        method: "post",
        path: "/report/schedule",
        token: readOnlyToken,
        body: { type: "executive_summary", frequency: "weekly", recipients: ["test@example.com"] },
      },
    ])("rejects missing scope for $method $path", async ({ method, path, token, body }) => {
      const req = request(app)[method](`${basePath}${path}`).set(auth(token));
      if (body) req.send(body);
      const response = await req;
      expect(response.status).toBe(403);
    });
  });

  describe("success paths", () => {
    test.each([
      { method: "get", path: "/kpi/REVENUE_TODAY", expected: 200 },
      {
        method: "post",
        path: "/time-series",
        expected: 200,
        body: {
          metricName: "ORDERS_TODAY",
          startDate: "2026-02-01",
          endDate: "2026-02-02",
          granularity: "HOUR",
        },
      },
      { method: "get", path: "/dashboard/snapshot", expected: 200 },
      { method: "get", path: "/export?format=json", expected: 200 },
      {
        method: "post",
        path: "/widget",
        expected: 201,
        body: { name: "Revenue", type: "kpi_card", metric: "REVENUE_TODAY" },
      },
      {
        method: "post",
        path: "/cohort",
        expected: 201,
        body: { name: "Recent", type: "signup_date", criteria: { days: 30 } },
      },
      {
        method: "get",
        path: "/cohort/550e8400-e29b-41d4-a716-446655440000/retention",
        expected: 200,
      },
      { method: "get", path: "/user/550e8400-e29b-41d4-a716-446655440000/ltv", expected: 200 },
      {
        method: "post",
        path: "/rfm-analysis",
        expected: 200,
        body: { userIds: ["550e8400-e29b-41d4-a716-446655440000"] },
      },
      {
        method: "post",
        path: "/lookalike",
        expected: 200,
        body: { seedUserIds: ["550e8400-e29b-41d4-a716-446655440000"], similarityThreshold: 0.7 },
      },
      { method: "get", path: "/predict/churn/550e8400-e29b-41d4-a716-446655440000", expected: 200 },
      { method: "get", path: "/predict/ltv/550e8400-e29b-41d4-a716-446655440000", expected: 200 },
      {
        method: "get",
        path: "/predict/upsell/550e8400-e29b-41d4-a716-446655440000",
        expected: 200,
      },
      {
        method: "post",
        path: "/predict/campaign-response",
        expected: 200,
        body: { userId: "550e8400-e29b-41d4-a716-446655440000", campaignType: "discount" },
      },
      {
        method: "post",
        path: "/what-if",
        expected: 200,
        body: { baseMetrics: { revenue: 100 }, changes: { revenue: 10 } },
      },
      { method: "get", path: "/report/executive-summary", expected: 200 },
      {
        method: "post",
        path: "/report/financial",
        expected: 200,
        body: { startDate: "2026-02-01", endDate: "2026-02-15" },
      },
      {
        method: "post",
        path: "/report/operational",
        expected: 200,
        body: { startDate: "2026-02-01", endDate: "2026-02-15" },
      },
      {
        method: "post",
        path: "/report/trend",
        expected: 200,
        body: { metricName: "revenue", lookbackDays: 30 },
      },
      {
        method: "post",
        path: "/report/custom",
        expected: 200,
        body: { template: "template-1", parameters: {} },
      },
      {
        method: "post",
        path: "/report/schedule",
        expected: 201,
        body: {
          type: "executive_summary",
          frequency: "weekly",
          recipients: ["test@example.com"],
          format: "pdf",
        },
      },
      {
        method: "get",
        path: "/report/550e8400-e29b-41d4-a716-446655440000/export?format=pdf",
        expected: 200,
      },
    ])("handles $method $path", async ({ method, path, body, expected }) => {
      const req = request(app)[method](`${basePath}${path}`).set(auth());
      if (body) req.send(body);
      const response = await req;
      expect(response.status).toBe(expected);
      expect(response.body.success).toBe(true);
    });
  });

  describe("validation errors", () => {
    test.each([
      {
        method: "post",
        path: "/time-series",
        body: { metricName: "ORDERS_TODAY", startDate: "bad", endDate: "bad" },
      },
      { method: "post", path: "/widget", body: { name: "x", type: "kpi_card" } },
      { method: "post", path: "/cohort", body: { name: "Test", type: "invalid", criteria: {} } },
      { method: "get", path: "/cohort/not-a-uuid/retention" },
      { method: "get", path: "/user/not-a-uuid/ltv" },
      { method: "post", path: "/rfm-analysis", body: { userIds: ["not-a-uuid"] } },
      { method: "post", path: "/lookalike", body: { seedUserIds: [] } },
      { method: "get", path: "/predict/churn/not-a-uuid" },
      { method: "get", path: "/predict/ltv/not-a-uuid" },
      { method: "get", path: "/predict/upsell/not-a-uuid" },
      { method: "post", path: "/predict/campaign-response", body: { userId: "not-a-uuid" } },
      { method: "post", path: "/what-if", body: { baseMetrics: "bad", changes: {} } },
      { method: "post", path: "/report/financial", body: { startDate: "bad", endDate: "bad" } },
      { method: "post", path: "/report/operational", body: { startDate: "bad", endDate: "bad" } },
      { method: "post", path: "/report/trend", body: { lookbackDays: 3 } },
      { method: "post", path: "/report/custom", body: { parameters: {} } },
      {
        method: "post",
        path: "/report/schedule",
        body: { type: "exec", frequency: "bad", recipients: [] },
      },
      { method: "get", path: "/report/not-a-uuid/export" },
    ])("returns 400 for $method $path", async ({ method, path, body }) => {
      const req = request(app)[method](`${basePath}${path}`).set(auth());
      if (body) req.send(body);
      const response = await req;
      expect(response.status).toBe(400);
    });

    it("rejects invalid export filters JSON", async () => {
      const response = await request(app)
        .get(`${basePath}/export?format=json&filters=not-json`)
        .set(auth());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
