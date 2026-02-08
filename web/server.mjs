import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
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
  globalThis.__io = io;

  io.on('connection', (socket) => {
    console.log(`[socket.io] connected: ${socket.id}`);

    socket.on('join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', ({ conversationId, userName, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        userName,
        isTyping,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket.io] disconnected: ${socket.id} (${reason})`);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
