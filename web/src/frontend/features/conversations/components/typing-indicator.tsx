import { cn } from '@/frontend/lib/utils';
import type { TypingUser } from '@/shared/types';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  const activeTypers = typingUsers.filter((u) => u.is_typing);

  if (activeTypers.length === 0) return null;

  const names = activeTypers.map((u) => u.user_name);
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className={cn('flex items-center gap-2 px-4 py-2', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-2xl rounded-bl-md',
          'bg-[var(--color-bg-tertiary)] px-4 py-2.5',
          'shadow-[var(--shadow-sm)]',
        )}
      >
        <div className="flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-[typing-bounce_1.4s_ease-in-out_infinite]"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-[typing-bounce_1.4s_ease-in-out_infinite]"
            style={{ animationDelay: '200ms' }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-[typing-bounce_1.4s_ease-in-out_infinite]"
            style={{ animationDelay: '400ms' }}
          />
        </div>

        <span className="text-xs text-[var(--color-text-tertiary)]">
          {label}
        </span>
      </div>

      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[typing-bounce_1\\.4s_ease-in-out_infinite\\] {
            animation: none !important;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
