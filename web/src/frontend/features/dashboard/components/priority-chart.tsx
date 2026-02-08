import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { Card, CardHeader, CardTitle, CardBody } from '@/frontend/components/ui/card';

// ============================================
// Types
// ============================================

interface PriorityChartProps {
  data: {
    high: number;
    medium: number;
    low: number;
  };
  className?: string;
}

interface PriorityRow {
  key: 'high' | 'medium' | 'low';
  label: string;
  icon: typeof AlertTriangle;
  barColor: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
}

// ============================================
// Priority configuration
// ============================================

const priorities: PriorityRow[] = [
  {
    key: 'high',
    label: 'High',
    icon: AlertTriangle,
    barColor: 'bg-red-500 dark:bg-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/10',
    textColor: 'text-red-700 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
  {
    key: 'medium',
    label: 'Medium',
    icon: AlertCircle,
    barColor: 'bg-amber-500 dark:bg-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/10',
    textColor: 'text-amber-700 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  {
    key: 'low',
    label: 'Low',
    icon: CheckCircle2,
    barColor: 'bg-emerald-500 dark:bg-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
];

// ============================================
// Component
// ============================================

export function PriorityChart({ data, className }: PriorityChartProps) {
  const total = data.high + data.medium + data.low;
  const maxCount = Math.max(data.high, data.medium, data.low, 1);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Priority Distribution</CardTitle>
        <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
          {total} total
        </span>
      </CardHeader>

      <CardBody className="space-y-4">
        {priorities.map((priority) => {
          const count = data[priority.key];
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const barWidth = maxCount > 0 ? Math.max((count / maxCount) * 100, 2) : 2;
          const Icon = priority.icon;

          return (
            <div key={priority.key} className="space-y-2">
              {/* Label row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-md',
                      priority.bgColor,
                    )}
                  >
                    <Icon size={14} className={priority.textColor} />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {priority.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                    {count}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)] tabular-nums w-10 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    priority.barColor,
                  )}
                  style={{ width: `${barWidth}%` }}
                  role="meter"
                  aria-label={`${priority.label} priority: ${count} conversations (${percentage}%)`}
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={total}
                />
              </div>
            </div>
          );
        })}

        {/* Summary dots */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-[var(--color-border-subtle)]">
          {priorities.map((priority) => {
            const count = data[priority.key];
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={priority.key} className="flex items-center gap-1.5">
                <div className={cn('h-2 w-2 rounded-full', priority.dotColor)} />
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {priority.label} {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
