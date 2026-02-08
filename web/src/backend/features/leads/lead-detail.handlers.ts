import { withAuth, type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { withPermission } from '@/backend/server/lib/with-permission';
import { apiSuccess, apiError } from '@/backend/server/lib/api-response';
import { leadService } from './lead.service';
import { updateLeadSchema } from '@/shared/validations/schemas';
import { uuidSchema } from '@/shared/validations/common';
import type { RouteContext } from '@/shared/types';

export const GET = withAuth(
  async (req: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id: rawId } = await context.params;
      const id = uuidSchema.parse(rawId);

      const lead = await leadService.getLeadById(id);

      return apiSuccess(lead);
    } catch (error) {
      return apiError(error);
    }
  },
);

export const PUT = withPermission(
  ['admin'],
  async (req: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id: rawId } = await context.params;
      const id = uuidSchema.parse(rawId);
      const body = await req.json();
      const data = updateLeadSchema.parse(body);

      const lead = await leadService.updateLead(id, data);

      return apiSuccess(lead);
    } catch (error) {
      return apiError(error);
    }
  },
);
