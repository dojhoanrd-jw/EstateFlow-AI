'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { cn } from '@/frontend/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }

  return ctx;
}

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const typeClasses: Record<ToastType, string> = {
  success:
    'border-green-200 bg-white text-green-800 dark:border-green-800 dark:bg-green-950/80 dark:text-green-200',
  error:
    'border-red-200 bg-white text-red-800 dark:border-red-800 dark:bg-red-950/80 dark:text-red-200',
  info:
    'border-blue-200 bg-white text-blue-800 dark:border-blue-800 dark:bg-blue-950/80 dark:text-blue-200',
};

const iconColorClasses: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast: t, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(t.id), 200);
  }, [t.id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, t.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, t.duration]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(dismiss, 1500);
  };

  const Icon = iconMap[t.type];

  return (
    <div
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'pointer-events-auto flex w-80 items-start gap-3 rounded-lg border p-4',
        'shadow-[var(--shadow-lg)]',
        'transition-all duration-200',
        isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100 animate-in slide-in-from-right-full',
        typeClasses[t.type],
      )}
    >
      <Icon className={cn('mt-0.5 shrink-0', iconColorClasses[t.type])} size={18} />

      <p className="flex-1 text-sm leading-relaxed">{t.message}</p>

      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastProviderProps {
  children: ReactNode;
}

let idCounter = 0;

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `toast-${++idCounter}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctx: ToastContextValue = useMemo(
    () => ({
      toast: addToast,
      success: (msg: string, dur?: number) => addToast(msg, 'success', dur),
      error: (msg: string, dur?: number) => addToast(msg, 'error', dur),
      info: (msg: string, dur?: number) => addToast(msg, 'info', dur),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
