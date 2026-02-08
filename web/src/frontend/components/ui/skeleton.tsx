import { cn } from '@/frontend/lib/utils';

// ============================================
// Base skeleton
// ============================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--color-bg-tertiary)]',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

// ============================================
// Text line skeleton
// ============================================

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2.5', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3.5',
            i === lines - 1 ? 'w-3/4' : 'w-full',
          )}
        />
      ))}
    </div>
  );
}

// ============================================
// Circle skeleton (avatars)
// ============================================

interface SkeletonCircleProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const circleSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function SkeletonCircle({ size = 'md', className }: SkeletonCircleProps) {
  return (
    <Skeleton
      className={cn('rounded-full', circleSizes[size], className)}
    />
  );
}

// ============================================
// Rectangle skeleton (cards, images)
// ============================================

interface SkeletonRectProps {
  className?: string;
}

export function SkeletonRect({ className }: SkeletonRectProps) {
  return <Skeleton className={cn('h-32 w-full rounded-lg', className)} />;
}
