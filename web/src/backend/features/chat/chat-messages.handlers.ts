import { type NextRequest } from 'next/server';
import { apiSuccess, apiCreated, apiError } from '@/backend/server/lib/api-response';
import { publicChatMessageSchema } from '@/shared/validations/schemas';
import { paginationSchema, uuidSchema } from '@/shared/validations/common';
import { chatService } from './chat.service';
import { broadcastToConversation } from '@/backend/server/socket/io';
import { debouncedTriggerAIAnalysis } from '@/backend/features/conversations/ai-analysis';
import type { RouteContext } from '@/shared/types';

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { token: rawToken } = await context.params;
    const token = uuidSchema.parse(rawToken);
    const { searchParams } = new URL(req.url);

    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const { messages, meta } = await chatService.getMessages(token, page, limit);

    return apiSuccess(messages, 200, meta);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { token: rawToken } = await context.params;
    const token = uuidSchema.parse(rawToken);
    const body = await req.json();
    const data = publicChatMessageSchema.parse(body);

    const message = await chatService.sendMessage(token, data);

    broadcastToConversation(message.conversation_id, 'new_message', message);
    debouncedTriggerAIAnalysis(message.conversation_id);

    return apiCreated(message);
  } catch (error) {
    return apiError(error);
  }
}
