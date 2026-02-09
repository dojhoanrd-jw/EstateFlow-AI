'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageSquare } from 'lucide-react';
import { parseISO, isSameDay } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/frontend/i18n/locale-context';
import { Skeleton } from '@/frontend/components/ui/skeleton';
import { cn } from '@/frontend/lib/utils';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import type { MessageWithSender, TypingUser } from '@/shared/types';

interface MessageThreadProps {
  messages: MessageWithSender[];
  isLoading: boolean;
  typingUsers: TypingUser[];
  conversationId: string | null;
  className?: string;
}

type ThreadItem =
  | { type: 'date'; date: string }
  | { type: 'message'; message: MessageWithSender };

function buildItems(messages: MessageWithSender[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  let lastDate: string | null = null;

  for (const message of messages) {
    const messageDate = message.created_at.split('T')[0] ?? '';
    if (messageDate !== lastDate) {
      items.push({ type: 'date', date: message.created_at });
      lastDate = messageDate;
    }
    items.push({ type: 'message', message });
  }

  return items;
}

function DateSeparator({ date }: { date: string }) {
  const t = useTranslations('conversations');
  const { locale } = useLocale();
  const parsed = parseISO(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (isSameDay(parsed, today)) {
    label = t('today');
  } else if (isSameDay(parsed, yesterday)) {
    label = t('yesterday');
  } else {
    label = parsed.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
    </div>
  );
}

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

function NoConversationSelected() {
  const t = useTranslations('conversations');

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)]">
        <MessageSquare className="h-8 w-8 text-[var(--color-text-tertiary)]" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-[var(--color-text-primary)]">
        {t('selectConversation')}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-[var(--color-text-tertiary)]">
        {t('selectConversationDesc')}
      </p>
    </div>
  );
}

export function MessageThread({
  messages,
  isLoading,
  typingUsers,
  conversationId,
  className,
}: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => buildItems(messages), [messages]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const item = items[index];
      return item?.type === 'date' ? 44 : 80;
    },
    overscan: 10,
    getItemKey: (index) => {
      const item = items[index];
      if (!item) return index;
      return item.type === 'date' ? `date-${item.date}` : item.message.id;
    },
  });

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, typingUsers.length]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [conversationId]);

  if (!conversationId) {
    return (
      <div className={cn('flex-1', className)}>
        <NoConversationSelected />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('flex-1 overflow-y-auto', className)} ref={scrollRef}>
        <MessageThreadSkeleton />
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto', className)} ref={scrollRef}>
      <div aria-live="polite" aria-relevant="additions">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            if (!item) return null;

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="px-4 py-1.5"
              >
                {item.type === 'date' ? (
                  <DateSeparator date={item.date} />
                ) : (
                  <MessageBubble message={item.message} />
                )}
              </div>
            );
          })}
        </div>

        {typingUsers.length > 0 && (
          <div className="px-4 py-1.5">
            <TypingIndicator typingUsers={typingUsers} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
