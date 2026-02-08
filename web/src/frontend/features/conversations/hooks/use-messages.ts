'use client';

import { useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { API_ROUTES } from '@/shared/routes/api.routes';
import { apiPost } from '@/frontend/lib/fetcher';
import type { MessageWithSender, ApiResponse } from '@/shared/types';
import { useSocket } from './use-socket';

// ============================================
// useMessages hook (WebSocket-powered)
// ============================================

export function useMessages(conversationId: string | null) {
  const url = conversationId
    ? API_ROUTES.conversations.messages(conversationId)
    : null;

  // Fetch initial message history via REST (no polling)
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<MessageWithSender[]>>(
    url,
    {
      revalidateOnFocus: true,
    },
  );

  // Real WebSocket connection for live updates
  const { isConnected, onMessage } = useSocket(conversationId);

  // Listen for new messages arriving via WebSocket
  useEffect(() => {
    onMessage((newMsg: MessageWithSender) => {
      mutate(
        (currentData) => {
          const existing = currentData?.data ?? [];
          // Avoid duplicates (by id) and replace optimistic temp messages
          const filtered = existing.filter(
            (m) => m.id !== newMsg.id && !m.id.startsWith('temp-'),
          );
          return { data: [...filtered, newMsg] };
        },
        { revalidate: false },
      );
    });
  }, [onMessage, mutate]);

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
    isConnected,
    mutate,
    sendMessage,
  };
}
