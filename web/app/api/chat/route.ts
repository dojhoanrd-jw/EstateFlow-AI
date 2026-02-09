import { withRateLimit } from '@/backend/server/lib/rate-limit';
import { POST as _POST } from '@/backend/features/chat/chat.handlers';

export const POST = withRateLimit(_POST, {
  maxRequests: 5,
  windowMs: 60_000,
  prefix: 'chat-start',
});
