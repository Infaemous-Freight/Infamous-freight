/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Error Utilities Tests
 */

const {
  ApiError,
  ValidationError,
  createSuccessResponse,
  asyncHandler,
} = require('../../src/lib/errors');
const { HTTP_STATUS } = require('../../src/config/constants');

describe('Error Utilities', () => {
  describe('ApiError', () => {
    it('should create error with message and status code', () => {
      const error = new ApiError('Test error', HTTP_STATUS.BAD_REQUEST);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.timestamp).toBeDefined();
    });

    it('should serialize to JSON correctly', () => {
      const error = new ApiError('Test error', HTTP_STATUS.BAD_REQUEST);
      const json = error.toJSON();
      
      expect(json.error.message).toBe('Test error');
      expect(json.error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse(data);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const handler = asyncHandler(async (req, res) => {
        res.json({ success: true });
      });

      const req = {};
      const res = { json: jest.fn() };
      const next = jest.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch errors and pass to next', async () => {
      const testError = new Error('Test error');
      const handler = asyncHandler(async () => {
        throw testError;
      });

      const next = jest.fn();
      await handler({}, {}, next);

      expect(next).toHaveBeenCalledWith(testError);
    });
  });
});
