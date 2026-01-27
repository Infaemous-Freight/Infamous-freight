const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const healthRoutes = require('../../src/routes/health');

// Mock dependencies
jest.mock('../../src/db/prisma', () => ({
    prisma: {
        $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    },
}));

const { prisma } = require('../../src/db/prisma');

describe('Health Routes', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api', healthRoutes);
        jest.clearAllMocks();
    });

    describe('GET /health', () => {
        it('should return basic health status', async () => {
            const response = await request(app).get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                status: 'ok',
                service: 'infamous-freight-api',
                environment: expect.any(String),
            });
            expect(response.body.uptime).toBeGreaterThan(0);
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('GET /health/detailed', () => {
        it('should return detailed health with all services healthy', async () => {
            prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

            const response = await request(app).get('/api/health/detailed');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                status: 'healthy',
                service: 'infamous-freight-api',
                checks: {
                    api: { status: 'healthy' },
                    database: { status: 'healthy' },
                    cache: { status: 'healthy' },
                    websocket: { status: 'healthy' },
                },
            });
        });

        it('should return degraded status when database fails', async () => {
            prisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app).get('/api/health/detailed');

            expect(response.status).toBe(503);
            expect(response.body.status).toBe('unhealthy');
            expect(response.body.checks.database.status).toBe('unhealthy');
        });
    });

    describe('GET /health/ready', () => {
        it('should return ready when database is connected', async () => {
            prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

            const response = await request(app).get('/api/health/ready');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({ status: 'ready' });
            expect(response.body.timestamp).toBeDefined();
        });

        it('should return not ready when database fails', async () => {
            prisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

            const response = await request(app).get('/api/health/ready');

            expect(response.status).toBe(503);
            expect(response.body.status).toBe('not ready');
        });
    });

    describe('GET /health/live', () => {
        it('should return alive status', async () => {
            const response = await request(app).get('/api/health/live');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ status: 'alive' });
        });
    });
});
