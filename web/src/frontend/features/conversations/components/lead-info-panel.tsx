'use client';

import {
  User,
  Mail,
  Phone,
  Building2,
  X,
} from 'lucide-react';
import { Card, CardBody } from '@/frontend/components/ui/card';
import { cn } from '@/frontend/lib/utils';
import { AISummary } from './ai-summary';
import { AITags } from './ai-tags';
import { AIPriorityBadge } from './ai-priority-badge';
import type { ConversationWithLead } from '@/shared/types';

// ============================================
// Types
// ============================================

interface LeadInfoPanelProps {
  conversation: ConversationWithLead | null;
  onClose?: () => void;
  className?: string;
}

// ============================================
// Info row helper
// ============================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value && value !== 0) return null;

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-tertiary)]">
        <Icon size={14} className="text-[var(--color-text-tertiary)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-[var(--color-text-primary)] break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================
// Empty state
// ============================================

function EmptyPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)]">
        <User className="h-7 w-7 text-[var(--color-text-tertiary)]" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-[var(--color-text-primary)]">
        Lead details
      </h3>
      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
        Select a conversation to view lead information.
      </p>
    </div>
  );
}

// ============================================
// Component
// ============================================

export function LeadInfoPanel({
  conversation,
  onClose,
  className,
}: LeadInfoPanelProps) {
  if (!conversation) {
    return (
      <div
        className={cn(
          'flex h-full flex-col',
          'border-l border-[var(--color-border-default)]',
          'bg-[var(--color-bg-elevated)]',
          className,
        )}
      >
        <EmptyPanel />
      </div>
    );
  }

  const {
    lead_name,
    lead_email,
    lead_phone,
    lead_project,
    ai_summary,
    ai_priority,
    ai_tags,
  } = conversation;

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-y-auto',
        'border-l border-[var(--color-border-default)]',
        'bg-[var(--color-bg-elevated)]',
        className,
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          Lead Info
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5 p-4">
        {/* Contact Info */}
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Contact Information
            </h3>
            <InfoRow icon={User} label="Name" value={lead_name} />
            <InfoRow icon={Mail} label="Email" value={lead_email} />
            <InfoRow icon={Phone} label="Phone" value={lead_phone} />
          </CardBody>
        </Card>

        {/* Project Details */}
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Project Interest
            </h3>
            <InfoRow icon={Building2} label="Project" value={lead_project} />
            {!lead_project && (
              <p className="text-xs text-[var(--color-text-tertiary)] italic">
                No project interest specified yet.
              </p>
            )}
          </CardBody>
        </Card>

        {/* AI Analysis */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] px-1">
            AI Analysis
          </h3>

          {/* AI Priority */}
          <AIPriorityBadge priority={ai_priority} />

          {/* AI Tags */}
          <AITags tags={ai_tags ?? []} />

          {/* AI Summary */}
          <AISummary summary={ai_summary} />
        </div>
      </div>
    </div>
  );
}
