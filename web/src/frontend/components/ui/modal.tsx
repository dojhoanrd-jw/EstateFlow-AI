'use client';

import { useEffect, useRef, useCallback, type ReactNode, type KeyboardEvent } from 'react';
import { cn } from '@/frontend/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  closeOnBackdrop = true,
  size = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);

    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (!closeOnBackdrop) return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      if (e.target === dialog) {
        onClose();
      }
    },
    [closeOnBackdrop, onClose],
  );

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={cn(
        'fixed inset-0 m-0 h-screen w-screen max-h-none max-w-none',
        'bg-transparent p-0',

        'backdrop:bg-[var(--color-bg-overlay)] backdrop:backdrop-blur-sm',

        'open:animate-in open:fade-in-0',

        'flex items-center justify-center',
      )}
    >
      <div
        ref={panelRef}
        className={cn(
          'relative mx-4 w-full rounded-xl',
          'bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xl)]',
          'border border-[var(--color-border-default)]',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          'max-h-[85vh] overflow-hidden flex flex-col',
          sizeClasses[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </dialog>
  );
}

export function ModalHeader({ children, onClose, className }: ModalHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4',
        'border-b border-[var(--color-border-subtle)]',
        className,
      )}
    >
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        {children}
      </h2>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg',
            'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]',
            'hover:bg-[var(--color-bg-tertiary)]',
            'transition-colors',
          )}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4',
        'border-t border-[var(--color-border-subtle)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
