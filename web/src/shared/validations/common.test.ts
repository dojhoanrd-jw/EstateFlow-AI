import { describe, it, expect } from 'vitest';
import { stripHtml, paginationMeta, uuidSchema, emailSchema, paginationSchema } from './common';

describe('stripHtml', () => {
  it('removes simple HTML tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold');
  });

  it('removes script tags (XSS prevention)', () => {
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('removes nested tags', () => {
    expect(stripHtml('<div><p>hello</p></div>')).toBe('hello');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtml('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('removes img tags with attributes', () => {
    expect(stripHtml('<img src="x" onerror="alert(1)">')).toBe('');
  });

  it('removes event handler attributes within tags', () => {
    expect(stripHtml('<div onmouseover="alert(1)">text</div>')).toBe('text');
  });
});

describe('paginationMeta', () => {
  it('calculates total_pages correctly', () => {
    expect(paginationMeta(100, 1, 20)).toEqual({
      total: 100,
      page: 1,
      limit: 20,
      total_pages: 5,
    });
  });

  it('rounds up partial pages', () => {
    expect(paginationMeta(21, 1, 20)).toEqual({
      total: 21,
      page: 1,
      limit: 20,
      total_pages: 2,
    });
  });

  it('handles zero results', () => {
    expect(paginationMeta(0, 1, 20)).toEqual({
      total: 0,
      page: 1,
      limit: 20,
      total_pages: 0,
    });
  });

  it('handles single item', () => {
    const result = paginationMeta(1, 1, 20);
    expect(result.total_pages).toBe(1);
  });
});

describe('uuidSchema', () => {
  it('accepts valid UUID', () => {
    expect(() => uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
  });

  it('rejects invalid UUID', () => {
    expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => uuidSchema.parse('')).toThrow();
  });
});

describe('emailSchema', () => {
  it('accepts valid email and lowercases it', () => {
    expect(emailSchema.parse('User@Example.COM')).toBe('user@example.com');
  });

  it('rejects email with leading/trailing whitespace (validated before transform)', () => {
    expect(() => emailSchema.parse('  user@test.com  ')).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => emailSchema.parse('not-an-email')).toThrow();
  });
});

describe('paginationSchema', () => {
  it('provides defaults when empty', () => {
    const result = paginationSchema.parse({});
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it('coerces string numbers', () => {
    const result = paginationSchema.parse({ page: '3', limit: '50' });
    expect(result).toEqual({ page: 3, limit: 50 });
  });

  it('rejects page < 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
  });

  it('rejects limit > 100', () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });
});
