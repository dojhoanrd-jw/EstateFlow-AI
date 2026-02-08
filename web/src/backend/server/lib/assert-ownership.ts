import { ApiError } from './api-error';
import type { UserRole } from '@/shared/types';

export function assertConversationAccess(
  conversation: { assigned_agent_id: string },
  userId: string,
  role: UserRole,
): void {
  if (role === 'admin') return;
  if (conversation.assigned_agent_id !== userId) {
    throw ApiError.forbidden('You do not have access to this conversation');
  }
}
