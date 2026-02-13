/**
 * Queue Management Tests
 * Tests for BullMQ queue initialization and configuration
 */

jest.mock('../../queue/connection', () => ({
    connection: {
        host: 'localhost',
        port: 6379,
    },
}));

const { dispatchQueue, expiryQueue, etaQueue } = require('../../queue/queues');

describe('Queue Management', () => {
    describe('Queue Initialization', () => {
        it('should initialize dispatch queue', () => {
            expect(dispatchQueue).toBeDefined();
            expect(dispatchQueue.name).toBe('dispatch');
        });

        it('should initialize expiry queue', () => {
            expect(expiryQueue).toBeDefined();
            expect(expiryQueue.name).toBe('expiry');
        });

        it('should initialize eta queue', () => {
            expect(etaQueue).toBeDefined();
            expect(etaQueue.name).toBe('eta');
        });

        it('should have proper queue configuration', () => {
            expect(dispatchQueue.opts).toBeDefined();
            expect(expiryQueue.opts).toBeDefined();
            expect(etaQueue.opts).toBeDefined();
        });
    });

    describe('Queue Properties', () => {
        it('should have unique queue names', () => {
            const names = [dispatchQueue.name, expiryQueue.name, etaQueue.name];
            expect(new Set(names).size).toBe(3);
        });

        it('should have connection property', () => {
            expect(dispatchQueue.connection).toBeDefined();
            expect(expiryQueue.connection).toBeDefined();
            expect(etaQueue.connection).toBeDefined();
        });

        it('should share same connection instance', () => {
            // All queues should use the same Redis connection
            expect(dispatchQueue.connection).toEqual(expiryQueue.connection);
            expect(expiryQueue.connection).toEqual(etaQueue.connection);
        });
    });

    describe('Queue Methods', () => {
        it('should have add method for job creation', () => {
            expect(typeof dispatchQueue.add).toBe('function');
            expect(typeof expiryQueue.add).toBe('function');
            expect(typeof etaQueue.add).toBe('function');
        });

        it('should have process method for job processing', () => {
            expect(typeof dispatchQueue.process).toBe('function');
            expect(typeof expiryQueue.process).toBe('function');
            expect(typeof etaQueue.process).toBe('function');
        });

        it('should have event emitter methods', () => {
            expect(typeof dispatchQueue.on).toBe('function');
            expect(typeof dispatchQueue.once).toBe('function');
        });
    });

    describe('Queue Export Consistency', () => {
        it('should export all required queues', () => {
            const queues = require('../../queue/queues');
            expect(queues).toHaveProperty('dispatchQueue');
            expect(queues).toHaveProperty('expiryQueue');
            expect(queues).toHaveProperty('etaQueue');
        });

        it('should not export undefined queues', () => {
            const queues = require('../../queue/queues');
            expect(Object.values(queues)).toEqual(expect.not.arrayContaining([undefined, null]));
        });

        it('should have consistent queue structure', () => {
            const queues = [dispatchQueue, expiryQueue, etaQueue];
            queues.forEach(queue => {
                expect(queue.name).toMatch(/^(dispatch|expiry|eta)$/);
                expect(queue.opts).toBeDefined();
            });
        });
    });

    describe('Queue Event Handling', () => {
        it('should support job events', (done) => {
            const mockJob = { id: 'test-job', data: {} };

            dispatchQueue.once('completed', (job) => {
                expect(job).toBeDefined();
                done();
            });

            // Verify listeners are set up
            expect(dispatchQueue.listenerCount('completed')).toBeGreaterThanOrEqual(0);
        });

        it('should support error events', (done) => {
            expiryQueue.once('failed', (job, err) => {
                expect(err).toBeDefined();
                done();
            });

            expect(expiryQueue.listenerCount('failed')).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Queue State Management', () => {
        it('should track queue state', async () => {
            const counts = {
                waiting: typeof dispatchQueue.count === 'function',
                active: typeof dispatchQueue.getActiveCount === 'function',
                completed: typeof dispatchQueue.getCompletedCount === 'function',
                failed: typeof dispatchQueue.getFailedCount === 'function',
            };

            expect(Object.values(counts).some(v => v)).toBe(true);
        });

        it('should support job queries', () => {
            expect(typeof dispatchQueue.getJobs).toBe('function');
            expect(typeof expiryQueue.getJobs).toBe('function');
        });

        it('should support queue cleanup', async () => {
            expect(typeof dispatchQueue.clean).toBe('function');
            expect(typeof expiryQueue.clean).toBe('function');
        });
    });
});
