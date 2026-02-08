'use client';

import useSWR from 'swr';
import { API_ROUTES } from '@/shared/routes/api.routes';
import type { DashboardStats, ApiResponse } from '@/shared/types';

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
