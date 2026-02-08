import { cn, getInitials } from '@/frontend/lib/utils';

// ============================================
// Types
// ============================================

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

// ============================================
// Size classes
// ============================================

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

// ============================================
// Deterministic background color from name
// ============================================

const avatarColors = [
  'bg-teal-600',
  'bg-emerald-600',
  'bg-cyan-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-purple-600',
  'bg-fuchsia-600',
  'bg-pink-600',
  'bg-rose-600',
  'bg-orange-600',
  'bg-amber-600',
];

const avatarColorCache = new Map<string, string>();

function getAvatarColor(name: string): string {
  const cached = avatarColorCache.get(name);
  if (cached) return cached;

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  const color = avatarColors[Math.abs(hash) % avatarColors.length] ?? 'bg-teal-600';
  avatarColorCache.set(name, color);
  return color;
}

// ============================================
// Component
// ============================================

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);

  if (src && /^https?:\/\//i.test(src)) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className={cn(
          'inline-flex shrink-0 rounded-full object-cover',
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'font-medium text-white select-none',
        sizeClasses[size],
        getAvatarColor(name),
        className,
      )}
      aria-label={name}
      role="img"
    >
      {initials}
    </span>
  );
}
