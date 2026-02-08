import { type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { withPermission } from '@/backend/server/lib/with-permission';
import { apiSuccess, apiError } from '@/backend/server/lib/api-response';
import { ApiError } from '@/backend/server/lib/api-error';
import { userService } from './user.service';
import { updateUserSchema } from '@/shared/validations/schemas';

type RouteContext = { params: Promise<Record<string, string>> };

// ---------------------------------------------------------------------------
// GET /api/users/[id]  (admin only)
// ---------------------------------------------------------------------------

export const GET = withPermission(
  ['admin'],
  async (req: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      if (!id) throw ApiError.badRequest('Missing resource ID');

      const user = await userService.getUserById(id);

      return apiSuccess(user);
    } catch (error) {
      return apiError(error);
    }
  },
);

// ---------------------------------------------------------------------------
// PUT /api/users/[id]  (admin only)
// ---------------------------------------------------------------------------

export const PUT = withPermission(
  ['admin'],
  async (req: AuthenticatedRequest, context: RouteContext) => {
    try {
      const { id } = await context.params;
      if (!id) throw ApiError.badRequest('Missing resource ID');
      const body = await req.json();
      const data = updateUserSchema.parse(body);

      const user = await userService.updateUser(id, data);

      return apiSuccess(user);
    } catch (error) {
      return apiError(error);
    }
  },
);
