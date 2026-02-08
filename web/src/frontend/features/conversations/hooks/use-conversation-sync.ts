'use client';

import { useCallback, useRef } from 'react';
import { apiPatch } from '@/frontend/lib/fetcher';
import { API_ROUTES } from '@/shared/routes/api.routes';
import type { MessageWithSender, ConversationWithLead, ApiResponse } from '@/shared/types';
import type { KeyedMutator } from 'swr';

export function useConversationSync(
  conversations: ConversationWithLead[],
  mutateConversations: KeyedMutator<ApiResponse<ConversationWithLead[]>>,
) {
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

  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

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

  const markAsRead = useCallback(
    (id: string) => {
      patchConversation(id, { unread_count: 0, is_read: true });
      apiPatch(API_ROUTES.conversations.messages(id)).catch(() => {});
    },
    [patchConversation],
  );

  return { handleIncomingMessage, markAsRead };
}
