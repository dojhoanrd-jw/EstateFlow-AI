const API_BASE = '/api';

export const API_ROUTES = {
  auth: {
    session: `${API_BASE}/auth/session`,
    signIn: `${API_BASE}/auth/signin`,
    signOut: `${API_BASE}/auth/signout`,
  },

  conversations: {
    list: `${API_BASE}/conversations`,
    detail: (id: string) => `${API_BASE}/conversations/${id}`,
    messages: (id: string) => `${API_BASE}/conversations/${id}/messages`,
    claim: (id: string) => `${API_BASE}/conversations/${id}/claim`,
  },

  leads: {
    list: `${API_BASE}/leads`,
    detail: (id: string) => `${API_BASE}/leads/${id}`,
  },

  users: {
    list: `${API_BASE}/users`,
    detail: (id: string) => `${API_BASE}/users/${id}`,
  },

  dashboard: {
    stats: `${API_BASE}/dashboard/stats`,
  },
} as const;
