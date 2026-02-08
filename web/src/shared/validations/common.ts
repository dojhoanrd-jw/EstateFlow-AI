import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid ID format');

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255)
  .transform((v) => v.toLowerCase().trim());

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Strips HTML tags from a string. Used as a Zod `.transform()` to prevent
 * stored XSS in user-provided text content.
 */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
}
