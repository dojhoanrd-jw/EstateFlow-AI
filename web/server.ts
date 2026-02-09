import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { decode } from 'next-auth/jwt';
import Redis from 'ioredis';
import { db } from './src/backend/server/db/client';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const secret = process.env.AUTH_SECRET;

async function canAccessConversation(
  userId: string,
  role: string,
  conversationId: string,
): Promise<boolean> {
  if (role === 'admin') return true;

  const row = await db.queryOne<{ id: string }>(
    'SELECT id FROM conversations WHERE id = $1 AND (assigned_agent_id = $2 OR chat_token IS NOT NULL) LIMIT 1',
    [conversationId, userId],
  );
  return row !== null;
}

function parseCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=').trim()) : null;
}

interface SocketUser {
  id: string;
  role: string;
}

function createRedisAdapter(io: SocketIOServer): void {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return;

  try {
    const pubClient = new Redis(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => console.error('[Redis adapter pub]', err.message));
    subClient.on('error', (err) => console.error('[Redis adapter sub]', err.message));

    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('[socket.io] Redis adapter attached');
      })
      .catch((err) => {
        console.warn('[socket.io] Redis adapter unavailable, using in-memory:', err.message);
      });
  } catch {
    // Redis not available — single-instance mode
  }
}

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url ?? '/', true);
    handler(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    addTrailingSlash: false,
    cors: {
      origin: dev ? ['http://localhost:3000', 'http://localhost:3001'] : [],
      credentials: true,
    },
  });

  (globalThis as Record<string, unknown>).__io = io;

  createRedisAdapter(io);

  io.use(async (socket: Socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      // NextAuth v5 uses different cookie names in dev vs prod (HTTPS)
      const tokenValue =
        parseCookie(cookies, '__Secure-authjs.session-token') ||
        parseCookie(cookies, 'authjs.session-token');

      if (!tokenValue || !secret) {
        return next(new Error('Unauthorized'));
      }

      const salt = parseCookie(cookies, '__Secure-authjs.session-token')
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token';

      const session = await decode({ token: tokenValue, secret, salt });

      if (!session) {
        return next(new Error('Unauthorized'));
      }

      socket.data.user = {
        id: session.id as string,
        role: session.role as string,
      } satisfies SocketUser;

      next();
    } catch (err) {
      console.error('[socket.io] Auth error:', err);
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser | undefined;
    console.log(`[socket.io] connected: ${socket.id} (user: ${user?.id})`);

    socket.on('error', (err) => {
      console.error(`[socket.io] Socket error for ${socket.id}:`, err);
    });

    socket.on('join', async (conversationId: string) => {
      if (!user) return;

      const allowed = await canAccessConversation(user.id, user.role, conversationId);
      if (!allowed) {
        socket.emit('error', { message: 'Forbidden: cannot access this conversation' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', ({ conversationId, userName, isTyping }: {
      conversationId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      // Only broadcast if the socket is a member of the room (Fix #8)
      if (!socket.rooms.has(`conversation:${conversationId}`)) return;

      socket.to(`conversation:${conversationId}`).emit('typing', {
        userName,
        isTyping,
      });
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`[socket.io] disconnected: ${socket.id} (${reason})`);
    });
  });

  // --- Public chat namespace (auth via chat_token, no cookies) ---
  const publicChat = io.of('/public-chat');

  publicChat.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth as Record<string, unknown>)?.chat_token ??
        socket.handshake.query?.chat_token;

      if (!token || typeof token !== 'string') {
        return next(new Error('Missing chat_token'));
      }

      const row = await db.queryOne<{ id: string; lead_id: string }>(
        "SELECT id, lead_id FROM conversations WHERE chat_token = $1 AND status != 'archived' LIMIT 1",
        [token],
      );

      if (!row) {
        return next(new Error('Invalid or expired chat token'));
      }

      socket.data.conversationId = row.id;
      socket.data.leadId = row.lead_id;
      socket.data.chatToken = token;

      next();
    } catch (err) {
      console.error('[socket.io] Public chat auth error:', err);
      next(new Error('Authentication failed'));
    }
  });

  publicChat.on('connection', (socket) => {
    const { conversationId } = socket.data as { conversationId: string };
    console.log(`[socket.io] public-chat connected: ${socket.id} (conversation: ${conversationId})`);

    socket.join(`conversation:${conversationId}`);

    socket.on('disconnect', (reason: string) => {
      console.log(`[socket.io] public-chat disconnected: ${socket.id} (${reason})`);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  let isShuttingDown = false;

  async function shutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[shutdown] ${signal} received. Closing gracefully...`);

    httpServer.close(() => {
      console.log('[shutdown] HTTP server closed');
    });

    try {
      io.close();
      console.log('[shutdown] Socket.IO closed');
    } catch (err) {
      console.error('[shutdown] Socket.IO close error:', err);
    }

    try {
      await db.pool.end();
      console.log('[shutdown] DB pool closed');
    } catch (err) {
      console.error('[shutdown] DB pool close error:', err);
    }

    // Force exit after 10s if something hangs
    setTimeout(() => {
      console.error('[shutdown] Forced exit after timeout');
      process.exit(1);
    }, 10_000).unref();

    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
});
