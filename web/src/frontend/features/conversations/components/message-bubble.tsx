import { cn, formatDate } from '@/frontend/lib/utils';
import type { MessageWithSender } from '@/shared/types';

// ============================================
// Types
// ============================================

interface MessageBubbleProps {
  message: MessageWithSender;
}

// ============================================
// Component
// ============================================

export function MessageBubble({ message }: MessageBubbleProps) {
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
        {/* Sender name */}
        <p
          className={cn(
            'mb-1 text-[10px] font-semibold leading-none',
            isAgent ? 'text-white/70' : 'text-[var(--color-text-tertiary)]',
          )}
        >
          {sender_name}
        </p>

        {/* Content */}
        {content_type === 'image' ? (
          <img
            src={content}
            alt="Shared image"
            className="max-h-64 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            'mt-1 text-right text-[10px] leading-none',
            isAgent ? 'text-white/50' : 'text-[var(--color-text-tertiary)]',
          )}
        >
          {formatDate(created_at)}
        </p>
      </div>
    </div>
  );
}
