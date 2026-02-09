import { describe, it, expect } from 'vitest';
import { ApiError } from './api-error';

describe('ApiError', () => {
  it('creates instance with correct properties', () => {
    const error = new ApiError(400, 'Bad request', 'BAD_REQUEST');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad request');
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.name).toBe('ApiError');
  });

  describe('static factories', () => {
    it('badRequest returns 400', () => {
      const err = ApiError.badRequest('Invalid input');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
    });

    it('badRequest accepts custom code', () => {
      const err = ApiError.badRequest('Dup', 'DUPLICATE');
      expect(err.code).toBe('DUPLICATE');
    });

    it('unauthorized returns 401', () => {
      const err = ApiError.unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('Authentication required');
    });

    it('forbidden returns 403', () => {
      const err = ApiError.forbidden();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });

    it('notFound returns 404 with resource name', () => {
      const err = ApiError.notFound('Conversation');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Conversation not found');
      expect(err.code).toBe('NOT_FOUND');
    });

    it('notFound uses default resource name', () => {
      const err = ApiError.notFound();
      expect(err.message).toBe('Resource not found');
    });

    it('conflict returns 409', () => {
      const err = ApiError.conflict('Already exists');
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    });

    it('tooLarge returns 413', () => {
      const err = ApiError.tooLarge();
      expect(err.statusCode).toBe(413);
      expect(err.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it('internal returns 500', () => {
      const err = ApiError.internal();
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('INTERNAL_ERROR');
    });
  });
});
