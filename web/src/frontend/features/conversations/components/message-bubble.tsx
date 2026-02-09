'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { cn, formatDate } from '@/frontend/lib/utils';
import { useTimestamp } from '@/frontend/hooks/use-timestamp';
import { useLocale } from '@/frontend/i18n/locale-context';
import type { MessageWithSender } from '@/shared/types';

interface MessageBubbleProps {
  message: MessageWithSender;
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  useTimestamp();
  const t = useTranslations('common');
  const { locale } = useLocale();

  const { sender_type, sender_name, content, content_type, created_at } = message;

  const isAgent = sender_type === 'agent';

  return (
    <div
      className={cn(
        'flex w-full',
        isAgent ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5',
          'shadow-[var(--shadow-sm)]',
          isAgent
            ? 'rounded-br-md bg-[var(--color-accent-600)] text-white'
            : 'rounded-bl-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]',
        )}
      >
        <p
          className={cn(
            'mb-1 text-[10px] font-semibold leading-none',
            isAgent ? 'text-white/70' : 'text-[var(--color-text-tertiary)]',
          )}
        >
          {sender_name}
        </p>

        {content_type === 'image' ? (
          /^https?:\/\//i.test(content) ? (
            <img
              src={content}
              alt=""
              className="max-h-64 rounded-lg object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <p className="text-sm italic opacity-60">{t('invalidImage')}</p>
          )
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        )}

        <p
          className={cn(
            'mt-1 text-right text-[10px] leading-none',
            isAgent ? 'text-white/50' : 'text-[var(--color-text-tertiary)]',
          )}
        >
          {formatDate(created_at, t, locale)}
        </p>
      </div>
    </div>
  );
});
