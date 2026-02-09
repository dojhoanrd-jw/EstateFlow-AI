'use client';

import { useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { API_ROUTES } from '@/shared/routes/api.routes';
import { apiPost } from '@/frontend/lib/fetcher';
import type { MessageWithSender, ApiResponse } from '@/shared/types';
import { useSocket } from './use-socket';

export function useMessages(
  conversationId: string | null,
  onIncomingMessage?: (msg: MessageWithSender) => void,
) {
  const onIncomingRef = useRef(onIncomingMessage);
  onIncomingRef.current = onIncomingMessage;
  const url = conversationId
    ? API_ROUTES.conversations.messages(conversationId)
    : null;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<MessageWithSender[]>>(
    url,
    {
      revalidateOnFocus: true,
    },
  );

  const { isConnected, onMessage, onAiUpdate, onTypingEvent, sendTyping } = useSocket(conversationId);

  useEffect(() => {
    onMessage((newMsg: MessageWithSender) => {
      mutate(
        (currentData) => {
          const existing = currentData?.data ?? [];
          const filtered = existing.filter(
            (m) => m.id !== newMsg.id && !m.id.startsWith('temp-'),
          );
          return { data: [...filtered, newMsg] };
        },
        { revalidate: false },
      );

      if (onIncomingRef.current) onIncomingRef.current(newMsg);
    });
  }, [onMessage, mutate]);

  const sendMessage = useCallback(
    async (content: string, contentType: 'text' | 'image' = 'text') => {
      if (!conversationId) return;

      const endpoint = API_ROUTES.conversations.messages(conversationId);

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
    onAiUpdate,
    onTypingEvent,
    sendTyping,
    mutate,
    sendMessage,
  };
}
