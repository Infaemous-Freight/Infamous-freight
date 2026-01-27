const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const aiRoutes = require('../../src/routes/ai.commands');

describe('AI Routes', () => {
    let app, validToken;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api', aiRoutes);

        validToken = jwt.sign(
            { sub: 'user-123', scopes: ['ai:command', 'ai:history'] },
            process.env.JWT_SECRET
        );

        jest.clearAllMocks();
    });

    describe('POST /ai/command', () => {
        it('should process AI command with valid authentication', async () => {
            const response = await request(app)
                .post('/api/ai/command')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ command: 'Test command' });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.command).toBe('Test command');
        });

        it('should reject without authentication', async () => {
            const response = await request(app)
                .post('/api/ai/command')
                .send({ command: 'Test' });

            expect(response.status).toBe(401);
        });

        it('should reject without ai:command scope', async () => {
            const noScopeToken = jwt.sign(
                { sub: 'user-123', scopes: [] },
                process.env.JWT_SECRET
            );

            const response = await request(app)
                .post('/api/ai/command')
                .set('Authorization', `Bearer ${noScopeToken}`)
                .send({ command: 'Test' });

            expect(response.status).toBe(403);
        });

        it('should validate command field is required', async () => {
            const response = await request(app)
                .post('/api/ai/command')
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
        });

        it('should validate command max length', async () => {
            const response = await request(app)
                .post('/api/ai/command')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ command: 'a'.repeat(501) });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /ai/history', () => {
        it('should return AI history with valid authentication', async () => {
            const response = await request(app)
                .get('/api/ai/history')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.history).toBeDefined();
            expect(Array.isArray(response.body.history)).toBe(true);
        });

        it('should require ai:history scope', async () => {
            const commandOnlyToken = jwt.sign(
                { sub: 'user-123', scopes: ['ai:command'] },
                process.env.JWT_SECRET
            );

            const response = await request(app)
                .get('/api/ai/history')
                .set('Authorization', `Bearer ${commandOnlyToken}`);

            expect(response.status).toBe(403);
        });
    });
});
