'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/frontend/components/ui/button';
import { cn } from '@/frontend/lib/utils';

// ============================================
// Types
// ============================================

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

// ============================================
// Component
// ============================================

export function MessageComposer({
  onSend,
  disabled = false,
  className,
}: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ----------------------------------------
  // Auto-resize textarea
  // ----------------------------------------

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  // ----------------------------------------
  // Submit handler
  // ----------------------------------------

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(trimmed);
      setContent('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsSending(false);
    }

    // Refocus the textarea
    textareaRef.current?.focus();
  }, [content, isSending, disabled, onSend]);

  // ----------------------------------------
  // Keyboard handler: Enter to send, Shift+Enter for newline
  // ----------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const canSend = content.trim().length > 0 && !isSending && !disabled;

  return (
    <div
      className={cn(
        'shrink-0 border-t border-[var(--color-border-default)]',
        'bg-[var(--color-bg-elevated)] px-4 py-3',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-end gap-2 rounded-xl border',
          'bg-[var(--color-bg-primary)]',
          disabled
            ? 'border-[var(--color-border-default)] opacity-50'
            : 'border-[var(--color-border-default)] focus-within:border-[var(--color-border-focus)] focus-within:ring-2 focus-within:ring-[var(--color-accent-500)]/25',
          'transition-all',
          'px-3 py-2',
        )}
      >
        <textarea
          ref={textareaRef}
          aria-label="Type a message"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Select a conversation to start chatting' : 'Type a message...'}
          disabled={disabled || isSending}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm leading-relaxed',
            'text-[var(--color-text-primary)]',
            'placeholder:text-[var(--color-text-tertiary)]',
            'focus:outline-none',
            'disabled:cursor-not-allowed',
            'max-h-40',
          )}
        />

        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!canSend}
          loading={isSending}
          className="shrink-0 rounded-lg"
          aria-label="Send message"
        >
          <Send size={14} />
        </Button>
      </div>

      <p className="mt-1.5 text-center text-[10px] text-[var(--color-text-tertiary)]">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
