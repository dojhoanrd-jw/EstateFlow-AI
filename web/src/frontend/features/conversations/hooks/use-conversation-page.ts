'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ConversationWithLead } from '@/shared/types';
import { useCurrentUser } from '@/frontend/features/auth/hooks/use-auth';
import { useConversations, type ConversationFilters } from './use-conversations';
import { useMessages } from './use-messages';
import { useTypingIndicator } from './use-socket';
import { useMobileNavigation } from './use-mobile-navigation';
import { useConversationSync } from './use-conversation-sync';

const TYPING_DEBOUNCE_MS = 800;

export function useConversationPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ConversationFilters>({});
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  const { user } = useCurrentUser();

  const { conversations, isLoading: isLoadingConversations, error: conversationsError, mutate: mutateConversations } = useConversations(filters);

  const mobile = useMobileNavigation();

  const { handleIncomingMessage, markAsRead } = useConversationSync(conversations, mutateConversations);

  const { messages, isLoading: isLoadingMessages, error: messagesError, isConnected, onAiUpdate, onTypingEvent, sendTyping, sendMessage } = useMessages(selectedConversationId, handleIncomingMessage);

  const { typingUsers, showTyping, hideTyping } = useTypingIndicator(selectedConversationId);

  useEffect(() => {
    onTypingEvent((data) => {
      if (data.isTyping) {
        showTyping(data.userName);
      } else {
        hideTyping(data.userName);
      }
    });
  }, [onTypingEvent, showTyping, hideTyping]);

  const selectedConversation = useMemo<ConversationWithLead | null>(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  useEffect(() => {
    onAiUpdate(() => {
      mutateConversations();
    });
  }, [onAiUpdate, mutateConversations]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setSelectedConversationId(id);
      mobile.handleShowChat();
      markAsRead(id);
    },
    [markAsRead, mobile],
  );

  const handleToggleInfoPanel = useCallback(() => {
    setShowInfoPanel((prev) => !prev);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string, contentType: 'text' | 'image' = 'text') => {
      await sendMessage(content, contentType);
      if (selectedConversation) {
        showTyping(selectedConversation.lead_name);
      }
    },
    [sendMessage, showTyping, selectedConversation],
  );

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTyping = useCallback(() => {
    if (!user?.name) return;
    if (typingTimerRef.current) return;

    sendTyping(user.name);

    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
    }, TYPING_DEBOUNCE_MS);
  }, [sendTyping, user?.name]);

  const handleFilterChange = useCallback((newFilters: ConversationFilters) => {
    setFilters(newFilters);
  }, []);

  return {
    selectedConversationId,
    mobileView: mobile.mobileView,
    showInfoPanel,
    filters,
    conversations,
    isLoadingConversations,
    conversationsError,
    messages,
    isLoadingMessages,
    messagesError,
    isConnected,
    selectedConversation,
    typingUsers,
    retryConversations: mutateConversations,
    handleSelectConversation,
    handleBackToList: mobile.handleBackToList,
    handleToggleInfoPanel,
    handleShowInfoMobile: mobile.handleShowInfoMobile,
    handleCloseInfoMobile: mobile.handleCloseInfoMobile,
    handleSendMessage,
    handleTyping,
    handleFilterChange,
  };
}
