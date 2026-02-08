import { type NextRequest } from 'next/server';
import { auth } from '@/backend/features/auth/auth.config';
import { ApiError } from './api-error';
import { apiError } from './api-response';

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
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;

// ---------------------------------------------------------------------------
// CSRF: Origin-header validation for state-changing requests
// ---------------------------------------------------------------------------

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function validateOrigin(req: NextRequest): void {
  if (SAFE_METHODS.has(req.method)) return;

  const origin = req.headers.get('origin');
  // Allow same-origin requests (origin header is absent) and server-side calls
  if (!origin) return;

  const host = req.headers.get('host');
  const expected = host ? new URL(`https://${host}`).origin : null;

  if (expected && origin !== expected) {
    throw ApiError.forbidden('Cross-origin request rejected');
  }
}

export function withAuth(handler: HandlerFn) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    try {
      // Reject cross-origin state-changing requests (CSRF protection)
      validateOrigin(req);

      const session = await auth();

      if (!session?.user) {
        throw ApiError.unauthorized();
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = session.user as AuthenticatedUser;

      return await handler(authenticatedReq, context);
    } catch (error) {
      return apiError(error);
    }
  };
}
