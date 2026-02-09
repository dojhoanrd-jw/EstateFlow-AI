'use client';

import { cn } from '@/frontend/lib/utils';

interface ChatMessageProps {
  senderType: 'agent' | 'lead';
  senderName: string;
  content: string;
  contentType: 'text' | 'image';
  createdAt: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isFirstMessage?: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function ChatMessage({
  senderType, senderName, content, contentType, createdAt, isFirstInGroup, isLastInGroup, isFirstMessage,
}: ChatMessageProps) {
  const isLead = senderType === 'lead';

  return (
    <div className={cn(
      'flex w-full',
      isLead ? 'justify-end' : 'justify-start',
      isFirstMessage ? '' : isFirstInGroup ? 'mt-4' : 'mt-1',
    )}>
      <div className="max-w-[75%]">
        {isFirstInGroup && (
          <p className={cn(
            'mb-1 text-[11px] font-medium px-2',
            isLead ? 'text-right text-slate-400' : 'text-slate-400',
          )}>
            {senderName}
          </p>
        )}
        <div
          className={cn(
            'px-3.5 py-2',
            isLead
              ? 'bg-teal-600 text-white'
              : 'bg-slate-800 text-slate-100 ring-1 ring-slate-700/50',
            // Rounded corners based on position in group
            isLead
              ? cn(
                  'rounded-2xl',
                  isFirstInGroup && isLastInGroup && 'rounded-br-md',
                  isFirstInGroup && !isLastInGroup && 'rounded-br-md',
                  !isFirstInGroup && isLastInGroup && 'rounded-tr-md rounded-br-md',
                  !isFirstInGroup && !isLastInGroup && 'rounded-tr-md rounded-br-md',
                )
              : cn(
                  'rounded-2xl',
                  isFirstInGroup && isLastInGroup && 'rounded-bl-md',
                  isFirstInGroup && !isLastInGroup && 'rounded-bl-md',
                  !isFirstInGroup && isLastInGroup && 'rounded-tl-md rounded-bl-md',
                  !isFirstInGroup && !isLastInGroup && 'rounded-tl-md rounded-bl-md',
                ),
          )}
        >
          {contentType === 'image' && /^(https?:\/\/|data:image\/)/i.test(content) ? (
            <img src={content} alt="" className="max-h-48 rounded-lg object-cover" loading="lazy" />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
          )}
        </div>
        {isLastInGroup && (
          <p className={cn(
            'mt-1 text-[10px] px-2',
            isLead ? 'text-right text-slate-500' : 'text-slate-500',
          )}>
            {timeAgo(createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}
