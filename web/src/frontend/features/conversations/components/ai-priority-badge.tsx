'use client';

import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/frontend/components/ui/badge';
import { cn } from '@/frontend/lib/utils';
import type { ConversationPriority } from '@/shared/types';

interface AIPriorityBadgeProps {
  priority: ConversationPriority;
  className?: string;
}

const priorityConfig: Record<
  ConversationPriority,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    labelKey: string;
    descKey: string;
  }
> = {
  high: {
    icon: AlertTriangle,
    labelKey: 'highPriorityLabel',
    descKey: 'highPriorityDesc',
  },
  medium: {
    icon: Clock,
    labelKey: 'mediumPriorityLabel',
    descKey: 'mediumPriorityDesc',
  },
  low: {
    icon: CheckCircle,
    labelKey: 'lowPriorityLabel',
    descKey: 'lowPriorityDesc',
  },
};

export function AIPriorityBadge({ priority, className }: AIPriorityBadgeProps) {
  const t = useTranslations('conversations');
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-3',
        'bg-[var(--color-bg-primary)]',
        'border border-[var(--color-border-subtle)]',
        className,
      )}
    >
      <Badge variant="priority" level={priority} className="gap-1 px-2.5 py-1 text-xs">
        <Icon size={12} />
        {t(config.labelKey)}
      </Badge>
      <span className="text-[10px] text-[var(--color-text-tertiary)]">
        {t(config.descKey)}
      </span>
    </div>
  );
}
