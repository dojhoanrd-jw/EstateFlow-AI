'use client';

import useSWR from 'swr';
import { API_ROUTES } from '@/shared/routes/api.routes';
import type { ConversationWithLead, ApiResponse } from '@/shared/types';

// ============================================
// Filter types
// ============================================

export interface ConversationFilters {
  priority?: 'high' | 'medium' | 'low';
  tag?: string;
  search?: string;
}

// ============================================
// Build query string from filters
// ============================================

function buildQueryString(filters: ConversationFilters): string {
  const params = new URLSearchParams();

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

// ============================================
// useConversations hook
// ============================================

export function useConversations(filters: ConversationFilters = {}) {
  const queryString = buildQueryString(filters);
  const url = `${API_ROUTES.conversations.list}${queryString}`;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<ConversationWithLead[]>>(url);

  return {
    conversations: data?.data ?? [],
    isLoading,
    error,
    mutate,
  };
}
