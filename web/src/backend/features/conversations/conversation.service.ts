import { conversationRepository } from './conversation.repository';
import { ServiceError } from '@/backend/server/lib/service-error';
import { paginationMeta } from '@/shared/validations/common';
import type { UserRole, ConversationWithLead, Conversation } from '@/shared/types';
import type {
  CreateConversationInput,
  UpdateConversationInput,
  ConversationFilters,
} from '@/shared/validations/schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertAgentOwnership(
  conversation: ConversationWithLead,
  userId: string,
  role: UserRole,
): void {
  if (role === 'admin') return;
  if (conversation.assigned_agent_id !== userId) {
    throw ServiceError.forbidden('You do not have access to this conversation');
  }
}

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
      throw ServiceError.notFound('Conversation');
    }

    assertAgentOwnership(conversation, userId, role);

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
      throw ServiceError.notFound('Conversation');
    }

    assertAgentOwnership(existing, userId, role);

    const updated = await conversationRepository.update(id, data);

    if (!updated) {
      throw ServiceError.notFound('Conversation');
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
