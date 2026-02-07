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

export function withAuth(handler: HandlerFn) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    try {
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
