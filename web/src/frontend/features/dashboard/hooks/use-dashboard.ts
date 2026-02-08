'use client';

import useSWR from 'swr';
import { API_ROUTES } from '@/shared/routes/api.routes';
import type { DashboardStats, ApiResponse } from '@/shared/types';

// ============================================
// useDashboard hook
//
// Fetches real-time dashboard statistics.
// Auto-refreshes every 30 seconds to keep
// the dashboard data current.
// ============================================

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<DashboardStats>>(
    API_ROUTES.dashboard.stats,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    },
  );

  return {
    stats: data?.data ?? null,
    isLoading,
    error,
    mutate,
  };
}
