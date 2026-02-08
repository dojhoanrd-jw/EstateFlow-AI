import { withAuth, type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { apiSuccess, apiDeleted, apiError } from '@/backend/server/lib/api-response';
import { conversationService } from './conversation.service';
import { updateConversationSchema } from '@/shared/validations/schemas';
import { uuidSchema } from '@/shared/validations/common';
import type { RouteContext } from '@/shared/types';

// ---------------------------------------------------------------------------
// GET /api/conversations/[id]
// ---------------------------------------------------------------------------

export const GET = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: rawId } = await context.params;
    const id = uuidSchema.parse(rawId);

    const conversation = await conversationService.getConversationById(
      id,
      req.user.id,
      req.user.role,
    );

    return apiSuccess(conversation);
  } catch (error) {
    return apiError(error);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/conversations/[id]
// ---------------------------------------------------------------------------

export const PUT = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: rawId } = await context.params;
    const id = uuidSchema.parse(rawId);
    const body = await req.json();
    const data = updateConversationSchema.parse(body);

    const conversation = await conversationService.updateConversation(
      id,
      data,
      req.user.id,
      req.user.role,
    );

    return apiSuccess(conversation);
  } catch (error) {
    return apiError(error);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/conversations/[id]  (soft delete via archiving)
// ---------------------------------------------------------------------------

export const DELETE = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: rawId } = await context.params;
    const id = uuidSchema.parse(rawId);

    await conversationService.archiveConversation(
      id,
      req.user.id,
      req.user.role,
    );

    return apiDeleted();
  } catch (error) {
    return apiError(error);
  }
});
