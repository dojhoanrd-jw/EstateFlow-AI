import { type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { auth } from '@/backend/features/auth/auth.config';
import { ApiError } from './api-error';
import { apiError } from './api-response';
import type { RouteContext } from '@/shared/types';

const MAX_BODY_BYTES = 1_048_576; // 1 MB

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
}

export type AuthenticatedRequest = NextRequest & {
  user: AuthenticatedUser;
};

type HandlerFn = (
  req: AuthenticatedRequest,
  context: RouteContext,
) => Promise<Response>;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function validateOrigin(req: NextRequest): void {
  if (SAFE_METHODS.has(req.method)) return;

  const origin = req.headers.get('origin');
  if (!origin) return;

  const host = req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') ?? new URL(req.url).protocol.replace(':', '');
  const expected = host ? new URL(`${proto}://${host}`).origin : null;

  if (expected && origin !== expected) {
    throw ApiError.forbidden('Cross-origin request rejected');
  }
}

export function withAuth(handler: HandlerFn) {
  return async (
    req: NextRequest,
    context: RouteContext,
  ): Promise<Response> => {
    const requestId = req.headers.get('x-request-id') || randomUUID();
    try {
      validateOrigin(req);

      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
        throw ApiError.tooLarge('Request body too large (max 1 MB)');
      }

      const session = await auth();

      if (!session?.user) {
        throw ApiError.unauthorized();
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = session.user as AuthenticatedUser;

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
