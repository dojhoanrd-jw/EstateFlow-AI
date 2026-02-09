import { withRateLimit } from '@/backend/server/lib/rate-limit';
import {
  GET as _GET,
  POST as _POST,
} from '@/backend/features/chat/chat-messages.handlers';

export const GET = withRateLimit(_GET, {
  maxRequests: 30,
  windowMs: 60_000,
  prefix: 'chat-get',
});

export const POST = withRateLimit(_POST, {
  maxRequests: 20,
  windowMs: 60_000,
  prefix: 'chat-post',
});
