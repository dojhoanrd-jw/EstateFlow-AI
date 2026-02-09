import { randomUUID } from 'node:crypto';
import { chatRepository } from './chat.repository';
import { messageRepository } from '@/backend/features/conversations/messages/message.repository';
import { ApiError } from '@/backend/server/lib/api-error';
import { paginationMeta } from '@/shared/validations/common';
import type { StartPublicChatInput, PublicChatMessageInput } from '@/shared/validations/schemas';
import type { MessageWithSender } from '@/shared/types';

export const chatService = {
  async startChat(data: StartPublicChatInput) {
    const chatToken = randomUUID();

    const result = await chatRepository.startChat({
      name: data.name,
      email: data.email,
      phone: data.phone,
      project_interest: data.project_interest,
      message: data.message,
      chatToken,
    });

    return {
      chat_token: result.chat_token,
      conversation_id: result.conversation_id,
      lead_id: result.lead_id,
    };
  },

  async sendMessage(
    token: string,
    data: PublicChatMessageInput,
  ): Promise<MessageWithSender> {
    const conversation = await chatRepository.findByToken(token);

    if (!conversation) {
      throw ApiError.notFound('Chat conversation');
    }

    if (conversation.status === 'archived') {
      throw ApiError.badRequest('This conversation has been archived');
    }

    const message = await chatRepository.insertMessage({
      conversationId: conversation.id,
      leadId: conversation.lead_id,
      content: data.content,
      contentType: data.content_type,
    });

    const senderName = await messageRepository.getSenderName(
      conversation.lead_id,
      'lead',
    );

    return {
      ...message,
      sender_name: senderName,
    };
  },

  async getMessages(token: string, page: number, limit: number) {
    const conversation = await chatRepository.findByToken(token);

    if (!conversation) {
      throw ApiError.notFound('Chat conversation');
    }

    const [messages, total] = await Promise.all([
      chatRepository.getMessages(token, page, limit),
      chatRepository.countMessages(token),
    ]);

    return {
      messages,
      conversation_id: conversation.id,
      meta: paginationMeta(total, page, limit),
    };
  },
};
