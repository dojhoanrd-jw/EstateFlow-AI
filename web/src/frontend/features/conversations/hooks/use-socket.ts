'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { MessageWithSender, TypingUser } from '@/shared/types';
import { socketConfig } from '@/frontend/config/socket';

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(socketConfig);
  }
  return socketInstance;
}

export function useSocket(conversationId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const prevRoomRef = useRef<string | null>(null);
  const onMessageRef = useRef<((msg: MessageWithSender) => void) | null>(null);
  const onAiUpdateRef = useRef<(() => void) | null>(null);

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
    const handleError = (err: Error) => {
      console.error('[Socket.IO] error:', err.message);
    };
    const handleConnectError = (err: Error) => {
      console.error('[Socket.IO] connect_error:', err.message);
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
    socket.on('connect_error', handleConnectError);

    if (socket.connected) setIsConnected(true);

    if (prevRoomRef.current && prevRoomRef.current !== conversationId) {
      socket.emit('leave', prevRoomRef.current);
    }
    socket.emit('join', conversationId);
    prevRoomRef.current = conversationId;

    const handleNewMessage = (data: MessageWithSender) => {
      if (onMessageRef.current) onMessageRef.current(data);
    };
    socket.on('new_message', handleNewMessage);

    const handleAiUpdate = () => {
      if (onAiUpdateRef.current) onAiUpdateRef.current();
    };
    socket.on('ai_update', handleAiUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
      socket.off('connect_error', handleConnectError);
      socket.off('new_message', handleNewMessage);
      socket.off('ai_update', handleAiUpdate);
    };
  }, [conversationId]);

  const onMessage = useCallback((handler: (msg: MessageWithSender) => void) => {
    onMessageRef.current = handler;
  }, []);

  const onAiUpdate = useCallback((handler: () => void) => {
    onAiUpdateRef.current = handler;
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

  return { isConnected, onMessage, onAiUpdate, sendTyping };
}

export function useTypingIndicator(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTypingUsers([]);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [conversationId]);

  const emitTyping = useCallback(
    (leadName: string = 'Lead') => {
      if (!conversationId) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setTypingUsers([{ user_name: leadName, is_typing: true }]);

      timeoutRef.current = setTimeout(() => {
        setTypingUsers([]);
      }, 3000);
    },
    [conversationId],
  );

  return {
    typingUsers: typingUsers.filter((u) => u.is_typing),
    emitTyping,
  };
}
