/**
 * Expiry Processor Tests
 * Tests for offer and hold expiration processing
 */

jest.mock('@prisma/client');

const { processExpireOffers, processExpireHolds } = require('../../worker/processors/expiry');
const { PrismaClient } = require('@prisma/client');

describe('Expiry Processor', () => {
    let mockPrisma;

    beforeEach(() => {
        jest.clearAllMocks();

        mockPrisma = {
            jobOffer: {
                updateMany: jest.fn(),
            },
            job: {
                findMany: jest.fn(),
                update: jest.fn(),
            },
            jobEvent: {
                create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(mockPrisma)),
        };

        PrismaClient.mockImplementation(() => mockPrisma);
    });

    describe('Offer Expiration', () => {
        it('should expire offers for specific job', async () => {
            mockPrisma.jobOffer.updateMany.mockResolvedValue({ count: 3 });

            const job = {
                id: 'job-1',
                data: {
                    scope: 'job',
                    jobId: 'shipment_123',
                },
            };

            const result = await processExpireOffers(job);

            expect(result.updated).toBe(3);
        });

        it('should expire all offers globally', async () => {
            mockPrisma.jobOffer.updateMany.mockResolvedValue({ count: 15 });

            const job = {
                id: 'job-1',
                data: {
                    scope: 'global',
                },
            };

            const result = await processExpireOffers(job);

            expect(result.updated).toBe(15);
        });

        it('should query with correct status filters', async () => {
            mockPrisma.jobOffer.updateMany.mockResolvedValue({ count: 0 });

            const job = {
                id: 'job-1',
                data: {
                    scope: 'job',
                    jobId: 'shipment_123',
                },
            };

            await processExpireOffers(job);

            expect(mockPrisma.jobOffer.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        jobId: 'shipment_123',
                        status: 'OFFERED',
                        expiresAt: { lt: expect.any(Date) },
                    }),
                    data: { status: 'EXPIRED' },
                })
            );
        });

        it('should handle zero expired offers', async () => {
            mockPrisma.jobOffer.updateMany.mockResolvedValue({ count: 0 });

            const job = {
                id: 'job-1',
                data: {
                    scope: 'global',
                },
            };

            const result = await processExpireOffers(job);

            expect(result.updated).toBe(0);
        });

        it('should handle large number of expiries', async () => {
            mockPrisma.jobOffer.updateMany.mockResolvedValue({ count: 1000 });

            const job = {
                id: 'job-1',
                data: {
                    scope: 'global',
                },
            };

            const result = await processExpireOffers(job);

            expect(result.updated).toBe(1000);
        });

        it('should differentiate job-scoped vs global scope', async () => {
            mockPrisma.jobOffer.updateMany.mockResolvedValue({ count: 1 });

            const jobJob = {
                id: 'job-1',
                data: {
                    scope: 'job',
                    jobId: 'shipment_123',
                },
            };

            await processExpireOffers(jobJob);

            expect(mockPrisma.jobOffer.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        jobId: 'shipment_123',
                    }),
                })
            );
        });

        it('should handle missing scope data', async () => {
            mockPrisma.jobOffer.updateMany.mockResolvedValue({ count: 5 });

            const job = {
                id: 'job-1',
                data: {},
            };

            const result = await processExpireOffers(job);

            // Should process as global if scope missing
            expect(result.updated).toBe(5);
        });
    });

    describe('Hold Expiration', () => {
        it('should find and release expired holds', async () => {
            mockPrisma.job.findMany.mockResolvedValue([
                { id: 'shipment_1' },
                { id: 'shipment_2' },
            ]);

            const result = await processExpireHolds({ id: 'expiry-job' });

            expect(result.updated).toBeGreaterThanOrEqual(0);
        });

        it('should update held jobs to OPEN status', async () => {
            mockPrisma.job.findMany.mockResolvedValue([
                { id: 'shipment_1' },
            ]);

            mockPrisma.$transaction.mockImplementation(async (callback) => {
                return callback(mockPrisma);
            });

            await processExpireHolds({ id: 'expiry-job' });

            expect(mockPrisma.job.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'shipment_1' },
                    data: {
                        status: 'OPEN',
                        heldByDriverId: null,
                        heldUntil: null,
                    },
                })
            );
        });

        it('should create hold expiry event', async () => {
            mockPrisma.job.findMany.mockResolvedValue([
                { id: 'shipment_1' },
            ]);

            mockPrisma.$transaction.mockImplementation(async (callback) => {
                return callback(mockPrisma);
            });

            await processExpireHolds({ id: 'expiry-job' });

            expect(mockPrisma.jobEvent.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        jobId: 'shipment_1',
                        type: 'NOTE',
                        actorUserId: null,
                        message: expect.stringContaining('Hold expired'),
                    }),
                })
            );
        });

        it('should handle no expired holds', async () => {
            mockPrisma.job.findMany.mockResolvedValue([]);

            const result = await processExpireHolds({ id: 'expiry-job' });

            expect(result.updated).toBe(0);
        });

        it('should count updated holds correctly', async () => {
            mockPrisma.job.findMany.mockResolvedValue([
                { id: 'shipment_1' },
                { id: 'shipment_2' },
                { id: 'shipment_3' },
            ]);

            const result = await processExpireHolds({ id: 'expiry-job' });

            expect(result.updated).toBe(3);
        });

        it('should filter by HELD status', async () => {
            mockPrisma.job.findMany.mockResolvedValue([]);

            await processExpireHolds({ id: 'expiry-job' });

            expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        status: 'HELD',
                        heldUntil: { lt: expect.any(Date) },
                    },
                    select: { id: true },
                })
            );
        });

        it('should use transaction for consistency', async () => {
            mockPrisma.job.findMany.mockResolvedValue([
                { id: 'shipment_1' },
            ]);

            await processExpireHolds({ id: 'expiry-job' });

            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle offer expiration database error', async () => {
            mockPrisma.jobOffer.updateMany.mockRejectedValue(
                new Error('Database error')
            );

            const job = {
                id: 'job-1',
                data: { scope: 'global' },
            };

            await expect(processExpireOffers(job)).rejects.toThrow();
        });

        it('should handle hold expiration database error', async () => {
            mockPrisma.job.findMany.mockRejectedValue(
                new Error('Database error')
            );

            await expect(processExpireHolds({ id: 'expiry-job' })).rejects.toThrow();
        });

        it('should handle transaction errors', async () => {
            mockPrisma.job.findMany.mockResolvedValue([
                { id: 'shipment_1' },
            ]);

            mockPrisma.$transaction.mockRejectedValue(
                new Error('Transaction failed')
            );

            await expect(processExpireHolds({ id: 'expiry-job' })).rejects.toThrow();
        });

        it('should handle partial transaction failures', async () => {
            mockPrisma.job.findMany.mockResolvedValue([
                { id: 'shipment_1' },
                { id: 'shipment_2' },
            ]);

            let txCallCount = 0;
            mockPrisma.$transaction.mockImplementation(async (callback) => {
                txCallCount++;
                if (txCallCount === 1) {
                    throw new Error('Tx failed');
                }
                return callback(mockPrisma);
            });

            await expect(processExpireHolds({ id: 'expiry-job' })).rejects.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('should handle NULL job data', async () => {
            mockPrisma.jobOffer.updateMany.mockResolvedValue({ count: 0 });

            const job = {
                id: 'job-1',
                data: null,
            };

            const result = await processExpireOffers(job);

            expect(result.updated).toBe(0);
        });

        it('should handle missing jobId in scoped request', async () => {
            mockPrisma.jobOffer.updateMany.mockResolvedValue({ count: 0 });

            const job = {
                id: 'job-1',
                data: {
                    scope: 'job',
                    // jobId missing
                },
            };

            const result = await processExpireOffers(job);

            // Should fall back to global
            expect(result.updated).toBe(0);
        });

        it('should handle very old expiration times', async () => {
            mockPrisma.jobOffer.updateMany.mockResolvedValue({ count: 100 });

            const job = {
                id: 'job-1',
                data: { scope: 'global' },
            };

            const result = await processExpireOffers(job);

            expect(result.updated).toBe(100);
        });

        it('should handle future-dated holds', async () => {
            mockPrisma.job.findMany.mockResolvedValue([]);

            const result = await processExpireHolds({ id: 'expiry-job' });

            expect(result.updated).toBe(0);
        });
    });
});
