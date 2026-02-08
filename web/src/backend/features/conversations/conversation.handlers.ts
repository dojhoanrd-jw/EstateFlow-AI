import { withAuth, type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { apiSuccess, apiCreated, apiError } from '@/backend/server/lib/api-response';
import { conversationService } from './conversation.service';
import {
  conversationFiltersSchema,
  createConversationSchema,
} from '@/shared/validations/schemas';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const filters = conversationFiltersSchema.parse({
      priority: searchParams.get('priority') ?? undefined,
      tag: searchParams.get('tag') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const { conversations, meta } = await conversationService.getConversations(
      req.user.id,
      req.user.role,
      filters,
    );

    return apiSuccess(conversations, 200, meta);
  } catch (error) {
    return apiError(error);
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const data = createConversationSchema.parse(body);

    const conversation = await conversationService.createConversation(data);

    return apiCreated(conversation);
  } catch (error) {
    return apiError(error);
  }
});
