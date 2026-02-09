'use client';

import { Brain } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardBody } from '@/frontend/components/ui/card';
import { SkeletonText } from '@/frontend/components/ui/skeleton';
import { cn } from '@/frontend/lib/utils';

interface AISummaryProps {
  summary: string | null;
  className?: string;
}

export function AISummary({ summary, className }: AISummaryProps) {
  const t = useTranslations('conversations');

  return (
    <div
      className={cn(
        'relative rounded-xl p-[1px]',
        'bg-gradient-to-br from-[var(--color-accent-500)]/20 via-purple-500/20 to-[var(--color-accent-600)]/20',
        className,
      )}
    >
      <Card className="!border-0 !shadow-none">
        <CardBody className="!p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-accent-500)]/10">
              <Brain size={13} className="text-[var(--color-accent-600)]" />
            </div>
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
              {t('aiSummary')}
            </span>
          </div>

          {summary ? (
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {summary}
            </p>
          ) : (
            <div className="space-y-2">
              <SkeletonText lines={3} />
              <p className="text-[10px] text-[var(--color-text-tertiary)] italic">
                {t('aiSummaryPending')}
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
