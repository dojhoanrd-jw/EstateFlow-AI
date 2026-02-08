import type { SWRConfiguration } from 'swr';
import { fetcher } from '@/frontend/lib/fetcher';

export const swrConfig: SWRConfiguration = {
  fetcher,

  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,

  refreshInterval: 0,

  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 3000,

  dedupingInterval: 2000,

  keepPreviousData: true,
};
