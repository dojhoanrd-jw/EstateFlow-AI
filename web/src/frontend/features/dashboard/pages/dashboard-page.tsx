'use client';

import { MessageSquare, MessageCircle, Flame, Clock, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/frontend/components/ui/skeleton';
import { Card, CardHeader, CardBody } from '@/frontend/components/ui/card';
import { useDashboard } from '../hooks/use-dashboard';
import { StatsCard } from '../components/stats-card';
import { PriorityChart } from '../components/priority-chart';
import { AgentPerformance } from '../components/agent-performance';
import { TopTags } from '../components/top-tags';

// ============================================
// Skeleton loaders
// ============================================

function StatsCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
      <div className="absolute inset-x-0 top-0 h-0.5 bg-[var(--color-bg-tertiary)]" />
    </Card>
  );
}

function PriorityChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-16" />
      </CardHeader>
      <CardBody className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function AgentPerformanceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-16" />
      </CardHeader>
      <CardBody className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function TopTagsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-4" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-6" />
            </div>
            <Skeleton className="ml-6 h-1.5 rounded-full" style={{ width: `${80 - i * 12}%` }} />
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function formatResponseTime(minutes: number): string {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

// ============================================
// DashboardPage
// ============================================

export function DashboardPage() {
  const { stats, isLoading, error, mutate } = useDashboard();

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <MessageCircle size={24} className="text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            Failed to load dashboard
          </h3>
          <p className="text-sm text-[var(--color-text-tertiary)] max-w-xs mx-auto">
            We couldn&apos;t fetch your dashboard data. Please check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent-600)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-700)] transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <PriorityChartSkeleton />
            <AgentPerformanceSkeleton />
          </div>
          <div>
            <TopTagsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            Real-time overview of your sales pipeline
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-3.5 py-1.5 self-start sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Live
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={MessageSquare}
          title="Total Conversations"
          value={stats?.total_conversations ?? 0}
          subtitle="All active conversations"
          color="blue"
        />
        <StatsCard
          icon={MessageCircle}
          title="Unreplied"
          value={stats?.unreplied_conversations ?? 0}
          subtitle="Awaiting agent response"
          color="red"
        />
        <StatsCard
          icon={Flame}
          title="Hot Leads Unattended"
          value={stats?.high_priority_unattended ?? 0}
          subtitle="High priority without reply"
          color="orange"
        />
        <StatsCard
          icon={Clock}
          title="Avg Response Time"
          value={formatResponseTime(stats?.avg_response_time_minutes ?? 0)}
          subtitle="Average first reply time"
          color="green"
        />
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {stats?.conversations_by_priority && (
            <PriorityChart data={stats.conversations_by_priority} />
          )}
          {stats?.conversations_by_agent && (
            <AgentPerformance agents={stats.conversations_by_agent} />
          )}
        </div>
        <div className="space-y-6">
          {stats?.top_tags && <TopTags tags={stats.top_tags} />}
        </div>
      </div>
    </div>
  );
}
