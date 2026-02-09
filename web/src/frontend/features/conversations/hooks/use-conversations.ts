'use client';

import useSWR from 'swr';
import { API_ROUTES } from '@/shared/routes/api.routes';
import type { ConversationWithLead, ApiResponse } from '@/shared/types';

export interface ConversationFilters {
  priority?: 'high' | 'medium' | 'low';
  tag?: string;
  search?: string;
  assignment?: 'mine' | 'unassigned' | 'all';
}

function buildQueryString(filters: ConversationFilters): string {
  const params = new URLSearchParams();

  if (filters.assignment && filters.assignment !== 'mine') {
    params.set('assignment', filters.assignment);
  }

  if (filters.priority) {
    params.set('priority', filters.priority);
  }

  if (filters.tag) {
    params.set('tag', filters.tag);
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useConversations(filters: ConversationFilters = {}) {
  const queryString = buildQueryString(filters);
  const url = `${API_ROUTES.conversations.list}${queryString}`;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ConversationWithLead[]>>(url, {
    refreshInterval: 15_000,
  });

  return {
    conversations: data?.data ?? [],
    isLoading,
    error,
    mutate,
  };
}
