import { type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { withPermission } from '@/backend/server/lib/with-permission';
import { apiSuccess, apiCreated, apiError } from '@/backend/server/lib/api-response';
import { userService } from './user.service';
import { createUserSchema } from '@/shared/validations/schemas';
import { paginationSchema } from '@/shared/validations/common';

// ---------------------------------------------------------------------------
// GET /api/users  (admin only)
// ---------------------------------------------------------------------------

export const GET = withPermission(
  ['admin'],
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);

      const { page, limit } = paginationSchema.parse({
        page: searchParams.get('page') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
      });

      const { users, meta } = await userService.getUsers(page, limit);

      return apiSuccess(users, 200, meta);
    } catch (error) {
      return apiError(error);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/users  (admin only)
// ---------------------------------------------------------------------------

export const POST = withPermission(
  ['admin'],
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = createUserSchema.parse(body);

      const user = await userService.createUser(data);

      return apiCreated(user);
    } catch (error) {
      return apiError(error);
    }
  },
);
