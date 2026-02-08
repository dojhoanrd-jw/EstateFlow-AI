import { dashboardRepository } from './dashboard.repository';
import type { DashboardStats, UserRole } from '@/shared/types';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const dashboardService = {
  /**
   * Retrieve dashboard statistics scoped by the caller's role.
   *
   * - Admin users receive system-wide aggregates (agentId = null).
   * - Agent users receive statistics limited to their own conversations.
   */
  async getDashboardStats(
    userId: string,
    role: UserRole,
  ): Promise<DashboardStats> {
    const agentId = role === 'agent' ? userId : null;

    return dashboardRepository.getStats(agentId);
  },
};
