import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  content_type: z.enum(['text', 'image']).default('text'),
});

export const createConversationSchema = z.object({
  lead_id: z.string().uuid(),
  assigned_agent_id: z.string().uuid(),
});

export const updateConversationSchema = z.object({
  status: z.enum(['active', 'archived']).optional(),
  is_read: z.boolean().optional(),
  ai_summary: z.string().optional(),
  ai_priority: z.enum(['high', 'medium', 'low']).optional(),
  ai_tags: z.array(z.string()).optional(),
});

export const conversationFiltersSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']).optional(),
  tag: z.string().optional(),
  status: z.enum(['active', 'archived']).default('active'),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createLeadSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).optional(),
  project_interest: z.string().max(255).optional(),
  source: z.string().max(100).optional(),
  budget: z.number().positive().optional(),
  notes: z.string().optional(),
  assigned_agent_id: z.string().uuid().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const createUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  password: z.string().min(6),
  role: z.enum(['admin', 'agent']).default('agent'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(255).optional(),
  role: z.enum(['admin', 'agent']).optional(),
  is_active: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type ConversationFilters = z.infer<typeof conversationFiltersSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
