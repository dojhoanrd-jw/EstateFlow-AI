'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { Avatar } from '@/frontend/components/ui/avatar';
import { useCurrentUser } from '@/frontend/features/auth/hooks/use-auth';

interface UserSectionProps {
  variant?: 'sidebar' | 'mobile';
}

export function UserSection({ variant = 'sidebar' }: UserSectionProps) {
  const { user } = useCurrentUser();

  const userName = user?.name ?? 'User';
  const userRole = user?.role ?? 'agent';
  const userAvatar = user?.image ?? null;

  const roleBadge = (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        userRole === 'admin'
          ? 'bg-amber-500/15 text-amber-400'
          : 'bg-teal-500/15 text-teal-400',
      )}
    >
      {userRole}
    </span>
  );

  if (variant === 'mobile') {
    return (
      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar name={userName} src={userAvatar} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            {roleBadge}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-800 p-4">
      <div className="flex items-center gap-3">
        <Avatar name={userName} src={userAvatar} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{userName}</p>
          {roleBadge}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors duration-[var(--transition-fast)] hover:bg-slate-800 hover:text-red-400"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
