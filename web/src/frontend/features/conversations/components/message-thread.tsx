'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { parseISO, format, isSameDay } from 'date-fns';
import { Skeleton } from '@/frontend/components/ui/skeleton';
import { cn } from '@/frontend/lib/utils';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import type { MessageWithSender } from '@/shared/types';

// ============================================
// Types
// ============================================

interface TypingUser {
  user_name: string;
  is_typing: boolean;
}

interface MessageThreadProps {
  messages: MessageWithSender[];
  isLoading: boolean;
  typingUsers: TypingUser[];
  conversationId: string | null;
  className?: string;
}

// ============================================
// Date separator
// ============================================

function DateSeparator({ date }: { date: string }) {
  const parsed = parseISO(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (isSameDay(parsed, today)) {
    label = 'Today';
  } else if (isSameDay(parsed, yesterday)) {
    label = 'Yesterday';
  } else {
    label = format(parsed, 'EEEE, MMM d, yyyy');
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
    </div>
  );
}

// ============================================
// Loading skeleton
// ============================================

function MessageThreadSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}
        >
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton
              className={cn(
                'h-16 rounded-2xl',
                i % 2 === 0 ? 'w-56 rounded-bl-md' : 'w-48 rounded-br-md',
              )}
            />
            <Skeleton className={cn('h-2.5 w-12', i % 2 !== 0 && 'ml-auto')} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Empty state: no conversation selected
// ============================================

function NoConversationSelected() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)]">
        <MessageSquare className="h-8 w-8 text-[var(--color-text-tertiary)]" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-[var(--color-text-primary)]">
        Select a conversation
      </h3>
      <p className="mt-2 max-w-xs text-sm text-[var(--color-text-tertiary)]">
        Choose a conversation from the list to start chatting with your leads.
      </p>
    </div>
  );
}

// ============================================
// Component
// ============================================

export function MessageThread({
  messages,
  isLoading,
  typingUsers,
  conversationId,
  className,
}: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, typingUsers.length]);

  // Scroll to bottom immediately when conversation changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [conversationId]);

  // If no conversation selected, show placeholder
  if (!conversationId) {
    return (
      <div className={cn('flex-1', className)}>
        <NoConversationSelected />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex-1 overflow-y-auto', className)} ref={scrollRef}>
        <MessageThreadSkeleton />
      </div>
    );
  }

  // Group messages by day for date separators
  let lastDate: string | null = null;

  return (
    <div className={cn('flex-1 overflow-y-auto', className)} ref={scrollRef}>
      <div className="space-y-3 p-4">
        {messages.map((message) => {
          const messageDate = message.created_at.split('T')[0];
          const showDateSeparator = messageDate !== lastDate;
          lastDate = messageDate;

          return (
            <div key={message.id}>
              {showDateSeparator && <DateSeparator date={message.created_at} />}
              <MessageBubble message={message} />
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && <TypingIndicator typingUsers={typingUsers} />}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
