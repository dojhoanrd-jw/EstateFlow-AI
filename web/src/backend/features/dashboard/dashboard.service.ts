import { dashboardRepository } from './dashboard.repository';
import type { DashboardStats, UserRole } from '@/shared/types';

export const dashboardService = {
  async getDashboardStats(
    userId: string,
    role: UserRole,
  ): Promise<DashboardStats> {
    const agentId = role === 'agent' ? userId : null;

    return dashboardRepository.getStats(agentId);
  },
};
