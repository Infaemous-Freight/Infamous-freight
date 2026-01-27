/*
 * Validation Middleware Tests
 * Comprehensive coverage for request validation
 */

const request = require('supertest');
const express = require('express');
const {
  validateString,
  validateEmail,
  validatePhone,
  validateUUID,
  handleValidationErrors,
} = require('../../middleware/validation');

describe('Validation Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Test routes
    app.post(
      '/api/text',
      validateString('text'),
      handleValidationErrors,
      (_req, res) => {
        res.json({ ok: true });
      }
    );

    app.post(
      '/api/email',
      validateEmail(),
      handleValidationErrors,
      (_req, res) => {
        res.json({ ok: true });
      }
    );

    app.post(
      '/api/phone',
      validatePhone(),
      handleValidationErrors,
      (_req, res) => {
        res.json({ ok: true });
      }
    );

    app.get(
      '/api/users/:id',
      validateUUID('id'),
      handleValidationErrors,
      (_req, res) => {
        res.json({ ok: true, id: _req.params.id });
      }
    );

    app.post(
      '/api/message',
      validateString('message', { maxLength: 100 }),
      handleValidationErrors,
      (_req, res) => {
        res.json({ ok: true });
      }
    );
  });

  describe('validateString', () => {
    test('should accept valid string', async () => {
      const res = await request(app)
        .post('/api/text')
        .send({ text: 'Hello World' });

      expect(res.status).toBe(200);
    });

    test('should reject empty string', async () => {
      const res = await request(app)
        .post('/api/text')
        .send({ text: '' });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('not be empty'),
          }),
        ])
      );
    });

    test('should reject non-string values', async () => {
      const res = await request(app)
        .post('/api/text')
        .send({ text: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('must be a string'),
          }),
        ])
      );
    });

    test('should trim whitespace', async () => {
      const res = await request(app)
        .post('/api/text')
        .send({ text: '  hello  ' });

      expect(res.status).toBe(200);
    });

    test('should enforce maxLength', async () => {
      const longMessage = 'x'.repeat(101);

      const res = await request(app)
        .post('/api/message')
        .send({ message: longMessage });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('too long'),
          }),
        ])
      );
    });

    test('should accept strings at maxLength boundary', async () => {
      const exactMessage = 'x'.repeat(100);

      const res = await request(app)
        .post('/api/message')
        .send({ message: exactMessage });

      expect(res.status).toBe(200);
    });

    test('should use default maxLength of 1000', async () => {
      const longString = 'x'.repeat(1000);

      const res = await request(app)
        .post('/api/text')
        .send({ text: longString });

      expect(res.status).toBe(200);
    });

    test('should reject strings exceeding default maxLength', async () => {
      const tooLong = 'x'.repeat(1001);

      const res = await request(app)
        .post('/api/text')
        .send({ text: tooLong });

      expect(res.status).toBe(400);
    });
  });

  describe('validateEmail', () => {
    test('should accept valid email', async () => {
      const res = await request(app)
        .post('/api/email')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
    });

    test('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
      ];

      for (const email of invalidEmails) {
        const res = await request(app)
          .post('/api/email')
          .send({ email });

        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: expect.stringContaining('Invalid email'),
            }),
          ])
        );
      }
    });

    test('should normalize email addresses', async () => {
      const res = await request(app)
        .post('/api/email')
        .send({ email: '  TEST@EXAMPLE.COM  ' });

      expect(res.status).toBe(200);
    });

    test('should accept complex but valid emails', async () => {
      const validEmails = [
        'user+tag@example.co.uk',
        'user.name@example.com',
        'user_name@example.com',
      ];

      for (const email of validEmails) {
        const res = await request(app)
          .post('/api/email')
          .send({ email });

        expect(res.status).toBe(200);
      }
    });
  });

  describe('validatePhone', () => {
    test('should accept valid phone numbers', async () => {
      const validPhones = [
        '+1234567890',
        '+1 (234) 567-8900',
        '1234567890',
      ];

      for (const phone of validPhones) {
        const res = await request(app)
          .post('/api/phone')
          .send({ phone });

        expect(res.status).toBe(200);
      }
    });

    test('should reject invalid phone numbers', async () => {
      const invalidPhones = [
        '123', // too short
        'notaphone',
        '(incomplete)',
      ];

      for (const phone of invalidPhones) {
        const res = await request(app)
          .post('/api/phone')
          .send({ phone });

        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: expect.stringContaining('Invalid phone'),
            }),
          ])
        );
      }
    });
  });

  describe('validateUUID', () => {
    test('should accept valid UUID', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';

      const res = await request(app).get(`/api/users/${uuid}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(uuid);
    });

    test('should reject invalid UUID formats', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-41d4',
        '12345678901234567890',
      ];

      for (const id of invalidUUIDs) {
        const res = await request(app).get(`/api/users/${id}`);

        expect(res.status).toBe(400);
        expect(res.body.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: expect.stringContaining('Invalid UUID'),
            }),
          ])
        );
      }
    });

    test('should accept UUIDs with different cases', async () => {
      const uuid = '550E8400-E29B-41D4-A716-446655440000';

      const res = await request(app).get(`/api/users/${uuid}`);

      expect(res.status).toBe(200);
    });
  });

  describe('handleValidationErrors', () => {
    test('should return 400 when validation fails', async () => {
      const res = await request(app)
        .post('/api/text')
        .send({ text: '' });

      expect(res.status).toBe(400);
    });

    test('should format error response correctly', async () => {
      const res = await request(app)
        .post('/api/text')
        .send({ text: 12345 });

      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    test('should include field names in error details', async () => {
      const res = await request(app)
        .post('/api/text')
        .send({ text: '' });

      expect(res.body.details[0]).toHaveProperty('field');
      expect(res.body.details[0]).toHaveProperty('msg');
    });

    test('should not interfere with valid requests', async () => {
      const res = await request(app)
        .post('/api/text')
        .send({ text: 'valid' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('should pass to next when no errors', async () => {
      const res = await request(app)
        .post('/api/text')
        .send({ text: 'Hello' });

      expect(res.status).toBe(200);
    });
  });

  describe('Error message clarity', () => {
    test('should provide helpful error messages', async () => {
      const res = await request(app)
        .post('/api/text')
        .send({ text: '' });

      const errorMsg = res.body.details[0].msg;
      expect(errorMsg.length).toBeGreaterThan(0);
      expect(errorMsg).toBeTruthy();
    });

    test('should indicate which field failed', async () => {
      const res = await request(app)
        .post('/api/email')
        .send({ email: 'invalid' });

      expect(res.body.details[0].field).toBe('email');
    });
  });
});
