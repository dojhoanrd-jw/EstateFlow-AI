'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/frontend/components/ui/avatar';
import { Badge } from '@/frontend/components/ui/badge';
import { cn, formatDate } from '@/frontend/lib/utils';
import { useTimestamp } from '@/frontend/hooks/use-timestamp';
import { useLocale } from '@/frontend/i18n/locale-context';
import { getTagLabel } from '@/frontend/i18n/tag-labels';
import type { ConversationWithLead } from '@/shared/types';

interface ConversationItemProps {
  conversation: ConversationWithLead;
  isSelected: boolean;
  onClick: (id: string) => void;
}

const PRIORITY_KEYS: Record<string, string> = {
  high: 'priorityHigh',
  medium: 'priorityMedium',
  low: 'priorityLow',
};

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  useTimestamp();
  const t = useTranslations('common');
  const { locale } = useLocale();

  const {
    id,
    lead_name,
    last_message,
    last_message_at,
    ai_priority,
    ai_tags,
    unread_count,
    is_read,
  } = conversation;

  const hasUnread = unread_count > 0 || !is_read;
  const displayTags = (ai_tags ?? []).slice(0, 2);

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      aria-current={isSelected ? 'true' : undefined}
      className={cn(
        'group w-full text-left px-4 py-3',
        'border-b border-[var(--color-border-subtle)]',
        'transition-colors duration-[var(--transition-fast)]',
        'hover:bg-[var(--color-bg-tertiary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-border-focus)]',
        isSelected && 'bg-[var(--color-accent-500)]/5 border-l-2 border-l-[var(--color-accent-600)]',
        !isSelected && 'border-l-2 border-l-transparent',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar name={lead_name} size="sm" />
          {hasUnread && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-accent-600)] ring-2 ring-[var(--color-bg-elevated)]"
              role="status"
              aria-label={t('unreadCount', { count: unread_count })}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'truncate text-sm',
                hasUnread
                  ? 'font-semibold text-[var(--color-text-primary)]'
                  : 'font-medium text-[var(--color-text-primary)]',
              )}
            >
              {lead_name}
            </span>
            {last_message_at && (
              <span className="shrink-0 text-[10px] text-[var(--color-text-tertiary)]">
                {formatDate(last_message_at, t, locale)}
              </span>
            )}
          </div>

          <p
            className={cn(
              'mt-0.5 truncate text-xs leading-relaxed',
              hasUnread
                ? 'font-medium text-[var(--color-text-secondary)]'
                : 'text-[var(--color-text-tertiary)]',
            )}
          >
            {last_message ?? t('noMessagesYet')}
          </p>

          <div className="mt-1.5 flex items-center gap-1.5">
            <Badge variant="priority" level={ai_priority} className="text-[10px] px-1.5 py-0">
              {t(PRIORITY_KEYS[ai_priority] ?? 'priorityLow')}
            </Badge>

            {displayTags.map((tag) => (
              <Badge key={tag} variant="tag" tag={tag} className="text-[10px] px-1.5 py-0">
                {getTagLabel(tag, locale)}
              </Badge>
            ))}

            {unread_count > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent-600)] px-1.5 text-[10px] font-bold text-white">
                {unread_count > 99 ? '99+' : unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
});
