import { conversationRepository } from './conversation.repository';
import { ApiError } from '@/backend/server/lib/api-error';
import { assertConversationAccess } from '@/backend/server/lib/assert-ownership';
import { paginationMeta } from '@/shared/validations/common';
import type { UserRole, ConversationWithLead, Conversation } from '@/shared/types';
import type {
  CreateConversationInput,
  UpdateConversationInput,
  ConversationFilters,
} from '@/shared/validations/schemas';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const conversationService = {
  /**
   * Get a paginated list of conversations.
   * Admins see all conversations; agents only see their own.
   */
  async getConversations(
    userId: string,
    role: UserRole,
    filters: ConversationFilters,
  ): Promise<{
    conversations: ConversationWithLead[];
    meta: ReturnType<typeof paginationMeta>;
  }> {
    const agentId = role === 'agent' ? userId : null;

    const [conversations, total] = await Promise.all([
      agentId
        ? conversationRepository.findByAgent(agentId, filters)
        : conversationRepository.findAll(filters),
      conversationRepository.countByFilters(agentId, filters),
    ]);

    return {
      conversations,
      meta: paginationMeta(total, filters.page, filters.limit),
    };
  },

  /**
   * Get a single conversation by ID with RBAC enforcement.
   */
  async getConversationById(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<ConversationWithLead> {
    const conversation = await conversationRepository.findById(id);

    if (!conversation) {
      throw ApiError.notFound('Conversation');
    }

    assertConversationAccess(conversation, userId, role);

    return conversation;
  },

  /**
   * Create a new conversation.
   */
  async createConversation(
    data: CreateConversationInput,
  ): Promise<Conversation> {
    return conversationRepository.create(data);
  },

  /**
   * Update a conversation with RBAC enforcement.
   * Agents can only update conversations assigned to them.
   */
  async updateConversation(
    id: string,
    data: UpdateConversationInput,
    userId: string,
    role: UserRole,
  ): Promise<Conversation> {
    // Verify existence and ownership before updating
    const existing = await conversationRepository.findById(id);

    if (!existing) {
      throw ApiError.notFound('Conversation');
    }

    assertConversationAccess(existing, userId, role);

    const updated = await conversationRepository.update(id, data);

    if (!updated) {
      throw ApiError.notFound('Conversation');
    }

    return updated;
  },

  /**
   * Archive a conversation (soft delete).
   */
  async archiveConversation(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<Conversation> {
    return this.updateConversation(id, { status: 'archived' }, userId, role);
  },
};
