/**
 * ETA Processor Tests
 * Tests for estimated time arrival calculation and caching
 */

jest.mock('@prisma/client');
jest.mock('../../mapbox/eta');
jest.mock('../../queue/redis');

const { processEta } = require('../../worker/processors/eta');
const { etaToPickupSeconds } = require('../../mapbox/eta');

describe('ETA Processor', () => {
    let mockJob;
    let mockPrisma;
    let mockRedis;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRedis = {
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn().mockResolvedValue(null),
        };

        mockPrisma = {
            job: {
                findUnique: jest.fn(),
            },
            user: {
                findMany: jest.fn(),
            },
        };

        require('@prisma/client').PrismaClient.mockImplementation(() => mockPrisma);
        require('../../queue/redis').redisConnection.mockReturnValue(mockRedis);

        mockJob = {
            id: 'job-1',
            data: {
                jobId: 'shipment_123',
                candidateDriverIds: ['driver_1', 'driver_2', 'driver_3'],
            },
        };

        etaToPickupSeconds.mockResolvedValue([300, 600, 900]);
    });

    describe('Job Processing', () => {
        it('should process ETA job successfully', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                pickupLat: 40.7128,
                pickupLng: -74.0060,
            });

            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    driverProfile: { lastLat: 40.7150, lastLng: -74.0070 },
                },
                {
                    id: 'driver_2',
                    driverProfile: { lastLat: 40.7100, lastLng: -74.0050 },
                },
                {
                    id: 'driver_3',
                    driverProfile: { lastLat: 40.7200, lastLng: -74.0100 },
                },
            ]);

            const result = await processEta(mockJob);

            expect(result.ok).toBe(true);
            expect(result.count).toBe(3);
        });

        it('should handle missing job', async () => {
            mockPrisma.job.findUnique.mockResolvedValue(null);

            const result = await processEta(mockJob);

            expect(result.skipped).toBe(true);
            expect(result.reason).toBe('JOB_NOT_FOUND');
        });

        it('should filter inactive drivers', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                pickupLat: 40.7128,
                pickupLng: -74.0060,
            });

            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    driverProfile: { lastLat: 40.7150, lastLng: -74.0070 },
                },
            ]);

            etaToPickupSeconds.mockResolvedValue([300]);

            const result = await processEta(mockJob);

            expect(result.count).toBe(1);
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        driverProfile: expect.objectContaining({
                            isActive: true,
                        }),
                    }),
                })
            );
        });
    });

    describe('Coordinate Calculation', () => {
        beforeEach(() => {
            mockPrisma.job.findUnique.mockResolvedValue({
                pickupLat: 40.7128,
                pickupLng: -74.0060,
            });
        });

        it('should collect driver coordinates', async () => {
            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    driverProfile: { lastLat: 40.7150, lastLng: -74.0070 },
                },
                {
                    id: 'driver_2',
                    driverProfile: { lastLat: 40.7100, lastLng: -74.0050 },
                },
            ]);

            etaToPickupSeconds.mockResolvedValue([300, 600]);

            await processEta(mockJob);

            expect(etaToPickupSeconds).toHaveBeenCalledWith(
                expect.objectContaining({
                    pickup: { lat: 40.7128, lng: -74.0060 },
                    drivers: expect.arrayContaining([
                        { lat: 40.7150, lng: -74.0070 },
                        { lat: 40.7100, lng: -74.0050 },
                    ]),
                })
            );
        });

        it('should handle no candidate drivers', async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);

            const result = await processEta(mockJob);

            expect(result.count).toBe(0);
        });

        it('should handle partial coordinates', async () => {
            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    driverProfile: { lastLat: 40.7150, lastLng: -74.0070 },
                },
            ]);

            etaToPickupSeconds.mockResolvedValue([300]);

            const result = await processEta(mockJob);

            expect(result.ok).toBe(true);
        });
    });

    describe('ETA Caching', () => {
        beforeEach(() => {
            mockPrisma.job.findUnique.mockResolvedValue({
                pickupLat: 40.7128,
                pickupLng: -74.0060,
            });

            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    driverProfile: { lastLat: 40.7150, lastLng: -74.0070 },
                },
            ]);

            etaToPickupSeconds.mockResolvedValue([300]);
        });

        it('should cache ETA results in Redis', async () => {
            await processEta(mockJob);

            expect(mockRedis.set).toHaveBeenCalled();
        });

        it('should use correct Redis key format', async () => {
            await processEta(mockJob);

            expect(mockRedis.set).toHaveBeenCalledWith(
                expect.stringMatching(/^eta:job:/),
                expect.any(String),
                'EX',
                expect.any(Number)
            );
        });

        it('should store ETA map as JSON', async () => {
            await processEta(mockJob);

            const callArgs = mockRedis.set.mock.calls[0];
            const jsonData = callArgs[1];

            expect(() => JSON.parse(jsonData)).not.toThrow();
            const data = JSON.parse(jsonData);
            expect(data).toHaveProperty('driver_1', 300);
        });

        it('should set TTL from environment', async () => {
            process.env.MAPBOX_ETA_CACHE_TTL_SECONDS = '60';

            await processEta(mockJob);

            expect(mockRedis.set).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                'EX',
                60
            );
        });

        it('should use default TTL if not configured', async () => {
            delete process.env.MAPBOX_ETA_CACHE_TTL_SECONDS;

            await processEta(mockJob);

            expect(mockRedis.set).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                'EX',
                30
            );
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors', async () => {
            mockPrisma.job.findUnique.mockRejectedValue(
                new Error('Database error')
            );

            await expect(processEta(mockJob)).rejects.toThrow();
        });

        it('should handle ETA calculation errors', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                pickupLat: 40.7128,
                pickupLng: -74.0060,
            });

            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    driverProfile: { lastLat: 40.7150, lastLng: -74.0070 },
                },
            ]);

            etaToPickupSeconds.mockRejectedValue(
                new Error('ETA calculation failed')
            );

            await expect(processEta(mockJob)).rejects.toThrow();
        });

        it('should handle Redis cache errors', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                pickupLat: 40.7128,
                pickupLng: -74.0060,
            });

            mockPrisma.user.findMany.mockResolvedValue([
                {
                    id: 'driver_1',
                    driverProfile: { lastLat: 40.7150, lastLng: -74.0070 },
                },
            ]);

            etaToPickupSeconds.mockResolvedValue([300]);

            mockRedis.set.mockRejectedValue(new Error('Redis error'));

            await expect(processEta(mockJob)).rejects.toThrow();
        });

        it('should handle invalid coordinates', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                pickupLat: null,
                pickupLng: null,
            });

            mockPrisma.user.findMany.mockResolvedValue([]);

            const result = await processEta(mockJob);

            expect(result).toBeDefined();
        });
    });

    describe('Data Mapping', () => {
        it('should create driver to ETA mapping', async () => {
            mockPrisma.job.findUnique.mockResolvedValue({
                pickupLat: 40.7128,
                pickupLng: -74.0060,
            });

            mockPrisma.user.findMany.mockResolvedValue([
                { id: 'driver_1', driverProfile: { lastLat: 40.7150, lastLng: -74.0070 } },
                { id: 'driver_2', driverProfile: { lastLat: 40.7100, lastLng: -74.0050 } },
            ]);

            etaToPickupSeconds.mockResolvedValue([300, 600]);

            await processEta(mockJob);

            const callArgs = mockRedis.set.mock.calls[0];
            const jsonData = JSON.parse(callArgs[1]);

            expect(jsonData).toEqual({
                driver_1: 300,
                driver_2: 600,
            });
        });
    });
});
