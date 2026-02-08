import { withAuth, type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { apiSuccess, apiCreated, apiDeleted, apiError } from '@/backend/server/lib/api-response';
import { messageService } from './message.service';
import { createMessageSchema } from '@/shared/validations/schemas';
import { paginationSchema, uuidSchema } from '@/shared/validations/common';
import { broadcastToConversation } from '@/backend/server/socket/io';
import { debouncedTriggerAIAnalysis } from '@/backend/features/conversations/ai-analysis';
import type { RouteContext } from '@/shared/types';

// ---------------------------------------------------------------------------
// GET /api/conversations/[id]/messages
// ---------------------------------------------------------------------------

export const GET = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: rawId } = await context.params;
    const conversationId = uuidSchema.parse(rawId);
    const { searchParams } = new URL(req.url);

    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const { messages, meta } = await messageService.getMessages(
      conversationId,
      req.user.id,
      req.user.role,
      page,
      limit,
    );

    return apiSuccess(messages, 200, meta);
  } catch (error) {
    return apiError(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/conversations/[id]/messages
// ---------------------------------------------------------------------------

export const POST = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: rawId } = await context.params;
    const conversationId = uuidSchema.parse(rawId);
    const body = await req.json();
    const data = createMessageSchema.parse(body);

    const message = await messageService.sendMessage(
      conversationId,
      req.user.id,
      req.user.role,
      data,
    );

    // Broadcast to WebSocket clients (in-process, no HTTP call)
    broadcastToConversation(conversationId, 'new_message', message);

    // Fire-and-forget AI re-analysis with updated conversation
    debouncedTriggerAIAnalysis(conversationId);

    return apiCreated(message);
  } catch (error) {
    return apiError(error);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/conversations/[id]/messages  — mark as read
// ---------------------------------------------------------------------------

export const PATCH = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: rawId } = await context.params;
    const conversationId = uuidSchema.parse(rawId);

    await messageService.markConversationAsRead(
      conversationId,
      req.user.id,
      req.user.role,
    );

    return apiDeleted();
  } catch (error) {
    return apiError(error);
  }
});
