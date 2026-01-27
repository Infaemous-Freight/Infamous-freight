const request = require('supertest');
const express = require('express');
const aiSimRoutes = require('../../src/routes/aiSim.internal');

describe('AI Simulator Internal Routes', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/internal', aiSimRoutes);
        jest.clearAllMocks();
    });

    describe('GET /ai/simulate', () => {
        it('should return synthetic AI response', async () => {
            const response = await request(app)
                .get('/internal/ai/simulate')
                .query({ prompt: 'Test prompt' });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.prompt).toBe('Test prompt');
            expect(response.body.completion).toContain('Test prompt');
            expect(response.body.model).toBe('synthetic-v1');
        });

        it('should require prompt parameter', async () => {
            const response = await request(app)
                .get('/internal/ai/simulate');

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Prompt is required');
        });

        it('should not require authentication (internal)', async () => {
            const response = await request(app)
                .get('/internal/ai/simulate')
                .query({ prompt: 'Test' });

            expect(response.status).toBe(200);
        });
    });

    describe('POST /ai/batch', () => {
        it('should process batch prompts', async () => {
            const prompts = ['Prompt 1', 'Prompt 2', 'Prompt 3'];

            const response = await request(app)
                .post('/internal/ai/batch')
                .send({ prompts });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.results).toHaveLength(3);
            expect(response.body.count).toBe(3);
            expect(response.body.results[0]).toMatchObject({
                index: 0,
                prompt: 'Prompt 1',
                model: 'synthetic-v1',
            });
        });

        it('should validate prompts is an array', async () => {
            const response = await request(app)
                .post('/internal/ai/batch')
                .send({ prompts: 'not-an-array' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('array');
        });

        it('should require prompts field', async () => {
            const response = await request(app)
                .post('/internal/ai/batch')
                .send({});

            expect(response.status).toBe(400);
        });

        it('should handle empty prompts array', async () => {
            const response = await request(app)
                .post('/internal/ai/batch')
                .send({ prompts: [] });

            expect(response.status).toBe(200);
            expect(response.body.results).toHaveLength(0);
        });
    });
});
