'use client';

import dynamic from 'next/dynamic';
import { ArrowLeft, PanelRightOpen, PanelRightClose, WifiOff } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { ErrorState } from '@/frontend/components/ui/error-state';
import { MESSAGES } from '@/shared/messages';
import { useConversationPage } from '../hooks/use-conversation-page';
import { ConversationList } from '../components/conversation-list';
import { MessageThread } from '../components/message-thread';
import { MessageComposer } from '../components/message-composer';

const LeadInfoPanel = dynamic(
  () => import('../components/lead-info-panel').then((m) => m.LeadInfoPanel),
  { ssr: false },
);

// ============================================
// ConversationsPage
//
// 3-column layout:
//   Left  (w-80)  : ConversationList
//   Center(flex-1) : MessageThread + MessageComposer
//   Right (w-80)  : LeadInfoPanel (AI components)
//
// Responsive:
//   mobile  (<768)  : 1 column with navigation
//   tablet  (768-1280): 2 columns (list + chat)
//   desktop (>1280) : 3 columns
// ============================================

export function ConversationsPage() {
  const {
    selectedConversationId,
    mobileView,
    showInfoPanel,
    filters,
    conversations,
    isLoadingConversations,
    conversationsError,
    messages,
    isLoadingMessages,
    isConnected,
    selectedConversation,
    typingUsers,
    retryConversations,
    handleSelectConversation,
    handleBackToList,
    handleToggleInfoPanel,
    handleShowInfoMobile,
    handleCloseInfoMobile,
    handleSendMessage,
    handleFilterChange,
  } = useConversationPage();

  if (conversationsError) {
    return (
      <ErrorState
        title="Failed to load conversations"
        description={MESSAGES.general.serverError}
        onRetry={() => retryConversations()}
        className="h-[calc(100vh-3.5rem)] lg:h-screen bg-[var(--color-bg-primary)]"
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Offline / reconnecting banner */}
      {selectedConversationId && !isConnected && (
        <div className="flex shrink-0 items-center justify-center gap-2 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" role="status">
          <WifiOff size={14} />
          Reconnecting — messages may be delayed
        </div>
      )}

      <div className="flex flex-1 min-h-0">
      {/* ============================================ */}
      {/* LEFT PANEL: Conversation List                */}
      {/* ============================================ */}
      <div
        className={cn(
          // Desktop: always visible, fixed width
          'hidden md:flex md:w-80 md:shrink-0',
          // Mobile: full width when list view is active
          mobileView === 'list' && 'flex !w-full md:!w-80',
        )}
      >
        <ConversationList
          conversations={conversations}
          isLoading={isLoadingConversations}
          selectedId={selectedConversationId}
          filters={filters}
          onFilterChange={handleFilterChange}
          onSelectConversation={handleSelectConversation}
          className="w-full"
        />
      </div>

      {/* ============================================ */}
      {/* CENTER PANEL: Message Thread + Composer       */}
      {/* ============================================ */}
      <div
        className={cn(
          // Desktop: always visible, fills remaining space
          'hidden md:flex md:flex-1 md:flex-col md:min-w-0',
          // Mobile: full width when chat view is active
          mobileView === 'chat' && 'flex !w-full flex-1 flex-col min-w-0',
        )}
      >
        {/* Mobile header with back button */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={handleBackToList}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {selectedConversation && (
            <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate mx-4">
              {selectedConversation.lead_name}
            </span>
          )}

          <button
            type="button"
            onClick={handleShowInfoMobile}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="View lead info"
          >
            <PanelRightOpen size={16} />
          </button>
        </div>

        {/* Desktop header with conversation name and info toggle */}
        {selectedConversation && (
          <div className="hidden md:flex shrink-0 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {selectedConversation.lead_name}
                </h2>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">
                  {selectedConversation.message_count} messages
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleInfoPanel}
              className="hidden xl:flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label={showInfoPanel ? 'Hide lead info' : 'Show lead info'}
            >
              {showInfoPanel ? (
                <>
                  <PanelRightClose size={14} />
                  Hide info
                </>
              ) : (
                <>
                  <PanelRightOpen size={14} />
                  Show info
                </>
              )}
            </button>
          </div>
        )}

        {/* Message thread */}
        <MessageThread
          messages={messages}
          isLoading={isLoadingMessages}
          typingUsers={typingUsers}
          conversationId={selectedConversationId}
        />

        {/* Message composer */}
        <MessageComposer
          onSend={handleSendMessage}
          disabled={!selectedConversationId}
        />
      </div>

      {/* ============================================ */}
      {/* RIGHT PANEL: Lead Info + AI Components       */}
      {/* ============================================ */}

      {/* Desktop: visible on xl+ when toggled on */}
      {showInfoPanel && (
        <div className="hidden xl:block xl:w-80 xl:shrink-0">
          <LeadInfoPanel
            conversation={selectedConversation}
            className="w-full"
          />
        </div>
      )}

      {/* Mobile: full-screen overlay when info view is active */}
      {mobileView === 'info' && (
        <div className="fixed inset-0 z-50 flex xl:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleCloseInfoMobile}
          />
          <div className="relative ml-auto h-full w-full max-w-sm animate-in slide-in-from-right">
            <LeadInfoPanel
              conversation={selectedConversation}
              onClose={handleCloseInfoMobile}
              className="w-full"
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
