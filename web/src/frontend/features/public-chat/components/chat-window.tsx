'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/frontend/lib/utils';
import { ChatMessage } from './chat-message';
import { usePublicChatSocket } from '../hooks/use-public-chat-socket';

interface MessageItem {
  id: string;
  sender_type: 'agent' | 'lead';
  sender_name: string;
  content: string;
  content_type: 'text' | 'image';
  created_at: string;
}

interface ChatWindowProps {
  chatToken: string;
  conversationId: string;
  leadName: string;
  initialMessage: MessageItem | null;
}

const TYPING_DEBOUNCE_MS = 800;

export function ChatWindow({ chatToken, conversationId, leadName, initialMessage }: ChatWindowProps) {
  const t = useTranslations('publicChat');
  const [messages, setMessages] = useState<MessageItem[]>(initialMessage ? [initialMessage] : []);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [typingName, setTypingName] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seenIds = useRef(new Set<string>(initialMessage ? [initialMessage.id] : []));
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch existing messages on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/chat/${chatToken}/messages?limit=50`);
        if (!res.ok) return;
        const json = await res.json();
        const fetched = json.data as MessageItem[];
        setMessages(fetched);
        seenIds.current = new Set(fetched.map((m) => m.id));
      } catch {
        // keep initial message if fetch fails
      }
    }
    load();
  }, [chatToken]);

  const handleNewMessage = useCallback((data: unknown) => {
    const msg = data as MessageItem;
    if (!msg?.id) return;
    if (seenIds.current.has(msg.id)) return;
    seenIds.current.add(msg.id);
    setMessages((prev) => [...prev, msg]);
    setTypingName(null);
  }, []);

  const handleTyping = useCallback((data: { userName: string; isTyping: boolean }) => {
    if (data.isTyping) {
      setTypingName(data.userName);
      if (typingHideTimerRef.current) clearTimeout(typingHideTimerRef.current);
      typingHideTimerRef.current = setTimeout(() => {
        setTypingName(null);
      }, 3000);
    } else {
      setTypingName(null);
    }
  }, []);

  const { connected, emitTyping } = usePublicChatSocket({
    chatToken,
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
  });

  // Auto-scroll to bottom
  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingName]);

  // Instant scroll on initial load
  useEffect(() => {
    scrollToBottom('instant');
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [content]);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);

    if (!typingTimerRef.current) {
      emitTyping(leadName);
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null;
      }, TYPING_DEBOUNCE_MS);
    }
  }

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/chat/${chatToken}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, content_type: 'text' }),
      });

      if (res.ok) {
        const json = await res.json();
        const msg = json.data as MessageItem;
        if (!seenIds.current.has(msg.id)) {
          seenIds.current.add(msg.id);
          setMessages((prev) => [...prev, msg]);
        }
        setContent('');
      }
    } catch {
      // silent fail
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasAgentReply = messages.some((m) => m.sender_type === 'agent');

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-sm shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-700/50 bg-slate-800/80 px-5 py-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/20">
          <MessageSquare className="h-4 w-4 text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            Estate<span className="text-teal-400">Flow</span>
          </p>
          <p className="text-xs text-slate-400 truncate">{leadName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse')} />
          <span className="text-[11px] text-slate-400">
            {connected ? t('connected') : t('connecting')}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3" ref={scrollContainerRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 ring-1 ring-slate-700">
              <MessageSquare className="h-6 w-6 text-slate-500" />
            </div>
            <p className="mt-3 text-sm text-slate-500">{t('waitingAgent')}</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const isFirstInGroup = !prev || prev.sender_type !== msg.sender_type;
          const isLastInGroup = !next || next.sender_type !== msg.sender_type;

          return (
            <ChatMessage
              key={msg.id}
              senderType={msg.sender_type}
              senderName={msg.sender_name}
              content={msg.content}
              contentType={msg.content_type}
              createdAt={msg.created_at}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
              isFirstMessage={i === 0}
            />
          );
        })}

        {!hasAgentReply && messages.length > 0 && !typingName && (
          <div className="flex justify-center py-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 ring-1 ring-slate-700/50 px-4 py-2 text-xs text-slate-400">
              <span className="flex gap-0.5">
                <span className="h-1 w-1 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1 w-1 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1 w-1 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              {t('waitingAgent')}
            </span>
          </div>
        )}

        {typingName && (
          <div className="flex items-center gap-2 py-2 px-1">
            <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm bg-slate-800 ring-1 ring-slate-700/50 px-3.5 py-2.5">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-xs text-slate-400">{t('typing', { name: typingName })}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-slate-700/50 bg-slate-800/60 px-4 py-3">
        <div className="flex items-end gap-2 rounded-xl border border-slate-600/60 bg-slate-800/80 px-3 py-2 focus-within:border-teal-500/40 focus-within:ring-2 focus-within:ring-teal-500/15 transition-all">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage')}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none max-h-[120px]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!content.trim() || sending}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              content.trim() && !sending
                ? 'bg-teal-500 text-white hover:bg-teal-600'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed',
            )}
          >
            <Send size={14} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-600">{t('sendHint')}</p>
      </div>
    </div>
  );
}
