'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/frontend/components/ui/button';

interface StartChatResult {
  chat_token: string;
  conversation_id: string;
  lead_id: string;
}

interface StartChatFormProps {
  onStarted: (result: StartChatResult & { name: string }) => void;
}

export function StartChatForm({ onStarted }: StartChatFormProps) {
  const t = useTranslations('publicChat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [project, setProject] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          project_interest: project.trim() || undefined,
          message: message.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message || t('errorGeneric'));
        return;
      }

      onStarted({ ...json.data, name: name.trim() });
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'h-10 w-full rounded-lg border border-slate-600/80 bg-slate-800/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-colors';

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/90 backdrop-blur-sm p-7 shadow-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/20">
          <MessageSquare className="h-5 w-5 text-teal-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-white tracking-tight">
            Estate<span className="text-teal-400">Flow</span>
          </p>
          <p className="text-xs text-slate-400">{t('subtitle')}</p>
        </div>
      </div>

      <h1 className="text-lg font-bold text-white mb-5">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">{t('nameLabel')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            required
            className={inputClass}
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">{t('emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">{t('phoneLabel')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 55 1234 5678"
              className={inputClass}
            />
          </div>
        </div>

        {/* Project */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">{t('projectLabel')}</label>
          <input
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Torre Alvarez, Lomas Verdes..."
            className={inputClass}
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">{t('messageLabel')}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('messagePlaceholder')}
            required
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-600/80 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={!name.trim() || !message.trim()}
          className="w-full"
        >
          {loading ? t('starting') : t('startChat')}
        </Button>
      </form>
    </div>
  );
}
