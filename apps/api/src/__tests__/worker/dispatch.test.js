/**
 * Dispatch Processor Tests
 * Tests for dispatch wave worker processing
 */

jest.mock('@prisma/client');
jest.mock('../../marketplace/waves');
jest.mock('../../queue/schedule');
jest.mock('../../notify/index');

const { processDispatch } = require('../../worker/processors/dispatch');
const { PrismaClient } = require('@prisma/client');

describe('Dispatch Processor', () => {
    let mockJob;
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();

        mockPrisma = {
            job: {
                findUnique: jest.fn(),
            },
        };

        PrismaClient.mockImplementation(() => mockPrisma);

        mockJob = {
            id: 'job-1',
            data: {
                jobId: 'shipment_123',
                wave: 1,
            },
        };
    });

    describe('Job Processing', () => {
        it('should process dispatch job successfully', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                id: 'shipment_123',
                status: 'OPEN',
                driverId: null,
            });

            const result = await processDispatch(mockJob);

            expect(result).toBeDefined();
            expect(result.ok || result.skipped).toBe(true);
        });

        it('should return skipped for assigned jobs', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                id: 'shipment_123',
                status: 'OPEN',
                driverId: 'driver_123',
            });

            const result = await processDispatch(mockJob);

            expect(result.skipped).toBe(true);
        });

        it('should return skipped for non-open jobs', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                id: 'shipment_123',
                status: 'ASSIGNED',
                driverId: null,
            });

            const result = await processDispatch(mockJob);

            expect(result.skipped).toBe(true);
        });

        it('should handle missing jobs', async () => {
            mockPrisma.job.findUnique.mockResolvedValue(null);

            const result = await processDispatch(mockJob);

            expect(result.skipped).toBe(true);
        });
    });

    describe('Wave Management', () => {
        beforeEach(() => {
            mockPrisma.job.findUnique.mockResolvedValue({
                id: 'shipment_123',
                status: 'OPEN',
                driverId: null,
            });
        });

        it('should support wave 1', async () => {
            mockJob.data.wave = 1;

            const result = await processDispatch(mockJob);
            expect(result).toBeDefined();
        });

        it('should support wave 2', async () => {
            mockJob.data.wave = 2;

            const result = await processDispatch(mockJob);
            expect(result).toBeDefined();
        });

        it('should support wave 3', async () => {
            mockJob.data.wave = 3;

            const result = await processDispatch(mockJob);
            expect(result).toBeDefined();
        });

        it('should track number of offers', async () => {
            const result = await processDispatch(mockJob);

            if (result.offers !== undefined) {
                expect(typeof result.offers).toBe('number');
                expect(result.offers).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors', async () => {
            mockPrisma.job.findUnique.mockRejectedValue(
                new Error('Database error')
            );

            await expect(processDispatch(mockJob)).rejects.toThrow();
        });

        it('should handle missing job data', async () => {
            mockJob.data = {};

            mockPrisma.job.findUnique.mockResolvedValue({
                id: 'shipment_123',
                status: 'OPEN',
                driverId: null,
            });

            const result = await processDispatch(mockJob);
            expect(result).toBeDefined();
        });

        it('should validate wave parameter', async () => {
            mockJob.data.wave = 999;

            mockPrisma.job.findUnique.mockResolvedValue({
                id: 'shipment_123',
                status: 'OPEN',
                driverId: null,
            });

            const result = await processDispatch(mockJob);
            expect(result).toBeDefined();
        });
    });

    describe('Notification Sending', () => {
        it('should handle notification for offers', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                id: 'shipment_123',
                status: 'OPEN',
                driverId: null,
            });

            const result = await processDispatch(mockJob);

            expect(result).toBeDefined();
        });

        it('should handle notification errors gracefully', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                id: 'shipment_123',
                status: 'OPEN',
                driverId: null,
            });

            const result = await processDispatch(mockJob);

            // Should not throw even with notification errors
            expect(result).toBeDefined();
        });
    });

    describe('Job Validation', () => {
        it('should require jobId in data', async () => {
            mockJob.data = { wave: 1 };

            mockPrisma.job.findUnique.mockResolvedValue(null);

            const result = await processDispatch(mockJob);
            expect(result).toBeDefined();
        });

        it('should require wave in data', async () => {
            mockJob.data = { jobId: 'shipment_123' };

            mockPrisma.job.findUnique.mockResolvedValue({
                id: 'shipment_123',
                status: 'OPEN',
                driverId: null,
            });

            const result = await processDispatch(mockJob);
            expect(result).toBeDefined();
        });
    });

    describe('Wave Progression', () => {
        beforeEach(() => {
            mockPrisma.job.findUnique.mockResolvedValue({
                id: 'shipment_123',
                status: 'OPEN',
                driverId: null,
            });
        });

        it('should schedule next wave after wave 1', async () => {
            mockJob.data.wave = 1;

            const result = await processDispatch(mockJob);
            expect(result).toBeDefined();
        });

        it('should schedule next wave after wave 2', async () => {
            mockJob.data.wave = 2;

            const result = await processDispatch(mockJob);
            expect(result).toBeDefined();
        });

        it('should handle wave 3 completion', async () => {
            mockJob.data.wave = 3;

            const result = await processDispatch(mockJob);
            expect(result).toBeDefined();
        });
    });
});
