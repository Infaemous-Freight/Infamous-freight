const request = require('supertest');
const express = require('express');
const voiceRoutes = require('../../src/routes/voice');
const jwt = require('jsonwebtoken');
const path = require('path');

describe('Voice Routes', () => {
    let app, validToken;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api', voiceRoutes);

        validToken = jwt.sign(
            { sub: 'user-123', scopes: ['voice:ingest', 'voice:command'] },
            process.env.JWT_SECRET
        );

        jest.clearAllMocks();
    });

    describe('POST /voice/ingest', () => {
        it('should reject without authentication', async () => {
            const response = await request(app)
                .post('/api/voice/ingest');

            expect(response.status).toBe(401);
        });

        it('should require voice:ingest scope', async () => {
            const noScopeToken = jwt.sign(
                { sub: 'user-123', scopes: [] },
                process.env.JWT_SECRET
            );

            const response = await request(app)
                .post('/api/voice/ingest')
                .set('Authorization', `Bearer ${noScopeToken}`);

            expect(response.status).toBe(403);
        });

        it('should reject request without file', async () => {
            const response = await request(app)
                .post('/api/voice/ingest')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('No audio file');
        });
    });

    describe('POST /voice/command', () => {
        it('should process voice command with valid text', async () => {
            const response = await request(app)
                .post('/api/voice/command')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ text: 'Create new shipment' });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.command).toBe('Create new shipment');
        });

        it('should require voice:command scope', async () => {
            const ingestOnlyToken = jwt.sign(
                { sub: 'user-123', scopes: ['voice:ingest'] },
                process.env.JWT_SECRET
            );

            const response = await request(app)
                .post('/api/voice/command')
                .set('Authorization', `Bearer ${ingestOnlyToken}`)
                .send({ text: 'Test' });

            expect(response.status).toBe(403);
        });

        it('should validate text field is required', async () => {
            const response = await request(app)
                .post('/api/voice/command')
                .set('Authorization', `Bearer ${validToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Text command is required');
        });

        it('should reject without authentication', async () => {
            const response = await request(app)
                .post('/api/voice/command')
                .send({ text: 'Test' });

            expect(response.status).toBe(401);
        });
    });
});
