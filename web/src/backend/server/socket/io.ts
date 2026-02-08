import type { Server as SocketIOServer } from 'socket.io';

/**
 * Retrieve the Socket.IO server instance attached by server.mjs.
 * Returns null if called before the server is initialized.
 */
export function getIO(): SocketIOServer | null {
  return (globalThis as Record<string, unknown>).__io as SocketIOServer | null ?? null;
}

/**
 * Broadcast an event to all clients in a conversation room.
 */
export function broadcastToConversation(
  conversationId: string,
  event: string,
  data: unknown,
): void {
  const io = getIO();
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit(event, data);
}
