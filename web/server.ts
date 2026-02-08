import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { decode } from 'next-auth/jwt';
import { Pool } from 'pg';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const secret = process.env.AUTH_SECRET;

// ---------------------------------------------------------------------------
// Database pool (used for Socket room authorization only)
// ---------------------------------------------------------------------------

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

async function canAccessConversation(
  userId: string,
  role: string,
  conversationId: string,
): Promise<boolean> {
  if (role === 'admin') return true;

  const { rows } = await pool.query<{ id: string }>(
    'SELECT id FROM conversations WHERE id = $1 AND assigned_agent_id = $2 LIMIT 1',
    [conversationId, userId],
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Cookie parser helper
// ---------------------------------------------------------------------------

function parseCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=').trim()) : null;
}

// ---------------------------------------------------------------------------
// Socket user data type
// ---------------------------------------------------------------------------

interface SocketUser {
  id: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Next.js + Socket.IO server
// ---------------------------------------------------------------------------

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

  // Store globally so API routes can access it
  (globalThis as Record<string, unknown>).__io = io;

  // -----------------------------------------------------------------------
  // Socket.IO auth middleware — verify NextAuth session before connection
  // -----------------------------------------------------------------------

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

      // Attach user data to socket for downstream use
      socket.data.user = {
        id: session.id as string,
        role: session.role as string,
      } satisfies SocketUser;

      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  // -----------------------------------------------------------------------
  // Socket.IO event handlers
  // -----------------------------------------------------------------------

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser | undefined;
    console.log(`[socket.io] connected: ${socket.id} (user: ${user?.id})`);

    socket.on('join', async (conversationId: string) => {
      if (!user) return;

      // Authorize: verify the user has access to this conversation
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
      socket.to(`conversation:${conversationId}`).emit('typing', {
        userName,
        isTyping,
      });
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`[socket.io] disconnected: ${socket.id} (${reason})`);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
