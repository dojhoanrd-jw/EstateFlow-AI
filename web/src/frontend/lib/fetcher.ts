import type { ApiErrorResponse } from '@/shared/types';

export class ApiError extends Error {
  status: number;
  code: string;
  issues?: { field: string; message: string }[];

  constructor(message: string, status: number, code: string, issues?: { field: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
      // Hang the promise to prevent further processing after redirect
      return new Promise(() => {});
    }

    let errorData: ApiErrorResponse | null = null;

    try {
      errorData = await response.json();
    } catch {
    }

    throw new ApiError(
      errorData?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorData?.error?.code ?? 'UNKNOWN_ERROR',
      errorData?.error?.issues,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return parseResponse<T>(response);
}

export async function apiGet<T>(url: string, params?: Record<string, string>): Promise<T> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';

  const response = await fetch(`${url}${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return parseResponse<T>(response);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

export async function apiDelete<T = void>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return parseResponse<T>(response);
}
