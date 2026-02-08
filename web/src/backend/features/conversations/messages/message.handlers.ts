import { withAuth, type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { apiSuccess, apiCreated, apiError } from '@/backend/server/lib/api-response';
import { messageService } from './message.service';
import { createMessageSchema } from '@/shared/validations/schemas';
import { paginationSchema } from '@/shared/validations/common';
import { ApiError } from '@/backend/server/lib/api-error';
import { broadcastToConversation } from '@/backend/server/socket/io';
import { triggerAIAnalysis } from '@/backend/features/conversations/ai-analysis';

type RouteContext = { params: Promise<Record<string, string>> };

// ---------------------------------------------------------------------------
// GET /api/conversations/[id]/messages
// ---------------------------------------------------------------------------

export const GET = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: conversationId } = await context.params;
    if (!conversationId) throw ApiError.badRequest('Missing conversation ID');
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
    const { id: conversationId } = await context.params;
    if (!conversationId) throw ApiError.badRequest('Missing conversation ID');
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
    triggerAIAnalysis(conversationId).catch(() => {});

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
    const { id: conversationId } = await context.params;
    if (!conversationId) throw ApiError.badRequest('Missing conversation ID');

    await messageService.markConversationAsRead(
      conversationId,
      req.user.id,
      req.user.role,
    );

    return apiSuccess(null, 204);
  } catch (error) {
    return apiError(error);
  }
});
