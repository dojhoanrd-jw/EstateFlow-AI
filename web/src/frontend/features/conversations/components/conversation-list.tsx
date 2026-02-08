'use client';

import { MessageSquare } from 'lucide-react';
import { Skeleton, SkeletonText } from '@/frontend/components/ui/skeleton';
import { cn } from '@/frontend/lib/utils';
import { ConversationFilters, type ConversationFilterValues } from './conversation-filters';
import { ConversationItem } from './conversation-item';
import type { ConversationWithLead } from '@/shared/types';

// ============================================
// Types
// ============================================

interface ConversationListProps {
  conversations: ConversationWithLead[];
  isLoading: boolean;
  selectedId: string | null;
  filters: ConversationFilterValues;
  onFilterChange: (filters: ConversationFilterValues) => void;
  onSelectConversation: (id: string) => void;
  className?: string;
}

// ============================================
// Loading skeleton
// ============================================

function ConversationListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3"
        >
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="flex gap-1.5">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Empty state
// ============================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)]">
        <MessageSquare className="h-7 w-7 text-[var(--color-text-tertiary)]" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-[var(--color-text-primary)]">
        {hasFilters ? 'No matching conversations' : 'No conversations yet'}
      </h3>
      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
        {hasFilters
          ? 'Try adjusting your filters to find what you are looking for.'
          : 'Conversations will appear here when leads start messaging.'}
      </p>
    </div>
  );
}

// ============================================
// Component
// ============================================

export function ConversationList({
  conversations,
  isLoading,
  selectedId,
  filters,
  onFilterChange,
  onSelectConversation,
  className,
}: ConversationListProps) {
  const hasFilters = Boolean(filters.priority || filters.tag || filters.search);

  return (
    <div
      className={cn(
        'flex h-full flex-col',
        'border-r border-[var(--color-border-default)]',
        'bg-[var(--color-bg-elevated)]',
        className,
      )}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--color-border-default)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Conversations
            </h2>
            {!isLoading && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] px-1.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
                {conversations.length}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3">
          <ConversationFilters
            conversations={conversations}
            value={filters}
            onChange={onFilterChange}
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ConversationListSkeleton />
        ) : conversations.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onClick={onSelectConversation}
            />
          ))
        )}
      </div>
    </div>
  );
}
