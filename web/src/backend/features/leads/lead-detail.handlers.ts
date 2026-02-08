import { withAuth, type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { withPermission } from '@/backend/server/lib/with-permission';
import { apiSuccess, apiError } from '@/backend/server/lib/api-response';
import { ApiError } from '@/backend/server/lib/api-error';
import { leadService } from './lead.service';
import { updateLeadSchema } from '@/shared/validations/schemas';

type RouteContext = { params: Promise<Record<string, string>> };

// ---------------------------------------------------------------------------
// GET /api/leads/[id]
// ---------------------------------------------------------------------------

export const GET = withAuth(
  async (req: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      if (!id) throw ApiError.badRequest('Missing resource ID');

      const lead = await leadService.getLeadById(id);

      return apiSuccess(lead);
    } catch (error) {
      return apiError(error);
    }
  },
);

// ---------------------------------------------------------------------------
// PUT /api/leads/[id]  (admin only)
// ---------------------------------------------------------------------------

export const PUT = withPermission(
  ['admin'],
  async (req: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      if (!id) throw ApiError.badRequest('Missing resource ID');
      const body = await req.json();
      const data = updateLeadSchema.parse(body);

      const lead = await leadService.updateLead(id, data);

      return apiSuccess(lead);
    } catch (error) {
      return apiError(error);
    }
  },
);
