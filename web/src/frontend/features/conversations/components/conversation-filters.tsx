'use client';

import { useCallback, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Select } from '@/frontend/components/ui/select';
import { cn } from '@/frontend/lib/utils';
import type { ConversationWithLead, ConversationPriority } from '@/shared/types';

// ============================================
// Types
// ============================================

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

// ============================================
// Priority options
// ============================================

const priorityOptions = [
  { value: '', label: 'All priorities' },
  { value: 'high', label: 'High priority' },
  { value: 'medium', label: 'Medium priority' },
  { value: 'low', label: 'Low priority' },
];

// ============================================
// Component
// ============================================

export function ConversationFilters({
  conversations,
  value,
  onChange,
  className,
}: ConversationFiltersProps) {
  const [searchInput, setSearchInput] = useState(value.search ?? '');

  // Collect unique tags from all conversations
  const tagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    conversations.forEach((conv) => {
      conv.ai_tags?.forEach((tag) => tagSet.add(tag));
    });

    const sorted = Array.from(tagSet).sort();
    return [
      { value: '', label: 'All tags' },
      ...sorted.map((tag) => ({
        value: tag,
        label: tag.charAt(0).toUpperCase() + tag.slice(1),
      })),
    ];
  }, [conversations]);

  // ----------------------------------------
  // Handlers
  // ----------------------------------------

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
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-end',
        className,
      )}
    >
      {/* Search */}
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          size={15}
        />
        <input
          type="text"
          aria-label="Search conversations"
          placeholder="Search conversations..."
          value={searchInput}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          onBlur={handleSearchBlur}
          className={cn(
            'h-9 w-full rounded-lg border pl-9 pr-3 text-xs',
            'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]',
            'placeholder:text-[var(--color-text-tertiary)]',
            'border-[var(--color-border-default)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-500)]/25',
            'focus:border-[var(--color-border-focus)]',
            'transition-colors',
          )}
        />
      </div>

      {/* Priority filter */}
      <div className="w-full sm:w-36">
        <Select
          options={priorityOptions}
          value={value.priority ?? ''}
          onChange={handlePriorityChange}
          className="!h-9 text-xs"
        />
      </div>

      {/* Tag filter */}
      <div className="w-full sm:w-32">
        <Select
          options={tagOptions}
          value={value.tag ?? ''}
          onChange={handleTagChange}
          className="!h-9 text-xs"
        />
      </div>
    </div>
  );
}
