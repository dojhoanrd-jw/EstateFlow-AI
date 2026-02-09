'use client';

import { cn } from '@/frontend/lib/utils';

interface ChatMessageProps {
  senderType: 'agent' | 'lead';
  senderName: string;
  content: string;
  contentType: 'text' | 'image';
  createdAt: string;
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

export function ChatMessage({ senderType, senderName, content, contentType, createdAt }: ChatMessageProps) {
  const isLead = senderType === 'lead';

  return (
    <div className={cn('flex w-full py-1', isLead ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[80%]">
        <p className={cn(
          'mb-1 text-[10px] font-medium px-1',
          isLead ? 'text-right text-slate-500' : 'text-slate-500',
        )}>
          {senderName}
        </p>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5',
            isLead
              ? 'rounded-br-sm bg-teal-600 text-white'
              : 'rounded-bl-sm bg-slate-800 text-slate-100 ring-1 ring-slate-700/50',
          )}
        >
          {contentType === 'image' && /^(https?:\/\/|data:image\/)/i.test(content) ? (
            <img src={content} alt="" className="max-h-48 rounded-lg object-cover" loading="lazy" />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
          )}
        </div>
        <p className={cn(
          'mt-0.5 text-[10px] px-1',
          isLead ? 'text-right text-slate-600' : 'text-slate-600',
        )}>
          {timeAgo(createdAt)}
        </p>
      </div>
    </div>
  );
}
