'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, ImagePlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/frontend/components/ui/button';
import { cn } from '@/frontend/lib/utils';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface MessageComposerProps {
  onSend: (content: string, contentType?: 'text' | 'image') => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  className?: string;
}

export function MessageComposer({
  onSend,
  onTyping,
  disabled = false,
  className,
}: MessageComposerProps) {
  const t = useTranslations('conversations');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = useCallback(async () => {
    if (isSending || disabled) return;

    if (imagePreview) {
      setIsSending(true);
      try {
        await onSend(imagePreview, 'image');
        setImagePreview(null);
      } finally {
        setIsSending(false);
      }
      textareaRef.current?.focus();
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;

    setIsSending(true);
    try {
      await onSend(trimmed, 'text');
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsSending(false);
    }

    textareaRef.current?.focus();
  }, [content, imagePreview, isSending, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) return;
    if (file.size > MAX_IMAGE_SIZE) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const clearImage = useCallback(() => {
    setImagePreview(null);
  }, []);

  const canSend = (content.trim().length > 0 || !!imagePreview) && !isSending && !disabled;

  return (
    <div
      className={cn(
        'shrink-0 border-t border-[var(--color-border-default)]',
        'bg-[var(--color-bg-elevated)] px-4 py-3',
        className,
      )}
    >
      {imagePreview && (
        <div className="mb-2 inline-flex items-start gap-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-2">
          <img
            src={imagePreview}
            alt=""
            className="h-20 w-20 rounded-md object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            className="rounded-full p-0.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label={t('removeImage')}
          >
            <X size={14} />
          </button>
        </div>
      )}

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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          className="hidden"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className={cn(
            'shrink-0 rounded-md p-1.5 transition-colors',
            'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          aria-label={t('attachImage')}
        >
          <ImagePlus size={18} />
        </button>

        <textarea
          ref={textareaRef}
          aria-label={t('typeMessage')}
          value={content}
          onChange={(e) => { setContent(e.target.value); onTyping?.(); }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? t('selectToChat') : t('typeMessage')}
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
          aria-label={t('sendHint')}
        >
          <Send size={14} />
        </Button>
      </div>

      <p className="mt-1.5 text-center text-[10px] text-[var(--color-text-tertiary)]">
        {t('sendHint')}
      </p>
    </div>
  );
}
