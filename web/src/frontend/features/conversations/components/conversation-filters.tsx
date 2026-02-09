'use client';

import { useCallback, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Select } from '@/frontend/components/ui/select';
import { cn } from '@/frontend/lib/utils';
import { useLocale } from '@/frontend/i18n/locale-context';
import { getTagLabel } from '@/frontend/i18n/tag-labels';
import type { ConversationWithLead, ConversationPriority } from '@/shared/types';

export interface ConversationFilterValues {
  priority?: ConversationPriority;
  tag?: string;
  search?: string;
}

interface ConversationFiltersProps {
  conversations: ConversationWithLead[];
  value: ConversationFilterValues;
  onChange: (filters: ConversationFilterValues) => void;
  className?: string;
}

export function ConversationFilters({
  conversations,
  value,
  onChange,
  className,
}: ConversationFiltersProps) {
  const t = useTranslations('conversations');
  const { locale } = useLocale();
  const [searchInput, setSearchInput] = useState(value.search ?? '');

  const priorityOptions = useMemo(() => [
    { value: '', label: t('allPriorities') },
    { value: 'high', label: t('highPriority') },
    { value: 'medium', label: t('mediumPriority') },
    { value: 'low', label: t('lowPriority') },
  ], [t]);

  const tagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    conversations.forEach((conv) => {
      conv.ai_tags?.forEach((tag) => tagSet.add(tag));
    });

    const sorted = Array.from(tagSet).sort();
    return [
      { value: '', label: t('allTags') },
      ...sorted.map((tag) => ({
        value: tag,
        label: getTagLabel(tag, locale),
      })),
    ];
  }, [conversations, t, locale]);

  const handlePriorityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const priority = e.target.value as ConversationPriority | '';
      onChange({
        ...value,
        priority: priority || undefined,
      });
    },
    [value, onChange],
  );

  const handleTagChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const tag = e.target.value;
      onChange({
        ...value,
        tag: tag || undefined,
      });
    },
    [value, onChange],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const search = e.target.value;
      setSearchInput(search);
    },
    [],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onChange({
          ...value,
          search: searchInput.trim() || undefined,
        });
      }
    },
    [value, onChange, searchInput],
  );

  const handleSearchBlur = useCallback(() => {
    onChange({
      ...value,
      search: searchInput.trim() || undefined,
    });
  }, [value, onChange, searchInput]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          size={14}
        />
        <input
          type="text"
          aria-label={t('searchPlaceholder')}
          placeholder={t('searchPlaceholder')}
          value={searchInput}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          onBlur={handleSearchBlur}
          className={cn(
            'h-8 w-full rounded-md border pl-8 pr-3 text-xs',
            'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]',
            'placeholder:text-[var(--color-text-tertiary)]',
            'border-[var(--color-border-default)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-500)]/25',
            'focus:border-[var(--color-border-focus)]',
            'transition-colors',
          )}
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <Select
            options={priorityOptions}
            value={value.priority ?? ''}
            onChange={handlePriorityChange}
            className="!h-8 !rounded-md text-[11px] !pl-2.5 !pr-7"
          />
        </div>
        <div className="flex-1 min-w-0">
          <Select
            options={tagOptions}
            value={value.tag ?? ''}
            onChange={handleTagChange}
            className="!h-8 !rounded-md text-[11px] !pl-2.5 !pr-7"
          />
        </div>
      </div>
    </div>
  );
}
