import { NextResponse, type NextRequest } from 'next/server';
import Redis from 'ioredis';

// ---------------------------------------------------------------------------
// Redis-backed sliding-window rate limiter
//
// Uses a Redis sorted set per key. Each request adds a timestamped member;
// expired members are pruned atomically. Falls back to in-memory if
// REDIS_URL is not configured (dev / single-instance).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Redis client (singleton, lazy)
// ---------------------------------------------------------------------------

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  redis.on('error', (err) => {
    console.error('[Redis] connection error:', err.message);
  });

  redis.connect().catch(() => {});
  return redis;
}

// ---------------------------------------------------------------------------
// Rate limit result
// ---------------------------------------------------------------------------

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

// ---------------------------------------------------------------------------
// Redis implementation (sorted set sliding window)
// ---------------------------------------------------------------------------

async function checkRateLimitRedis(
  client: Redis,
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const cutoff = now - windowMs;
  const redisKey = `rl:${key}`;

  const results = await client
    .multi()
    .zremrangebyscore(redisKey, 0, cutoff)   // prune expired
    .zcard(redisKey)                          // current count
    .zadd(redisKey, now, `${now}:${Math.random()}`) // add this request
    .pexpire(redisKey, windowMs)              // auto-cleanup TTL
    .exec();

  const count = (results?.[1]?.[1] as number) ?? 0;

  if (count >= maxRequests) {
    // Remove the entry we just added — request is denied
    await client.zremrangebyscore(redisKey, now, now);
    return { allowed: false, remaining: 0, resetMs: windowMs };
  }

  return {
    allowed: true,
    remaining: maxRequests - count - 1,
    resetMs: windowMs,
  };
}

// ---------------------------------------------------------------------------
// In-memory fallback (for dev / no Redis)
// ---------------------------------------------------------------------------

interface WindowEntry { timestamps: number[] }
const memStore = new Map<string, WindowEntry>();
let lastCleanup = Date.now();

function checkRateLimitMemory(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Lazy cleanup every 60s
  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    for (const [k, e] of memStore) {
      e.timestamps = e.timestamps.filter((t) => t > cutoff);
      if (e.timestamps.length === 0) memStore.delete(k);
    }
  }

  let entry = memStore.get(key);
  if (!entry) { entry = { timestamps: [] }; memStore.set(key, entry); }
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0] ?? now;
    return { allowed: false, remaining: 0, resetMs: oldest + windowMs - now };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: maxRequests - entry.timestamps.length, resetMs: windowMs };
}

// ---------------------------------------------------------------------------
// Unified check (Redis → in-memory fallback)
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const client = getRedis();
  if (client?.status === 'ready') {
    try {
      return await checkRateLimitRedis(client, key, maxRequests, windowMs);
    } catch {
      // Redis down → fall back silently
    }
  }
  return checkRateLimitMemory(key, maxRequests, windowMs);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

// ---------------------------------------------------------------------------
// Higher-order wrapper for route handlers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<Response>;

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  /** Optional prefix to isolate rate limit buckets (e.g. 'auth', 'api') */
  prefix?: string;
}

/**
 * Wraps a Next.js route handler with rate limiting.
 *
 * Uses Redis when REDIS_URL is set, otherwise falls back to in-memory.
 */
export function withRateLimit<T extends RouteHandler>(handler: T, options: RateLimitOptions): T {
  const { maxRequests, windowMs, prefix = 'global' } = options;

  const wrapped = async (req: NextRequest, ...args: unknown[]) => {
    const ip = getClientIp(req);
    const key = `${prefix}:${ip}`;
    const result = await checkRateLimit(key, maxRequests, windowMs);

    if (!result.allowed) {
      return NextResponse.json(
        { error: { message: 'Too many requests', code: 'RATE_LIMITED' } },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(result.resetMs / 1000)),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    const response = await handler(req, ...args);
    response.headers.set('X-RateLimit-Limit', String(maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  };

  return wrapped as T;
}
