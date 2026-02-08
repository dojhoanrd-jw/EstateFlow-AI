import { type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { type AuthenticatedRequest, type AuthenticatedUser, validateOrigin } from './with-auth';
import { auth } from '@/backend/features/auth/auth.config';
import { ApiError } from './api-error';
import { apiError } from './api-response';
import type { RouteContext } from '@/shared/types';

const MAX_BODY_BYTES = 1_048_576; // 1 MB

type Role = 'admin' | 'agent';

type HandlerFn = (
  req: AuthenticatedRequest,
  context: RouteContext,
) => Promise<Response>;

export function withPermission(allowedRoles: Role[], handler: HandlerFn) {
  return async (
    req: NextRequest,
    context: RouteContext,
  ): Promise<Response> => {
    const requestId = req.headers.get('x-request-id') || randomUUID();
    try {
      validateOrigin(req);

      // Reject oversized request bodies
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
        throw ApiError.tooLarge('Request body too large (max 1 MB)');
      }

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

      const response = await handler(authenticatedReq, context);
      response.headers.set('X-Request-ID', requestId);
      return response;
    } catch (error) {
      const response = apiError(error);
      response.headers.set('X-Request-ID', requestId);
      return response;
    }
  };
}
