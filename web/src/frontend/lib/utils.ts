import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNowStrict, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ConversationPriority } from '@/shared/types';

// ============================================
// Class name composition
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Date formatting - relative time
// ============================================

export function formatDate(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(parsed)) return '';

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDistanceToNowStrict(parsed, {
    addSuffix: true,
    locale: es,
  });
}

// ============================================
// Currency formatting - MXN
// ============================================

const mxnFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return mxnFormatter.format(amount);
}

// ============================================
// Initials from name
// ============================================

export function getInitials(name: string): string {
  if (!name || !name.trim()) return '?';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ============================================
// Priority color classes
// ============================================

const priorityClasses: Record<ConversationPriority, string> = {
  high: 'bg-[var(--color-priority-high-bg)] text-[var(--color-priority-high-text)] border border-[var(--color-priority-high-border)]',
  medium: 'bg-[var(--color-priority-medium-bg)] text-[var(--color-priority-medium-text)] border border-[var(--color-priority-medium-border)]',
  low: 'bg-[var(--color-priority-low-bg)] text-[var(--color-priority-low-text)] border border-[var(--color-priority-low-border)]',
};

export function getPriorityColor(priority: ConversationPriority): string {
  return priorityClasses[priority] ?? priorityClasses.low;
}

// ============================================
// Tag color classes
// ============================================

const tagColorMap: Record<string, string> = {
  interesado: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  seguimiento: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  presupuesto: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  urgente: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  nuevo: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
  negociacion: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  visita: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  documentacion: 'bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400',
  cierre: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  perdido: 'bg-gray-50 text-gray-500 dark:bg-gray-900/20 dark:text-gray-400',
};

const fallbackTagColors = [
  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  'bg-lime-50 text-lime-700 dark:bg-lime-900/20 dark:text-lime-400',
  'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:text-fuchsia-400',
  'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
];

export function getTagColor(tag: string): string {
  const normalized = tag.toLowerCase().trim();

  if (tagColorMap[normalized]) {
    return tagColorMap[normalized];
  }

  // Deterministic fallback based on string hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }

  return fallbackTagColors[Math.abs(hash) % fallbackTagColors.length];
}
