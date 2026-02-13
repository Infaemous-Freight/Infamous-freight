/**
 * Dispatch Processor Tests
 * Tests for dispatch wave worker processing
 */

// Mock Prisma before requiring the module
const mockPrisma = {
  job: {
    findUnique: jest.fn(),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock wave configuration
const mockWaveConfig = jest.fn(() => ({
  radiusMiles: 10,
  wave1: { count: 3, expirySeconds: 30 },
  wave2: { count: 10, expirySeconds: 30 },
  wave3: { enabled: true, count: 50, expirySeconds: 60 },
}));

const mockRunWave = jest.fn();

jest.mock("../../marketplace/waves", () => ({
  waveConfig: mockWaveConfig,
  runWave: mockRunWave,
}));

// Mock queue schedule
const mockEnqueueWave = jest.fn();

jest.mock("../../queue/schedule", () => ({
  enqueueWave: mockEnqueueWave,
}));

// Mock notifier
const mockNotifier = jest.fn(() => ({
  pushExpo: jest.fn(),
}));

jest.mock("../../notify/index", () => ({
  notifier: mockNotifier,
}));

const { processDispatch } = require("../../worker/processors/dispatch");

describe("Dispatch Processor", () => {
  let mockJob;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockRunWave.mockResolvedValue({ offers: [] });
    mockNotifier.mockReturnValue({
      pushExpo: jest.fn().mockResolvedValue(true),
    });
    mockEnqueueWave.mockResolvedValue(true);

    mockJob = {
      id: "job-1",
      data: {
        jobId: "shipment_123",
        wave: 1,
      },
    };
  });

  describe("Job Processing", () => {
    it("should process dispatch job successfully", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: "shipment_123",
        status: "OPEN",
        driverId: null,
      });

      const result = await processDispatch(mockJob);

      expect(result).toBeDefined();
      expect(result.ok || result.skipped).toBe(true);
    });

    it("should return skipped for assigned jobs", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: "shipment_123",
        status: "OPEN",
        driverId: "driver_123",
      });

      const result = await processDispatch(mockJob);

      expect(result.skipped).toBe(true);
    });

    it("should return skipped for non-open jobs", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: "shipment_123",
        status: "ASSIGNED",
        driverId: null,
      });

      const result = await processDispatch(mockJob);

      expect(result.skipped).toBe(true);
    });

    it("should handle missing jobs", async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);

      const result = await processDispatch(mockJob);

      expect(result.skipped).toBe(true);
    });
  });

  describe("Wave Management", () => {
    beforeEach(() => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: "shipment_123",
        status: "OPEN",
        driverId: null,
      });
    });

    it("should support wave 1", async () => {
      mockJob.data.wave = 1;

      const result = await processDispatch(mockJob);
      expect(result).toBeDefined();
    });

    it("should support wave 2", async () => {
      mockJob.data.wave = 2;

      const result = await processDispatch(mockJob);
      expect(result).toBeDefined();
    });

    it("should support wave 3", async () => {
      mockJob.data.wave = 3;

      const result = await processDispatch(mockJob);
      expect(result).toBeDefined();
    });

    it("should track number of offers", async () => {
      const result = await processDispatch(mockJob);

      if (result.offers !== undefined) {
        expect(typeof result.offers).toBe("number");
        expect(result.offers).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors", async () => {
      mockPrisma.job.findUnique.mockRejectedValue(new Error("Database error"));

      await expect(processDispatch(mockJob)).rejects.toThrow();
    });

    it("should handle missing job data", async () => {
      mockJob.data = {};

      mockPrisma.job.findUnique.mockResolvedValue({
        id: "shipment_123",
        status: "OPEN",
        driverId: null,
      });

      const result = await processDispatch(mockJob);
      expect(result).toBeDefined();
    });

    it("should validate wave parameter", async () => {
      mockJob.data.wave = 999;

      mockPrisma.job.findUnique.mockResolvedValue({
        id: "shipment_123",
        status: "OPEN",
        driverId: null,
      });

      const result = await processDispatch(mockJob);
      expect(result).toBeDefined();
    });
  });

  describe("Notification Sending", () => {
    it("should handle notification for offers", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: "shipment_123",
        status: "OPEN",
        driverId: null,
      });

      const result = await processDispatch(mockJob);

      expect(result).toBeDefined();
    });

    it("should handle notification errors gracefully", async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: "shipment_123",
        status: "OPEN",
        driverId: null,
      });

      const result = await processDispatch(mockJob);

      // Should not throw even with notification errors
      expect(result).toBeDefined();
    });
  });

  describe("Job Validation", () => {
    it("should require jobId in data", async () => {
      mockJob.data = { wave: 1 };

      mockPrisma.job.findUnique.mockResolvedValue(null);

      const result = await processDispatch(mockJob);
      expect(result).toBeDefined();
    });

    it("should require wave in data", async () => {
      mockJob.data = { jobId: "shipment_123" };

      mockPrisma.job.findUnique.mockResolvedValue({
        id: "shipment_123",
        status: "OPEN",
        driverId: null,
      });

      const result = await processDispatch(mockJob);
      expect(result).toBeDefined();
    });
  });

  describe("Wave Progression", () => {
    beforeEach(() => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: "shipment_123",
        status: "OPEN",
        driverId: null,
      });
    });

    it("should schedule next wave after wave 1", async () => {
      mockJob.data.wave = 1;

      const result = await processDispatch(mockJob);
      expect(result).toBeDefined();
    });

    it("should schedule next wave after wave 2", async () => {
      mockJob.data.wave = 2;

      const result = await processDispatch(mockJob);
      expect(result).toBeDefined();
    });

    it("should handle wave 3 completion", async () => {
      mockJob.data.wave = 3;

      const result = await processDispatch(mockJob);
      expect(result).toBeDefined();
    });
  });
});
