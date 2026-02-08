'use client';

import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '@/frontend/lib/fetcher';
import { useToast } from '@/frontend/components/feedback/toast';

// ============================================
// Types
// ============================================

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

interface UseApiOptions {
  /** Show error toast automatically on failure. Defaults to true. */
  showErrorToast?: boolean;
  /** Show success toast on completion. Defaults to false. */
  successMessage?: string;
}

// ============================================
// Hook factory
// ============================================

function useApiCall<T>(
  apiFn: (...args: unknown[]) => Promise<T>,
  options: UseApiOptions = {},
): UseApiReturn<T> {
  const { showErrorToast = true, successMessage } = options;
  const toast = useToast();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFn(...args);
        setData(result);

        if (successMessage) {
          toast.success(successMessage);
        }

        return result;
      } catch (err) {
        const apiErr =
          err instanceof ApiError
            ? err
            : new ApiError(
                err instanceof Error ? err.message : 'An unexpected error occurred',
                500,
                'UNKNOWN_ERROR',
              );

        setError(apiErr);

        if (showErrorToast) {
          toast.error(apiErr.message);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFn, showErrorToast, successMessage, toast],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// ============================================
// Exported typed hooks
// ============================================

export function useApiGet<T>(url: string, options?: UseApiOptions) {
  return useApiCall<T>(
    (params?: unknown) => apiGet<T>(url, params as Record<string, string> | undefined),
    options,
  );
}

export function useApiPost<T>(url: string, options?: UseApiOptions) {
  return useApiCall<T>(
    (body?: unknown) => apiPost<T>(url, body),
    options,
  );
}

export function useApiPut<T>(url: string, options?: UseApiOptions) {
  return useApiCall<T>(
    (body?: unknown) => apiPut<T>(url, body),
    options,
  );
}

export function useApiDelete<T = void>(url: string, options?: UseApiOptions) {
  return useApiCall<T>(
    () => apiDelete<T>(url),
    options,
  );
}
