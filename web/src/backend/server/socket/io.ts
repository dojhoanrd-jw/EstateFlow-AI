import type { Server as SocketIOServer } from 'socket.io';

export function getIO(): SocketIOServer | null {
  return (globalThis as Record<string, unknown>).__io as SocketIOServer | null ?? null;
}

export function broadcastToConversation(
  conversationId: string,
  event: string,
  data: unknown,
): void {
  const io = getIO();
  if (!io) return;
  const room = `conversation:${conversationId}`;
  io.to(room).emit(event, data);
  io.of('/public-chat').to(room).emit(event, data);
}
