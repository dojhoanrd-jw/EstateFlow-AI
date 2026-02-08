import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { Card } from '@/frontend/components/ui/card';

// ============================================
// Types
// ============================================

type StatsCardColor = 'blue' | 'red' | 'orange' | 'green' | 'violet' | 'amber';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  color?: StatsCardColor;
  className?: string;
}

// ============================================
// Color map
//
// Each accent color defines:
//   - iconBg:   soft background circle
//   - iconText: icon stroke color
//   - trend:    trend indicator color
// ============================================

const colorMap: Record<StatsCardColor, { iconBg: string; iconText: string; trend: string }> = {
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconText: 'text-blue-600 dark:text-blue-400',
    trend: 'text-blue-600 dark:text-blue-400',
  },
  red: {
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconText: 'text-red-600 dark:text-red-400',
    trend: 'text-red-600 dark:text-red-400',
  },
  orange: {
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    iconText: 'text-orange-600 dark:text-orange-400',
    trend: 'text-orange-600 dark:text-orange-400',
  },
  green: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    trend: 'text-emerald-600 dark:text-emerald-400',
  },
  violet: {
    iconBg: 'bg-violet-50 dark:bg-violet-900/20',
    iconText: 'text-violet-600 dark:text-violet-400',
    trend: 'text-violet-600 dark:text-violet-400',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconText: 'text-amber-600 dark:text-amber-400',
    trend: 'text-amber-600 dark:text-amber-400',
  },
};

// ============================================
// Component
// ============================================

export function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  color = 'blue',
  className,
}: StatsCardProps) {
  const colors = colorMap[color];
  const isTrendPositive = trend ? trend.value >= 0 : true;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="px-6 py-5">
        {/* Header row: icon + title */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              colors.iconBg,
            )}
          >
            <Icon size={20} className={colors.iconText} />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-tight">
            {title}
          </p>
        </div>

        {/* Value */}
        <div className="mt-4 flex items-end justify-between gap-2">
          <p className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {value}
          </p>

          {/* Trend indicator */}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                isTrendPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
              )}
            >
              {isTrendPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>
                {isTrendPositive ? '+' : ''}
                {trend.value}%
              </span>
            </div>
          )}
        </div>

        {/* Subtitle / description */}
        {subtitle && (
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Decorative accent bar at top */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-0.5',
          color === 'blue' && 'bg-blue-500',
          color === 'red' && 'bg-red-500',
          color === 'orange' && 'bg-orange-500',
          color === 'green' && 'bg-emerald-500',
          color === 'violet' && 'bg-violet-500',
          color === 'amber' && 'bg-amber-500',
        )}
      />
    </Card>
  );
}
