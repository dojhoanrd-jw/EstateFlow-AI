import { NextResponse, type NextRequest } from 'next/server';
import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  let errorLogged = false;
  redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('error', (err) => {
    if (!errorLogged) { console.warn('[Redis rate-limit] unavailable:', err.message); errorLogged = true; }
  });

  redis.connect().catch(() => {
    redis?.disconnect();
    redis = null;
  });
  return redis;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

// Sliding-window rate limit via Redis sorted sets
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
    .zremrangebyscore(redisKey, 0, cutoff)
    .zcard(redisKey)
    .zadd(redisKey, now, `${now}:${Math.random()}`)
    .pexpire(redisKey, windowMs)
    .exec();

  const count = (results?.[1]?.[1] as number) ?? 0;

  if (count >= maxRequests) {
    await client.zremrangebyscore(redisKey, now, now);
    return { allowed: false, remaining: 0, resetMs: windowMs };
  }

  return {
    allowed: true,
    remaining: maxRequests - count - 1,
    resetMs: windowMs,
  };
}

// In-memory fallback when Redis is unavailable
interface WindowEntry { timestamps: number[] }
const memStore = new Map<string, WindowEntry>();
const MAX_MEM_ENTRIES = 10_000;
let lastCleanup = Date.now();

function checkRateLimitMemory(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    for (const [k, e] of memStore) {
      e.timestamps = e.timestamps.filter((t) => t > cutoff);
      if (e.timestamps.length === 0) memStore.delete(k);
    }
  }

  if (memStore.size > MAX_MEM_ENTRIES) {
    const excess = memStore.size - MAX_MEM_ENTRIES;
    let deleted = 0;
    for (const k of memStore.keys()) {
      if (deleted >= excess) break;
      memStore.delete(k);
      deleted++;
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

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [k, e] of memStore) {
    e.timestamps = e.timestamps.filter((t) => t > now - 120_000);
    if (e.timestamps.length === 0) memStore.delete(k);
  }
}, 60_000);
if (cleanupInterval.unref) cleanupInterval.unref();

// Uses Redis when available, otherwise falls back to in-memory
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
      // Redis down — fall back silently
    }
  }
  return checkRateLimitMemory(key, maxRequests, windowMs);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<Response>;

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  prefix?: string;
}

// Wraps a Next.js route handler with sliding-window rate limiting
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
