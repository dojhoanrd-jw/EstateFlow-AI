import type { ManagerOptions, SocketOptions } from 'socket.io-client';

// ============================================
// Socket.IO client configuration
// ============================================

export const socketConfig: Partial<ManagerOptions & SocketOptions> = {
  path: process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io',
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
};
