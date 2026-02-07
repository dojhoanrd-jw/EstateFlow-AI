import { type NextRequest } from 'next/server';
import { type AuthenticatedRequest, type AuthenticatedUser } from './with-auth';
import { auth } from '@/backend/features/auth/auth.config';
import { ApiError } from './api-error';
import { apiError } from './api-response';

type Role = 'admin' | 'agent';

type HandlerFn = (
  req: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;

export function withPermission(allowedRoles: Role[], handler: HandlerFn) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    try {
      const session = await auth();

      if (!session?.user) {
        throw ApiError.unauthorized();
      }

      const user = session.user as AuthenticatedUser;

      if (!allowedRoles.includes(user.role)) {
        throw ApiError.forbidden(
          `Role '${user.role}' does not have access to this resource`,
        );
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user;

      return await handler(authenticatedReq, context);
    } catch (error) {
      return apiError(error);
    }
  };
}
