import { useMemo } from 'react';
import { cn } from '@/frontend/lib/utils';
import { Card, CardHeader, CardTitle, CardBody } from '@/frontend/components/ui/card';
import { Avatar } from '@/frontend/components/ui/avatar';

// ============================================
// Types
// ============================================

interface AgentData {
  agent_id: string;
  agent_name: string;
  count: number;
  unreplied: number;
}

interface AgentPerformanceProps {
  agents: AgentData[];
  className?: string;
}

// ============================================
// Response rate color helper
// ============================================

function getRateColor(rate: number): string {
  if (rate >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getRateBgColor(rate: number): string {
  if (rate >= 90) return 'bg-emerald-50 dark:bg-emerald-900/20';
  if (rate >= 70) return 'bg-amber-50 dark:bg-amber-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
}

function getResponseRate(count: number, unreplied: number): number {
  return count > 0 ? Math.round(((count - unreplied) / count) * 100) : 100;
}

function getRateBarColor(rate: number): string {
  if (rate >= 90) return 'bg-emerald-500';
  if (rate >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

// ============================================
// Component
// ============================================

export function AgentPerformance({ agents, className }: AgentPerformanceProps) {
  // Sort agents by unreplied count (most unreplied first)
  const sortedAgents = useMemo(
    () => [...agents].sort((a, b) => b.unreplied - a.unreplied),
    [agents],
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
        <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
          {agents.length} agents
        </span>
      </CardHeader>

      {/* ====================================== */}
      {/* Desktop table (hidden on mobile)       */}
      {/* ====================================== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)]">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Agent
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Unreplied
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Response Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {sortedAgents.map((agent) => {
              const responseRate = getResponseRate(agent.count, agent.unreplied);

              return (
                <tr
                  key={agent.agent_id}
                  className="transition-colors hover:bg-[var(--color-bg-tertiary)]/50"
                >
                  {/* Agent */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={agent.agent_name} size="sm" />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {agent.agent_name}
                      </span>
                    </div>
                  </td>

                  {/* Total Conversations */}
                  <td className="px-6 py-3.5 text-right">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                      {agent.count}
                    </span>
                  </td>

                  {/* Unreplied */}
                  <td className="px-6 py-3.5 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                        agent.unreplied > 0
                          ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
                      )}
                    >
                      {agent.unreplied}
                    </span>
                  </td>

                  {/* Response Rate */}
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Mini progress bar */}
                      <div className="hidden lg:block h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            getRateBarColor(responseRate),
                          )}
                          style={{ width: `${responseRate}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          getRateColor(responseRate),
                        )}
                      >
                        {responseRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {sortedAgents.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-[var(--color-text-tertiary)]"
                >
                  No agent data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ====================================== */}
      {/* Mobile card layout                     */}
      {/* ====================================== */}
      <CardBody className="md:hidden space-y-3">
        {sortedAgents.map((agent) => {
          const responseRate = getResponseRate(agent.count, agent.unreplied);

          return (
            <div
              key={agent.agent_id}
              className="rounded-lg border border-[var(--color-border-subtle)] p-4 space-y-3"
            >
              {/* Agent name row */}
              <div className="flex items-center gap-3">
                <Avatar name={agent.agent_name} size="sm" />
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {agent.agent_name}
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    Total
                  </p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
                    {agent.count}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    Unreplied
                  </p>
                  <p
                    className={cn(
                      'text-lg font-bold tabular-nums',
                      agent.unreplied > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-[var(--color-text-primary)]',
                    )}
                  >
                    {agent.unreplied}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    Rate
                  </p>
                  <p className={cn('text-lg font-bold tabular-nums', getRateColor(responseRate))}>
                    {responseRate}%
                  </p>
                </div>
              </div>

              {/* Full-width progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    getRateBarColor(responseRate),
                  )}
                  style={{ width: `${responseRate}%` }}
                />
              </div>
            </div>
          );
        })}

        {sortedAgents.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">
            No agent data available
          </p>
        )}
      </CardBody>
    </Card>
  );
}
