import type { SWRConfiguration } from 'swr';
import { fetcher } from '@/frontend/lib/fetcher';

export const swrConfig: SWRConfiguration = {
  fetcher,

  // Revalidation behavior
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,

  // No automatic polling by default.
  // Individual hooks can override this for real-time feeds.
  refreshInterval: 0,

  // Error retry with exponential backoff
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 3000,

  // Dedupe identical requests within 2 seconds
  dedupingInterval: 2000,

  // Keep previous data while revalidating for smoother UX
  keepPreviousData: true,
};
