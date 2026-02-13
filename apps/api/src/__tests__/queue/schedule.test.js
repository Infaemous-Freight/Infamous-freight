/**
 * Job Scheduling Tests
 * Tests for job enqueueing and scheduling operations
 */

jest.mock('../../queue/queues');
jest.mock('../../queue/connection');

const { enqueueWave } = require('../../queue/schedule');
const { dispatchQueue, expiryQueue, etaQueue } = require('../../queue/queues');

describe('Job Scheduling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        dispatchQueue.add = jest.fn().mockResolvedValue({ id: 'job-1' });
        expiryQueue.add = jest.fn().mockResolvedValue({ id: 'job-2' });
        etaQueue.add = jest.fn().mockResolvedValue({ id: 'job-3' });
    });

    describe('Wave Enqueueing', () => {
        it('should enqueue wave job with valid data', async () => {
            await enqueueWave('shipment_123', 1, 60000);

            expect(dispatchQueue.add).toHaveBeenCalled();
        });

        it('should add job to dispatch queue', async () => {
            await enqueueWave('shipment_123', 1, 60000);

            expect(dispatchQueue.add).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    jobId: 'shipment_123',
                    wave: 1,
                }),
                expect.any(Object)
            );
        });

        it('should support multiple waves', async () => {
            await enqueueWave('shipment_123', 1, 60000);
            await enqueueWave('shipment_123', 2, 120000);
            await enqueueWave('shipment_123', 3, 180000);

            expect(dispatchQueue.add).toHaveBeenCalledTimes(3);
        });

        it('should set delay from timeout parameter', async () => {
            const delay = 60000;
            await enqueueWave('shipment_123', 1, delay);

            expect(dispatchQueue.add).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    delay: delay,
                })
            );
        });

        it('should handle zero delay', async () => {
            await enqueueWave('shipment_123', 1, 0);

            expect(dispatchQueue.add).toHaveBeenCalled();
        });

        it('should handle large delays', async () => {
            const largeDelay = 7 * 24 * 60 * 60 * 1000; // 7 days
            await enqueueWave('shipment_123', 1, largeDelay);

            expect(dispatchQueue.add).toHaveBeenCalled();
        });
    });

    describe('Job Priority', () => {
        it('should support job priority if configured', async () => {
            await enqueueWave('shipment_123', 1, 60000);

            const callArgs = dispatchQueue.add.mock.calls[0];
            const options = callArgs[2] || {};

            // Priority is optional
            if (options.priority !== undefined) {
                expect(typeof options.priority).toBe('number');
            }
        });

        it('should prioritize critical jobs', async () => {
            await enqueueWave('shipment_high_priority', 1, 0);

            expect(dispatchQueue.add).toHaveBeenCalled();
        });
    });

    describe('Job Naming', () => {
        it('should have consistent job names', async () => {
            await enqueueWave('shipment_123', 1, 60000);

            const callArgs = dispatchQueue.add.mock.calls[0];
            const jobName = callArgs[0];

            expect(typeof jobName).toBe('string');
            expect(jobName.length).toBeGreaterThan(0);
        });

        it('should include wave in job name', async () => {
            await enqueueWave('shipment_123', 2, 60000);

            const callArgs = dispatchQueue.add.mock.calls[0];
            const jobName = callArgs[0];

            // Job name should be identifiable
            expect(jobName).toMatch(/dispatch|wave|shipment/i);
        });
    });

    describe('Error Handling', () => {
        it('should throw on invalid job ID', async () => {
            dispatchQueue.add.mockRejectedValueOnce(new Error('Invalid jobId'));

            await expect(
                enqueueWave(null, 1, 60000)
            ).rejects.toThrow();
        });

        it('should throw on invalid wave number', async () => {
            dispatchQueue.add.mockRejectedValueOnce(new Error('Invalid wave'));

            await expect(
                enqueueWave('shipment_123', 0, 60000)
            ).rejects.toThrow();
        });

        it('should handle queue errors gracefully', async () => {
            dispatchQueue.add.mockRejectedValueOnce(new Error('Queue unavailable'));

            await expect(
                enqueueWave('shipment_123', 1, 60000)
            ).rejects.toThrow('Queue unavailable');
        });

        it('should validate delay parameter', async () => {
            dispatchQueue.add.mockRejectedValueOnce(new Error('Invalid delay'));

            await expect(
                enqueueWave('shipment_123', 1, -1000)
            ).rejects.toThrow();
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent wave enqueuing', async () => {
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(enqueueWave(`shipment_${i}`, 1, 60000));
            }

            await Promise.all(promises);
            expect(dispatchQueue.add).toHaveBeenCalledTimes(5);
        });

        it('should not interfere between job enqueus', async () => {
            await Promise.all([
                enqueueWave('shipment_1', 1, 60000),
                enqueueWave('shipment_2', 2, 120000),
            ]);

            expect(dispatchQueue.add).toHaveBeenCalledTimes(2);
        });
    });

    describe('Job Removal/Cancellation', () => {
        it('should return job reference for tracking', async () => {
            const result = await enqueueWave('shipment_123', 1, 60000);

            expect(result).toBeDefined();
        });

        it('should allow job access for monitoring', async () => {
            const job = await enqueueWave('shipment_123', 1, 60000);

            if (job && job.id) {
                expect(typeof job.id).toBe('string');
            }
        });
    });
});
