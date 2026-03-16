import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from '../errors.ts';

describe('AppError hierarchy', () => {
  it('AppError sets statusCode and code', () => {
    const err = new AppError(418, "I'm a teapot", 'TEAPOT');
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('TEAPOT');
    expect(err.message).toBe("I'm a teapot");
    expect(err).toBeInstanceOf(Error);
  });

  it('ValidationError is 400', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('UnauthorizedError is 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
  });

  it('NotFoundError interpolates resource', () => {
    const err = new NotFoundError('Shipment');
    expect(err.message).toBe('Shipment not found');
    expect(err.statusCode).toBe(404);
  });
});
