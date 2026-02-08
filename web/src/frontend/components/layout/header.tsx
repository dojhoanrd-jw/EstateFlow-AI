'use client';

import { Menu, Building2, Bell } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-primary)]/95 px-4 backdrop-blur-sm lg:hidden">
      <button
        onClick={onMenuToggle}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-600/15">
          <Building2 className="text-teal-600" size={16} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
          Estate<span className="text-teal-600">Flow</span>
        </span>
      </div>

      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
        aria-label="Notifications"
      >
        <Bell size={18} />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-500" />
      </button>
    </header>
  );
}
