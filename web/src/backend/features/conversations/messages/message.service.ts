import { messageRepository } from './message.repository';
import { conversationRepository } from '@/backend/features/conversations/conversation.repository';
import { ApiError } from '@/backend/server/lib/api-error';
import { assertConversationAccess } from '@/backend/server/lib/assert-ownership';
import { paginationMeta } from '@/shared/validations/common';
import type { UserRole, MessageWithSender } from '@/shared/types';
import type { CreateMessageInput } from '@/shared/validations/schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a conversation and verify the authenticated user has access.
 * Returns the conversation so callers don't need to re-fetch.
 */
async function verifyConversationAccess(
  conversationId: string,
  userId: string,
  role: UserRole,
) {
  const conversation = await conversationRepository.findById(conversationId);

  if (!conversation) {
    throw ApiError.notFound('Conversation');
  }

  assertConversationAccess(conversation, userId, role);

  return conversation;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const messageService = {
  /**
   * Get paginated messages for a conversation after verifying access.
   */
  async getMessages(
    conversationId: string,
    userId: string,
    role: UserRole,
    page: number,
    limit: number,
  ): Promise<{
    messages: MessageWithSender[];
    meta: ReturnType<typeof paginationMeta>;
  }> {
    await verifyConversationAccess(conversationId, userId, role);

    const [messages, total] = await Promise.all([
      messageRepository.findByConversation(conversationId, page, limit),
      messageRepository.countTotal(conversationId),
    ]);

    return {
      messages,
      meta: paginationMeta(total, page, limit),
    };
  },

  /**
   * Send a new message to a conversation.
   * Determines the sender_type from the authenticated user's role:
   *  - Agents send as 'agent'
   *  - This endpoint is only for agents; leads message via other channels.
   *
   * Returns the message enriched with the sender's display name.
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    role: UserRole,
    data: CreateMessageInput,
  ): Promise<MessageWithSender> {
    await verifyConversationAccess(conversationId, userId, role);

    const senderType = 'agent' as const;

    const message = await messageRepository.create({
      conversation_id: conversationId,
      sender_type: senderType,
      sender_id: userId,
      content: data.content,
      content_type: data.content_type,
    });

    const senderName = await messageRepository.getSenderName(
      userId,
      senderType,
    );

    return {
      ...message,
      sender_name: senderName,
    };
  },

  /**
   * Mark all messages in a conversation as read for the authenticated user.
   * Agents mark lead-sent messages as read; the reverse would apply for leads.
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    await verifyConversationAccess(conversationId, userId, role);

    // Agents read messages from leads
    const readerSenderType = 'agent' as const;

    await messageRepository.markAsRead(conversationId, readerSenderType);
  },
};
