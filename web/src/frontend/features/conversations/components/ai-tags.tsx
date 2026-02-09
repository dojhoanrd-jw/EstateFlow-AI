'use client';

import { Tags } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/frontend/components/ui/badge';
import { cn } from '@/frontend/lib/utils';
import { useLocale } from '@/frontend/i18n/locale-context';
import { getTagLabel } from '@/frontend/i18n/tag-labels';

interface AITagsProps {
  tags: string[];
  className?: string;
}

export function AITags({ tags, className }: AITagsProps) {
  const t = useTranslations('common');
  const { locale } = useLocale();

  if (tags.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5 px-1">
        <Tags size={12} className="text-[var(--color-text-tertiary)]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {t('aiTags')}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="tag" tag={tag}>
            {getTagLabel(tag, locale)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
