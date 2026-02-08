'use client';

import { useCallback, useRef } from 'react';
import { apiPatch } from '@/frontend/lib/fetcher';
import { API_ROUTES } from '@/shared/routes/api.routes';
import type { MessageWithSender, ConversationWithLead, ApiResponse } from '@/shared/types';
import type { KeyedMutator } from 'swr';

// ============================================
// useConversationSync
//
// Handles optimistic patching of conversations
// in the SWR cache and selection with read-marking.
// ============================================

export function useConversationSync(
  conversations: ConversationWithLead[],
  mutateConversations: KeyedMutator<ApiResponse<ConversationWithLead[]>>,
) {
  // Optimistic update: patch a single conversation in the SWR cache (no API call)
  const patchConversation = useCallback(
    (id: string, patch: Partial<ConversationWithLead>) => {
      mutateConversations(
        (current: ApiResponse<ConversationWithLead[]> | undefined) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: current.data.map((c) =>
              c.id === id ? { ...c, ...patch } : c,
            ),
          };
        },
        { revalidate: false },
      );
    },
    [mutateConversations],
  );

  // Ref to avoid capturing `conversations` in handleIncomingMessage deps
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // When a WebSocket message arrives, update conversation metadata locally
  const handleIncomingMessage = useCallback(
    (msg: MessageWithSender) => {
      const current = conversationsRef.current;
      patchConversation(msg.conversation_id, {
        message_count: (current.find((c) => c.id === msg.conversation_id)?.message_count ?? 0) + 1,
        last_message: msg.content,
        last_message_at: msg.created_at,
        ...(msg.sender_type === 'lead' && {
          unread_count: (current.find((c) => c.id === msg.conversation_id)?.unread_count ?? 0) + 1,
          is_read: false,
        }),
      });
    },
    [patchConversation],
  );

  // Select a conversation: optimistically clear unread + persist to DB
  const markAsRead = useCallback(
    (id: string) => {
      patchConversation(id, { unread_count: 0, is_read: true });
      apiPatch(API_ROUTES.conversations.messages(id)).catch(() => {});
    },
    [patchConversation],
  );

  return { handleIncomingMessage, markAsRead };
}
