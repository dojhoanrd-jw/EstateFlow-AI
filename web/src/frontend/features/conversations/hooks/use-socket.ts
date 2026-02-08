'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { MessageWithSender } from '@/shared/types';

// ============================================
// Types
// ============================================

interface TypingUser {
  user_name: string;
  is_typing: boolean;
}

// ============================================
// Singleton Socket.IO connection
// ============================================

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socketInstance;
}

// ============================================
// useSocket — Socket.IO powered
// ============================================

export function useSocket(conversationId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const prevRoomRef = useRef<string | null>(null);
  const onMessageRef = useRef<((msg: MessageWithSender) => void) | null>(null);

  useEffect(() => {
    if (!conversationId) {
      if (prevRoomRef.current && socketRef.current) {
        socketRef.current.emit('leave', prevRoomRef.current);
        prevRoomRef.current = null;
      }
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) setIsConnected(true);

    // Room management
    if (prevRoomRef.current && prevRoomRef.current !== conversationId) {
      socket.emit('leave', prevRoomRef.current);
    }
    socket.emit('join', conversationId);
    prevRoomRef.current = conversationId;

    // Listen for new messages
    const handleNewMessage = (data: MessageWithSender) => {
      if (onMessageRef.current) onMessageRef.current(data);
    };
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new_message', handleNewMessage);
    };
  }, [conversationId]);

  const onMessage = useCallback((handler: (msg: MessageWithSender) => void) => {
    onMessageRef.current = handler;
  }, []);

  const sendTyping = useCallback(
    (userName: string) => {
      if (socketRef.current?.connected && conversationId) {
        socketRef.current.emit('typing', {
          conversationId,
          userName,
          isTyping: true,
        });
      }
    },
    [conversationId],
  );

  return { isConnected, onMessage, sendTyping };
}

// ============================================
// useTypingIndicator (simulated for leads)
// ============================================

export function useTypingIndicator(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    };
  }, [conversationId]);

  useEffect(() => {
    setTypingUsers([]);
  }, [conversationId]);

  const emitTyping = useCallback(
    (leadName: string = 'Lead') => {
      if (!conversationId) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setTypingUsers([{ user_name: leadName, is_typing: true }]);

        const typingDuration = 2000 + Math.random() * 2000;
        clearTimeoutRef.current = setTimeout(() => {
          setTypingUsers([]);
        }, typingDuration);
      }, 800);
    },
    [conversationId],
  );

  return {
    typingUsers: typingUsers.filter((u) => u.is_typing),
    emitTyping,
  };
}
