import { type NextRequest } from 'next/server';
import { apiCreated, apiError } from '@/backend/server/lib/api-response';
import { startPublicChatSchema } from '@/shared/validations/schemas';
import { chatService } from './chat.service';
import { debouncedTriggerAIAnalysis } from '@/backend/features/conversations/ai-analysis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = startPublicChatSchema.parse(body);

    const result = await chatService.startChat(data);

    debouncedTriggerAIAnalysis(result.conversation_id);

    return apiCreated(result);
  } catch (error) {
    return apiError(error);
  }
}
