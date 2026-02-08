'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ConversationWithLead } from '@/shared/types';
import { useConversations, type ConversationFilters } from './use-conversations';
import { useMessages } from './use-messages';
import { useTypingIndicator } from './use-socket';
import { useMobileNavigation } from './use-mobile-navigation';
import { useConversationSync } from './use-conversation-sync';

export function useConversationPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ConversationFilters>({});
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  const { conversations, isLoading: isLoadingConversations, error: conversationsError, mutate: mutateConversations } = useConversations(filters);

  const mobile = useMobileNavigation();

  const { handleIncomingMessage, markAsRead } = useConversationSync(conversations, mutateConversations);

  const { messages, isLoading: isLoadingMessages, error: messagesError, isConnected, onAiUpdate, sendMessage } = useMessages(selectedConversationId, handleIncomingMessage);

  const { typingUsers, emitTyping } = useTypingIndicator(selectedConversationId);

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
    async (content: string) => {
      await sendMessage(content);
      if (selectedConversation) {
        emitTyping(selectedConversation.lead_name);
      }
    },
    [sendMessage, emitTyping, selectedConversation],
  );

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
    handleFilterChange,
  };
}
