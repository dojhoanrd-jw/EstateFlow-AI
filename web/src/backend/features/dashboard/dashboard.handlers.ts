import { withAuth, type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { apiSuccess, apiError } from '@/backend/server/lib/api-response';
import { dashboardService } from './dashboard.service';

// ---------------------------------------------------------------------------
// GET /api/dashboard
// ---------------------------------------------------------------------------

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const stats = await dashboardService.getDashboardStats(
      req.user.id,
      req.user.role,
    );

    return apiSuccess(stats);
  } catch (error) {
    return apiError(error);
  }
});
