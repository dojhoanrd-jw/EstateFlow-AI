import { handlers } from "@/backend/features/auth/auth.config";
import { withRateLimit } from "@/backend/server/lib/rate-limit";

export const GET = handlers.GET;

// Rate-limit auth POST (login/credentials) — 5 attempts per 60s per IP
export const POST = withRateLimit(handlers.POST, {
  maxRequests: 5,
  windowMs: 60_000,
  prefix: 'auth',
});
