'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

interface UsePublicChatSocketOptions {
  chatToken: string;
  onNewMessage: (message: unknown) => void;
  onTyping?: (data: { userName: string; isTyping: boolean }) => void;
}

export function usePublicChatSocket({ chatToken, onNewMessage, onTyping }: UsePublicChatSocketOptions) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;
  const onTypingRef = useRef(onTyping);
  onTypingRef.current = onTyping;

  useEffect(() => {
    const socket = io('/public-chat', {
      path: process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: false,
      auth: { chat_token: chatToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('new_message', (data: unknown) => onNewMessageRef.current(data));
    socket.on('typing', (data: { userName: string; isTyping: boolean }) => {
      onTypingRef.current?.(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatToken]);

  const emitTyping = useCallback((userName: string) => {
    socketRef.current?.emit('typing', { userName, isTyping: true });
  }, []);

  return { connected, emitTyping };
}
