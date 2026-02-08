'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { API_ROUTES } from '@/shared/routes/api.routes';
import { apiPost } from '@/frontend/lib/fetcher';
import type { MessageWithSender, ApiResponse } from '@/shared/types';

// ============================================
// useMessages hook
// ============================================

export function useMessages(conversationId: string | null) {
  const url = conversationId
    ? API_ROUTES.conversations.messages(conversationId)
    : null;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<MessageWithSender[]>>(
    url,
    {
      refreshInterval: 3000,
      revalidateOnFocus: true,
    },
  );

  // ----------------------------------------
  // Send a new message with optimistic update
  // ----------------------------------------

  const sendMessage = useCallback(
    async (content: string, contentType: 'text' | 'image' = 'text') => {
      if (!conversationId) return;

      const endpoint = API_ROUTES.conversations.messages(conversationId);

      // Optimistic update: append the new message immediately
      const optimisticMessage: MessageWithSender = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_type: 'agent',
        sender_id: 'current-user',
        sender_name: 'You',
        content,
        content_type: contentType,
        is_read: true,
        created_at: new Date().toISOString(),
      };

      await mutate(
        async (currentData) => {
          const response = await apiPost<ApiResponse<MessageWithSender>>(endpoint, {
            content,
            content_type: contentType,
          });

          const existingMessages = currentData?.data ?? [];

          return {
            data: [
              ...existingMessages.filter((m) => m.id !== optimisticMessage.id),
              response.data,
            ],
          };
        },
        {
          optimisticData: (currentData) => ({
            data: [...(currentData?.data ?? []), optimisticMessage],
          }),
          rollbackOnError: true,
          revalidate: false,
        },
      );
    },
    [conversationId, mutate],
  );

  return {
    messages: data?.data ?? [],
    isLoading,
    error,
    mutate,
    sendMessage,
  };
}
