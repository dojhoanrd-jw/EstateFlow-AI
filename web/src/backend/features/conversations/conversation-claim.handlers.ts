import { withAuth, type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { apiSuccess, apiError } from '@/backend/server/lib/api-response';
import { conversationRepository } from './conversation.repository';
import { ApiError } from '@/backend/server/lib/api-error';
import { uuidSchema } from '@/shared/validations/common';
import { broadcastToConversation } from '@/backend/server/socket/io';
import type { RouteContext } from '@/shared/types';

export const POST = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: rawId } = await context.params;
    const conversationId = uuidSchema.parse(rawId);

    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw ApiError.notFound('Conversation');
    }

    if (conversation.assigned_agent_id !== null) {
      throw ApiError.conflict('Conversation is already assigned to an agent');
    }

    const updated = await conversationRepository.claimConversation(
      conversationId,
      req.user.id,
    );

    if (!updated) {
      throw ApiError.conflict('Conversation was just claimed by another agent');
    }

    broadcastToConversation(conversationId, 'conversation_claimed', {
      conversation_id: conversationId,
      agent_id: req.user.id,
      agent_name: req.user.name,
    });

    return apiSuccess(updated);
  } catch (error) {
    return apiError(error);
  }
});
