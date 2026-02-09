import { ApiError } from './api-error';
import type { UserRole } from '@/shared/types';

/**
 * Assert read access — agents can view unassigned conversations but not other agents' conversations.
 */
export function assertConversationAccess(
  conversation: { assigned_agent_id: string | null },
  userId: string,
  role: UserRole,
): void {
  if (role === 'admin') return;
  // Agents can read unassigned conversations (to preview before claiming)
  if (conversation.assigned_agent_id === null) return;
  if (conversation.assigned_agent_id !== userId) {
    throw ApiError.forbidden('You do not have access to this conversation');
  }
}

/**
 * Assert write access — agents must own or claim the conversation before sending messages.
 */
export function assertConversationWriteAccess(
  conversation: { assigned_agent_id: string | null },
  userId: string,
  role: UserRole,
): void {
  if (role === 'admin') return;
  if (conversation.assigned_agent_id === null) {
    throw ApiError.forbidden('This conversation is unassigned. Claim it first.');
  }
  if (conversation.assigned_agent_id !== userId) {
    throw ApiError.forbidden('You do not have access to this conversation');
  }
}
